import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletAuthGuard } from '../auth/wallet-auth.guard';
import { EscrowService } from './escrow.service';

@ApiTags('Escrow')
@ApiBearerAuth()
@UseGuards(WalletAuthGuard)
@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund an expired escrow' })
  refund(@Param('id') id: string) {
    return this.escrowService.refundEscrow(id);
  }
}
