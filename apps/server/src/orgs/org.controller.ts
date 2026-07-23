import {
  Controller, Get, Post, Body, Param, UseGuards, Req,
  BadRequestException, NotFoundException, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletAuthGuard } from '../auth/wallet-auth.guard';
import { PrismaClient } from '@prisma/client';
import { IsString, IsOptional, MinLength } from 'class-validator';

class CreateOrgDto {
  @IsString() @MinLength(3) name!: string;
  @IsString() @MinLength(3) slug!: string;
  @IsOptional() @IsString() logoUrl?: string;
}

class InviteMemberDto {
  @IsString() address!: string;
}

class VerifyXlmPaymentDto {
  @IsString() txHash!: string;
  @IsString() tierType!: string;
}

@ApiTags('Organizations')
@Controller('orgs')
export class OrganizationController {
  private readonly logger = new Logger(OrganizationController.name);

  constructor(private readonly prisma: PrismaClient) {}

  // Platform wallet address for XLM payments
  private readonly PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || '';

  @Post()
  @ApiBearerAuth()
  @UseGuards(WalletAuthGuard)
  @ApiOperation({ summary: 'Create a new organization' })
  async createOrg(@Req() req: any, @Body() dto: CreateOrgDto) {
    const walletId = req.user.id;

    // Check slug uniqueness
    const existing = await this.prisma.organization.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new BadRequestException('Slug already taken');

    // Get user
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      include: { user: true },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    // Create org with creator as ORG_ADMIN
    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        logoUrl: dto.logoUrl,
        members: {
          create: {
            userId: wallet.userId,
            role: 'ORG_ADMIN',
          },
        },
        subscriptions: {
          create: {
            tier: { connect: { type: 'FREE' } },
            status: 'TRIAL',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        },
      },
    });

    // Link wallet to org
    await this.prisma.wallet.update({
      where: { id: walletId },
      data: { orgId: org.id },
    });

    return org;
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(WalletAuthGuard)
  @ApiOperation({ summary: 'List organizations for the current user' })
  async listOrgs(@Req() req: any) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: req.user.id },
    });
    if (!wallet) return [];

    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId: wallet.userId },
      include: { org: true },
    });

    return memberships.map((m: any) => ({
      id: m.org.id,
      name: m.org.name,
      slug: m.org.slug,
      logoUrl: m.org.logoUrl,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  @Post(':slug/invite')
  @ApiBearerAuth()
  @UseGuards(WalletAuthGuard)
  @ApiOperation({ summary: 'Invite a wallet to the organization' })
  async inviteMember(@Req() req: any, @Param('slug') slug: string, @Body() dto: InviteMemberDto) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: req.user.id },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    // Verify org admin
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId: wallet.userId, org: { slug }, role: 'ORG_ADMIN' },
    });
    if (!membership) throw new BadRequestException('Only org admins can invite');

    // Find or create wallet for invited address
    let targetWallet = await this.prisma.wallet.findUnique({
      where: { address: dto.address },
    });

    if (!targetWallet) {
      const user = await this.prisma.user.create({
        data: { username: `player_${dto.address.slice(0, 8)}` },
      });
      targetWallet = await this.prisma.wallet.create({
        data: { address: dto.address, userId: user.id, orgId: membership.orgId },
      });
    }

    // Add to org
    const org = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (!org) throw new NotFoundException('Organization not found');

    await this.prisma.organizationMember.upsert({
      where: { orgId_userId: { orgId: org.id, userId: targetWallet.userId } },
      create: { orgId: org.id, userId: targetWallet.userId, role: 'PLAYER' },
      update: {},
    });

    return { invited: true, address: dto.address, orgSlug: slug };
  }

  @Get(':slug/members')
  @ApiBearerAuth()
  @UseGuards(WalletAuthGuard)
  @ApiOperation({ summary: 'List organization members' })
  async listMembers(@Param('slug') slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              include: { wallets: { select: { address: true } } },
            },
          },
        },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org.members.map((m: any) => ({
      userId: m.userId,
      username: m.user.username,
      role: m.role,
      address: m.user.wallets[0]?.address,
      joinedAt: m.joinedAt,
    }));
  }

  @Post(':slug/verify-payment')
  @ApiBearerAuth()
  @UseGuards(WalletAuthGuard)
  @ApiOperation({ summary: 'Verify XLM payment for subscription upgrade' })
  async verifyPayment(@Req() req: any, @Param('slug') slug: string, @Body() dto: VerifyXlmPaymentDto) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: req.user.id } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (!org) throw new NotFoundException('Organization not found');

    const tier = await this.prisma.subscriptionTier.findUnique({
      where: { type: dto.tierType as any },
    });
    if (!tier) throw new BadRequestException('Invalid tier');

    // Verify payment via Horizon
    const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    let txData: any;

    try {
      const res = await fetch(`${horizonUrl}/transactions/${dto.txHash}`);
      if (!res.ok) throw new Error('Transaction not found');
      txData = await res.json();
    } catch {
      throw new BadRequestException('Failed to verify transaction on Stellar network');
    }

    // Validate payment
    const expectedXlm = tier.priceMonthly / 100;
    const paymentOp = txData.operations?.records?.find(
      (op: any) =>
        op.type === 'payment' &&
        op.to === this.PLATFORM_WALLET &&
        op.asset_type === 'native',
    );

    if (!paymentOp) {
      throw new BadRequestException(
        `No XLM payment found to platform wallet ${this.PLATFORM_WALLET}`,
      );
    }

    const paidAmount = parseFloat(paymentOp.amount);
    if (paidAmount < expectedXlm) {
      throw new BadRequestException(
        `Insufficient payment: sent ${paidAmount} XLM, need ${expectedXlm} XLM`,
      );
    }

    // Update subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: { orgId: org.id, status: { in: ['TRIAL', 'ACTIVE', 'PAST_DUE'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) throw new NotFoundException('No active subscription found');

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        tierId: tier.id,
        status: 'ACTIVE',
        xlmAmount: `${expectedXlm}`,
        paymentTxHash: dto.txHash,
        paidAt: now,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    this.logger.log(`Subscription upgraded for org ${slug} to ${dto.tierType}, paid ${expectedXlm} XLM`);

    return {
      success: true,
      tier: dto.tierType,
      paidXlm: expectedXlm,
      nextPeriodEnd: periodEnd,
      txHash: dto.txHash,
    };
  }

  @Get(':slug/subscription')
  @ApiOperation({ summary: 'Get organization subscription status' })
  async getSubscription(@Param('slug') slug: string) {
    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (!org) throw new NotFoundException('Organization not found');

    const subscription = await this.prisma.subscription.findFirst({
      where: { orgId: org.id },
      orderBy: { createdAt: 'desc' },
      include: { tier: true },
    });

    if (!subscription) throw new NotFoundException('No subscription found');

    return {
      status: subscription.status,
      tier: subscription.tier.type,
      tierName: subscription.tier.name,
      xlmAmount: subscription.xlmAmount,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndsAt: subscription.trialEndsAt,
      paymentTxHash: subscription.paymentTxHash,
    };
  }
}
