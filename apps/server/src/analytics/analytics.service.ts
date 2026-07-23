import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaClient) {}

  async getDashboard() {
    const [
      totalHunts,
      activeHunts,
      totalPlayers,
      totalRewards,
      recentClaims,
    ] = await Promise.all([
      this.prisma.treasureHunt.count(),
      this.prisma.treasureHunt.count({ where: { status: 'ACTIVE' } }),
      this.prisma.playerProgress.count(),
      this.prisma.treasureHunt.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { reward: true },
      }),
      this.prisma.treasureHunt.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { claimedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          reward: true,
          claimedAt: true,
          winner: { select: { address: true } },
        },
      }),
    ]);

    return {
      totalHunts,
      activeHunts,
      totalPlayers,
      totalRewardsDistributed: totalRewards._sum.reward || 0,
      recentClaims,
    };
  }

  async getHuntAnalytics(huntId: string) {
    const [hunt, attempts, completedCount] = await Promise.all([
      this.prisma.treasureHunt.findUnique({ where: { id: huntId } }),
      this.prisma.huntAttempt.count({ where: { huntId } }),
      this.prisma.huntAttempt.count({ where: { huntId, status: 'COMPLETED' } }),
    ]);

    return {
      hunt,
      totalAttempts: attempts,
      completedAttempts: completedCount,
      completionRate: attempts > 0 ? (completedCount / attempts) * 100 : 0,
    };
  }

  async getPlayerAnalytics() {
    const topPlayers = await this.prisma.playerProgress.findMany({
      orderBy: { xp: 'desc' },
      take: 10,
      include: { wallet: { select: { address: true } } },
    });

    const dailyActive = await this.prisma.gameEvent.groupBy({
      by: ['walletId'],
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    return {
      dailyActiveUsers: dailyActive.length,
      topPlayers: topPlayers.map((p) => ({
        address: p.wallet.address,
        xp: p.xp,
        level: p.level,
        wins: p.winCount,
      })),
    };
  }
}
