import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaClient) {}

  async getLeaderboard(page = 1, pageSize = 20) {
    const players = await this.prisma.playerProgress.findMany({
      orderBy: { leaderboardScore: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        wallet: { select: { address: true } },
        badges: true,
      },
    });

    const total = await this.prisma.playerProgress.count();

    return {
      data: players.map((p, i) => ({
        rank: (page - 1) * pageSize + i + 1,
        address: p.wallet.address,
        xp: p.xp,
        level: p.level,
        winCount: p.winCount,
        badges: p.badges,
        score: p.leaderboardScore,
      })),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async getWeeklyLeaderboard() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const week = Math.ceil(
      (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    );

    return this.prisma.leaderboard.findMany({
      where: { week, year: now.getFullYear() },
      orderBy: { score: 'desc' },
      take: 50,
    });
  }
}
