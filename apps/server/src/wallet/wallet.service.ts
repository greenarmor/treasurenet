import { Injectable, NotFoundException } from '@nestjs/common';
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
}
