import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly prisma: PrismaClient) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async expireOldHunts() {
    this.logger.log('Checking for expired hunts...');

    const expiredHunts = await this.prisma.treasureHunt.findMany({
      where: {
        status: 'ACTIVE',
        activatedAt: {
          lte: new Date(Date.now() - 72 * 60 * 60 * 1000),
        },
      },
    });

    for (const hunt of expiredHunts) {
      await this.prisma.treasureHunt.update({
        where: { id: hunt.id },
        data: { status: 'EXPIRED' },
      });

      await this.prisma.escrowContract.update({
        where: { id: hunt.escrowContractId },
        data: { status: 'EXPIRED' },
      });

      this.logger.log(`Hunt ${hunt.id} expired`);
    }

    if (expiredHunts.length > 0) {
      this.logger.log(`Expired ${expiredHunts.length} hunts`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async updateLeaderboard() {
    this.logger.log('Updating leaderboard...');

    const players = await this.prisma.playerProgress.findMany({
      orderBy: { leaderboardScore: 'desc' },
      take: 100,
    });

    const now = new Date();
    const week = Math.ceil(
      (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    );

    for (let i = 0; i < players.length; i++) {
      await this.prisma.leaderboard.upsert({
        where: { walletId: players[i].walletId },
        create: {
          walletId: players[i].walletId,
          score: players[i].leaderboardScore,
          rank: i + 1,
          week,
          year: now.getFullYear(),
        },
        update: {
          score: players[i].leaderboardScore,
          rank: i + 1,
        },
      });
    }

    this.logger.log('Leaderboard updated');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanOldNonces() {
    await this.prisma.nonce.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
  }
}
