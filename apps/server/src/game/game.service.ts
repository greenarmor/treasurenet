import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GeoService } from '../geo/geo.service';
import { EscrowService } from '../escrow/escrow.service';
import { StellarService } from '../common/stellar.service';
import type {
  CreateHuntRequest,
  NearbyHuntRequest,
  UnlockClueRequest,
  ClaimTreasureRequest,
} from '@treasurenet/shared';
import {
  isWithinRadius,
  haversineDistance,
} from '@treasurenet/shared';

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly geoService: GeoService,
    private readonly escrowService: EscrowService,
    private readonly stellar: StellarService,
    @InjectQueue('hunt-events') private readonly eventQueue: Queue,
  ) {}

  // ─── Create Hunt ───────────────────────────────────────────

  async createHunt(walletId: string, dto: CreateHuntRequest) {
    if (!dto.title || !dto.reward || !dto.treasureLocation) {
      throw new BadRequestException(['title, reward, and treasureLocation are required']);
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet?.roles.includes('GAME_MASTER')) {
      throw new ForbiddenException('Only Game Masters can create hunts');
    }

    // Generate a unique contract address for this GM's hunt
    const contractAddress = this.stellar.generateContractAddress(
      wallet.address,
      Date.now().toString(),
    );

    const { escrowContractId } = await this.escrowService.createEscrow(
      dto.reward,
      dto.rewardToken,
    );

    await this.prisma.escrowContract.update({
      where: { id: escrowContractId },
      data: { contractAddress },
    });

    const hunt = await this.prisma.treasureHunt.create({
      data: {
        orgId: 'default',
        ownerWalletId: walletId,
        escrowContractId,
        title: dto.title,
        description: dto.description,
        reward: dto.reward,
        rewardToken: dto.rewardToken,
        customTokenAddr: dto.customTokenAddress,
        difficulty: dto.difficulty,
        visibility: dto.visibility,
        treasureLat: dto.treasureLocation.latitude,
        treasureLng: dto.treasureLocation.longitude,
        treasureRadius: dto.treasureRadius,
        clueCount: dto.clues.length,
        expirationHours: dto.expirationHours,
        maxPlayers: dto.maxPlayers,
        imageUrls: dto.imageUrls || [],
        tags: dto.tags || [],
        clues: {
          create: dto.clues.map((clue: any) => ({
            sequence: clue.sequence,
            lat: clue.location.latitude,
            lng: clue.location.longitude,
            unlockRadius: clue.unlockRadius,
            hintText: clue.hintText,
            hintImageUrl: clue.hintImageUrl,
            hintAudioUrl: clue.hintAudioUrl,
            clueType: clue.clueType,
            unlockType: clue.unlockType,
            isFinal: clue.isFinal,
            puzzleData: (clue.puzzleData || {}) as any,
          })),
        },
      },
      include: { clues: { orderBy: { sequence: 'asc' } } },
    });

    await this.emitEvent('HUNT_CREATED', hunt.id, walletId, {
      huntId: hunt.id,
      contractAddress,
    });

    return {
      ...this.formatHunt(hunt),
      contractAddress,
      fundingInstructions: `Send ${dto.reward} XLM to ${contractAddress} on Stellar testnet to fund this hunt.`,
    };
  }

  // ─── Get Nearby Hunts ──────────────────────────────────────

  async getNearbyHunts(query: NearbyHuntRequest) {
    const { latitude, longitude, radiusKm = 10 } = query;

    const hunts = await this.prisma.treasureHunt.findMany({
      where: {
        status: 'ACTIVE',
        visibility: 'PUBLIC',
      },
      include: {
        clues: { orderBy: { sequence: 'asc' }, take: 1 },
        owner: { select: { address: true } },
      },
    });

    const nearby = hunts.filter((hunt: any) => {
      const distance = haversineDistance(
        { latitude, longitude },
        { latitude: hunt.treasureLat, longitude: hunt.treasureLng },
      );
      return distance <= radiusKm * 1000;
    });

    return nearby.map((hunt: any) => ({
      ...this.formatHunt(hunt),
      distance: haversineDistance(
        { latitude, longitude },
        { latitude: hunt.treasureLat, longitude: hunt.treasureLng },
      ),
    }));
  }

  // ─── Get Hunt by ID ────────────────────────────────────────

  async getHunt(huntId: string) {
    const hunt = await this.prisma.treasureHunt.findUnique({
      where: { id: huntId },
      include: {
        clues: { orderBy: { sequence: 'asc' } },
        owner: { select: { address: true } },
      },
    });

    if (!hunt) throw new NotFoundException('Hunt not found');
    return this.formatHunt(hunt);
  }

  // ─── Join Hunt ─────────────────────────────────────────────

  async joinHunt(huntId: string, walletId: string) {
    const hunt = await this.prisma.treasureHunt.findUnique({ where: { id: huntId } });
    if (!hunt) throw new NotFoundException('Hunt not found');
    if (hunt.status !== 'ACTIVE') throw new BadRequestException('Hunt is not active');

    // Players must use MOBILE wallet (not Freighter) to prevent GPS spoofing
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new BadRequestException('Wallet not found');
    if (!wallet.roles.includes('PLAYER')) {
      throw new ForbiddenException('Only players can join hunts');
    }
    if (wallet.walletType !== 'MOBILE') {
      throw new ForbiddenException('Players must use the mobile app to join hunts');
    }
    // Verify SBT on-chain or via DB status
    const hasSbt = wallet.sbtStatus === 'ISSUED' || wallet.sbtTokenId != null;
    if (!hasSbt) {
      throw new ForbiddenException('Soulbound Token required to participate');
    }

    const existing = await this.prisma.huntAttempt.findUnique({
      where: { huntId_playerWalletId: { huntId, playerWalletId: walletId } },
    });

    if (existing) return existing;

    const attempt = await this.prisma.huntAttempt.create({
      data: { huntId, playerWalletId: walletId },
    });

    await this.emitEvent('PLAYER_JOINED', huntId, walletId, { attemptId: attempt.id });

    return attempt;
  }

  // ─── Unlock Clue ───────────────────────────────────────────

  async unlockClue(walletId: string, dto: UnlockClueRequest) {
    const clue = await this.prisma.clue.findUnique({
      where: { id: dto.clueId },
      include: { hunt: true },
    });

    if (!clue) throw new NotFoundException('Clue not found');
    if (clue.hunt.id !== dto.huntId) throw new BadRequestException('Clue does not belong to this hunt');

    const attempt = await this.prisma.huntAttempt.findUnique({
      where: { huntId_playerWalletId: { huntId: dto.huntId, playerWalletId: walletId } },
    });

    if (!attempt) throw new BadRequestException('Not joined this hunt');

    // Validate GPS proximity
    const inRadius = isWithinRadius(
      { latitude: dto.latitude, longitude: dto.longitude },
      { latitude: clue.lat, longitude: clue.lng },
      clue.unlockRadius,
    );

    if (!inRadius) {
      throw new BadRequestException('Not within clue unlock radius');
    }

    // Anti-cheat validation
    await this.geoService.validateMovement(walletId, {
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    // Check already unlocked
    const alreadyUnlocked = await this.prisma.unlockedClue.findUnique({
      where: { attemptId_clueId: { attemptId: attempt.id, clueId: dto.clueId } },
    });

    if (alreadyUnlocked) {
      return { alreadyUnlocked: true, clue: this.formatClue(clue) };
    }

    // Check sequence
    if (clue.sequence > 1) {
      const previousClue = await this.prisma.clue.findUnique({
        where: { huntId_sequence: { huntId: dto.huntId, sequence: clue.sequence - 1 } },
      });

      if (previousClue) {
        const prevUnlocked = await this.prisma.unlockedClue.findUnique({
          where: { attemptId_clueId: { attemptId: attempt.id, clueId: previousClue.id } },
        });

        if (!prevUnlocked) {
          throw new BadRequestException('Previous clue not yet unlocked');
        }
      }
    }

    await this.prisma.unlockedClue.create({
      data: {
        attemptId: attempt.id,
        clueId: clue.id,
        lat: dto.latitude,
        lng: dto.longitude,
      },
    });

    await this.prisma.huntAttempt.update({
      where: { id: attempt.id },
      data: { cluesUnlocked: { increment: 1 } },
    });

    await this.prisma.playerProgress.update({
      where: { walletId },
      data: {
        xp: { increment: 50 },
        distanceWalked: {
          increment: haversineDistance(
            { latitude: dto.latitude, longitude: dto.longitude },
            { latitude: clue.lat, longitude: clue.lng },
          ) / 1000,
        },
      },
    });

    await this.emitEvent('CLUE_UNLOCKED', dto.huntId, walletId, {
      clueId: clue.id,
      sequence: clue.sequence,
    });

    return { unlocked: true, clue: this.formatClue(clue) };
  }

  // ─── Claim Treasure ────────────────────────────────────────

  async claimTreasure(walletId: string, dto: ClaimTreasureRequest) {
    const hunt = await this.prisma.treasureHunt.findUnique({
      where: { id: dto.huntId },
      include: { clues: { where: { isFinal: true } } },
    });

    if (!hunt) throw new NotFoundException('Hunt not found');
    if (hunt.status !== 'ACTIVE') throw new BadRequestException('Hunt is not active');

    const attempt = await this.prisma.huntAttempt.findUnique({
      where: { huntId_playerWalletId: { huntId: dto.huntId, playerWalletId: walletId } },
    });

    if (!attempt) throw new BadRequestException('Not joined this hunt');

    // Validate GPS proximity to treasure
    const inRadius = isWithinRadius(
      { latitude: dto.latitude, longitude: dto.longitude },
      { latitude: hunt.treasureLat, longitude: hunt.treasureLng },
      hunt.treasureRadius,
    );

    if (!inRadius) {
      throw new BadRequestException('Not within treasure radius');
    }

    // Anti-cheat validation
    await this.geoService.validateMovement(walletId, {
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    // Check all clues unlocked
    const unlockedCount = await this.prisma.unlockedClue.count({
      where: { attemptId: attempt.id },
    });

    if (unlockedCount < hunt.clueCount) {
      throw new BadRequestException(`Not all clues unlocked (${unlockedCount}/${hunt.clueCount})`);
    }

    // Claim on blockchain
    try {
      await this.escrowService.claimReward(hunt.escrowContractId, walletId);
    } catch (error) {
      throw new BadRequestException('Blockchain claim failed');
    }

    // Update hunt
    await this.prisma.treasureHunt.update({
      where: { id: dto.huntId },
      data: {
        status: 'COMPLETED',
        winnerWalletId: walletId,
        claimedAt: new Date(),
      },
    });

    // Update attempt
    await this.prisma.huntAttempt.update({
      where: { id: attempt.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Update player progress
    await this.prisma.playerProgress.update({
      where: { walletId },
      data: {
        winCount: { increment: 1 },
        completedHunts: { increment: 1 },
        xp: { increment: 500 },
        totalRewardsEarned: hunt.reward,
      },
    });

    // Check first blood badge
    await this.checkFirstBloodBadge(walletId);

    await this.emitEvent('TREASURE_CLAIMED', dto.huntId, walletId, {
      reward: hunt.reward,
    });

    return { claimed: true, reward: hunt.reward };
  }

  // ─── Player Hunts ──────────────────────────────────────────

  async getPlayerAttempts(walletId: string) {
    return this.prisma.huntAttempt.findMany({
      where: { playerWalletId: walletId },
      include: {
        hunt: { select: { id: true, title: true, status: true, reward: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getCreatedHunts(walletId: string) {
    return this.prisma.treasureHunt.findMany({
      where: { ownerWalletId: walletId },
      include: {
        clues: { orderBy: { sequence: 'asc' } },
        attempts: { select: { id: true, status: true, player: { select: { address: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /// GM dashboard with aggregate stats
  async getGMDashboard(walletId: string) {
    const [hunts, activeHunts, completedHunts, _totalRewards, totalPlayers] =
      await Promise.all([
        this.prisma.treasureHunt.count({ where: { ownerWalletId: walletId } }),
        this.prisma.treasureHunt.count({
          where: { ownerWalletId: walletId, status: 'ACTIVE' },
        }),
        this.prisma.treasureHunt.count({
          where: { ownerWalletId: walletId, status: 'COMPLETED' },
        }),
        this.prisma.treasureHunt.aggregate({
          where: { ownerWalletId: walletId, status: { in: ['COMPLETED', 'ACTIVE'] } },
          _count: { id: true },
        }),
        this.prisma.huntAttempt.count({
          where: { hunt: { ownerWalletId: walletId } },
        }),
      ]);

    // Get contract funding status for active hunts
    const activeHuntsList = await this.prisma.treasureHunt.findMany({
      where: { ownerWalletId: walletId, status: 'DRAFT' },
      select: { id: true, title: true, escrowContractId: true, reward: true },
    });

    const contractsWithFunding = await Promise.all(
      activeHuntsList.map(async (hunt: any) => {
        const escrow = await this.prisma.escrowContract.findUnique({
          where: { id: hunt.escrowContractId },
          select: { contractAddress: true, status: true },
        });
        let funded = false;
        if (escrow?.contractAddress) {
          try {
            funded = await this.stellar.verifyPayment(
              escrow.contractAddress,
              hunt.reward,
            );
          } catch {
            funded = false;
          }
        }
        return {
          huntId: hunt.id,
          title: hunt.title,
          contractAddress: escrow?.contractAddress,
          funded,
          reward: hunt.reward,
        };
      }),
    );

    return {
      totalHunts: hunts,
      activeHunts,
      completedHunts,
      totalPlayers,
      activeContracts: contractsWithFunding,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────

  private async emitEvent(
    type: string,
    huntId: string | null,
    walletId: string | null,
    data: Record<string, unknown>,
  ) {
    await this.prisma.gameEvent.create({
      data: { type: type as any, huntId, walletId, data: data as any },
    });

    await this.eventQueue.add('event', { type, huntId, walletId, data });
  }

  private async checkFirstBloodBadge(walletId: string) {
    const wins = await this.prisma.treasureHunt.count({
      where: { winnerWalletId: walletId },
    });

    if (wins === 1) {
      const progress = await this.prisma.playerProgress.findUnique({
        where: { walletId },
      });

      if (progress) {
        await this.prisma.playerBadge.upsert({
          where: { progressId_badge: { progressId: progress.id, badge: 'FIRST_BLOOD' } },
          create: { progressId: progress.id, badge: 'FIRST_BLOOD' },
          update: {},
        });
      }
    }
  }

  private formatHunt(hunt: any) {
    return {
      ...hunt,
      treasureLocation: { latitude: hunt.treasureLat, longitude: hunt.treasureLng },
      clues: hunt.clues?.map((c: any) => this.formatClue(c)),
    };
  }

  private formatClue(clue: any) {
    return {
      ...clue,
      location: { latitude: clue.lat, longitude: clue.lng },
    };
  }
}
