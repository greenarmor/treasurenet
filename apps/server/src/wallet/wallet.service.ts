import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      include: {
        user: true,
        progress: { include: { badges: true } },
      },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    const completedHunts = await this.prisma.huntAttempt.count({
      where: { playerWalletId: walletId, status: 'COMPLETED' },
    });

    const wonHunts = await this.prisma.treasureHunt.count({
      where: { winnerWalletId: walletId },
    });

    return {
      id: wallet.id,
      address: wallet.address,
      roles: wallet.roles,
      user: wallet.user,
      progress: wallet.progress,
      stats: {
        completedHunts,
        wonHunts,
      },
    };
  }

  async updateRoles(walletId: string, roles: string[]) {
    return this.prisma.wallet.update({
      where: { id: walletId },
      data: { roles: roles as any },
    });
  }

  async promoteToGameMaster(address: string, adminKey: string) {
    const ADMIN_KEY = process.env.ADMIN_KEY || 'treasurenet-admin-dev';
    if (adminKey !== ADMIN_KEY) {
      throw new UnauthorizedException('Invalid admin key');
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { address } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { roles: ['GAME_MASTER'] as any },
    });
  }

  async issueSbt(address: string, adminKey: string) {
    const ADMIN_KEY = process.env.ADMIN_KEY || 'treasurenet-admin-dev';
    if (adminKey !== ADMIN_KEY) {
      throw new UnauthorizedException('Invalid admin key');
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { address } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.walletType !== 'MOBILE') {
      throw new BadRequestException('SBTs can only be issued to mobile wallets');
    }

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        sbtStatus: 'ISSUED',
        sbtTokenId: `SBT-${address.slice(0, 8)}-${Date.now()}`,
        sbtContractId: process.env.SBT_CONTRACT_ID || 'pending-deployment',
      } as any,
    });
  }
}
