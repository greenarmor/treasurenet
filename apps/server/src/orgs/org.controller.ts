import {
  Controller, Get, Post, Body, Param, UseGuards, Req,
  BadRequestException, NotFoundException,
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

@ApiTags('Organizations')
@Controller('orgs')
export class OrganizationController {
  constructor(private readonly prisma: PrismaClient) {}

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

    return memberships.map((m) => ({
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
    return org.members.map((m) => ({
      userId: m.userId,
      username: m.user.username,
      role: m.role,
      address: m.user.wallets[0]?.address,
      joinedAt: m.joinedAt,
    }));
  }
}
