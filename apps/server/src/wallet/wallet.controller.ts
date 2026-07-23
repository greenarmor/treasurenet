import { Controller, Get, Patch, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletAuthGuard } from '../auth/wallet-auth.guard';
import { WalletService } from './wallet.service';
import { IsString } from 'class-validator';

class PromoteToGameMasterDto {
  @IsString() address!: string;
  @IsString() adminKey!: string;
}

class IssueSbtDto {
  @IsString() address!: string;
  @IsString() adminKey!: string;
}

@ApiTags('Profile')
@Controller('profile')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(WalletAuthGuard)
  @ApiOperation({ summary: 'Get player profile' })
  getProfile(@Req() req: any) {
    return this.walletService.getProfile(req.user.id);
  }

  @Patch('roles')
  @ApiBearerAuth()
  @UseGuards(WalletAuthGuard)
  @ApiOperation({ summary: 'Update wallet roles' })
  updateRoles(@Req() req: any, @Body('roles') roles: string[]) {
    return this.walletService.updateRoles(req.user.id, roles);
  }

  @Post('promote-gm')
  @ApiOperation({ summary: 'Promote a wallet to Game Master (admin)' })
  promoteToGameMaster(@Body() dto: PromoteToGameMasterDto) {
    return this.walletService.promoteToGameMaster(dto.address, dto.adminKey);
  }

  @Post('issue-sbt')
  @ApiOperation({ summary: 'Issue an SBT to a player (admin)' })
  issueSbt(@Body() dto: IssueSbtDto) {
    return this.walletService.issueSbt(dto.address, dto.adminKey);
  }
}
