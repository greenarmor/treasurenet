import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class EscrowService {
  constructor(private readonly prisma: PrismaClient) {}

  async createEscrow(reward: string, rewardToken: string) {
    const contractAddress = `G${uuid().replace(/-/g, '').slice(0, 55)}`;

    const escrow = await this.prisma.escrowContract.create({
      data: {
        contractAddress,
        reward,
        rewardToken: rewardToken as any,
        status: 'CREATED',
      },
    });

    return { escrowContractId: escrow.id };
  }

  async fundEscrow(escrowId: string) {
    await this.prisma.escrowContract.update({
      where: { id: escrowId },
      data: { status: 'FUNDED', fundedAt: new Date() },
    });
  }

  async claimReward(escrowId: string, _walletId: string) {
    const escrow = await this.prisma.escrowContract.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) throw new BadRequestException('Escrow not found');
    if (escrow.status !== 'FUNDED' && escrow.status !== 'ACTIVE') {
      throw new BadRequestException('Escrow not claimable');
    }

    await this.prisma.escrowContract.update({
      where: { id: escrowId },
      data: { status: 'CLAIMED', claimedAt: new Date() },
    });

    return { claimed: true, reward: escrow.reward };
  }

  async refundEscrow(escrowId: string) {
    const escrow = await this.prisma.escrowContract.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) throw new BadRequestException('Escrow not found');
    if (escrow.status === 'CLAIMED') throw new BadRequestException('Already claimed');

    await this.prisma.escrowContract.update({
      where: { id: escrowId },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });

    return { refunded: true };
  }
}
