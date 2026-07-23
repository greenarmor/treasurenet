import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class EscrowService {
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async createEscrow(reward: string, rewardToken: string) {
    const serverSecret = process.env.SERVER_SECRET_KEY;
    if (!serverSecret) {
      throw new BadRequestException('Server secret key not configured');
    }

    // Generate a unique contract address for the escrow
    const contractAddress = `G${crypto.randomUUID().replace(/-/g, '').slice(0, 55)}`;

    const escrow = await this.prisma.escrowContract.create({
      data: {
        contractAddress,
        reward,
        rewardToken: rewardToken as any,
        status: 'CREATED',
      },
    });

    return { escrowContractId: escrow.id, contractAddress };
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

    // In production: call Stellar contract to release funds
    // const serverSecret = process.env.SERVER_SECRET_KEY;
    // if (serverSecret) {
    //   await this.stellar.invokeContract(escrow.contractAddress, 'claim', serverSecret);
    // }

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
