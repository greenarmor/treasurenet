import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletAuthGuard } from '../auth/wallet-auth.guard';
import { WalletService } from './wallet.service';

@ApiTags('Players')
@ApiBearerAuth()
@UseGuards(WalletAuthGuard)
@Controller('profile')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get player profile' })
  getProfile(@Req() req: any) {
    return this.walletService.getProfile(req.user.id);
  }

  @Patch('roles')
  @ApiOperation({ summary: 'Update wallet roles' })
  updateRoles(@Req() req: any, @Body('roles') roles: string[]) {
    return this.walletService.updateRoles(req.user.id, roles);
  }
}
