import {
  Controller, Get, Post, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletAuthGuard } from '../auth/wallet-auth.guard';
import { GameService } from './game.service';
import type {
  CreateHuntRequest,
  NearbyHuntRequest,
  UnlockClueRequest,
  ClaimTreasureRequest,
} from '@treasurenet/shared';

@ApiTags('Hunts')
@ApiBearerAuth()
@UseGuards(WalletAuthGuard)
@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('hunt')
  @ApiOperation({ summary: 'Create a new treasure hunt' })
  createHunt(@Req() req: any, @Body() dto: CreateHuntRequest) {
    return this.gameService.createHunt(req.user.id, dto);
  }

  @Get('hunts')
  @ApiOperation({ summary: 'Get nearby treasure hunts' })
  getNearbyHunts(@Query() query: NearbyHuntRequest) {
    return this.gameService.getNearbyHunts(query);
  }

  @Get('hunt/:id')
  @ApiOperation({ summary: 'Get hunt details' })
  getHunt(@Param('id') id: string) {
    return this.gameService.getHunt(id);
  }

  @Post('hunt/:id/join')
  @ApiOperation({ summary: 'Join a treasure hunt' })
  joinHunt(@Req() req: any, @Param('id') id: string) {
    return this.gameService.joinHunt(id, req.user.id);
  }

  @Post('clue/unlock')
  @ApiOperation({ summary: 'Unlock a clue (GPS validated)' })
  unlockClue(@Req() req: any, @Body() dto: UnlockClueRequest) {
    return this.gameService.unlockClue(req.user.id, dto);
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim treasure reward (GPS validated)' })
  claimTreasure(@Req() req: any, @Body() dto: ClaimTreasureRequest) {
    return this.gameService.claimTreasure(req.user.id, dto);
  }

  @Get('my-attempts')
  @ApiOperation({ summary: 'Get player hunt attempts' })
  getMyAttempts(@Req() req: any) {
    return this.gameService.getPlayerAttempts(req.user.id);
  }

  @Get('my-hunts')
  @ApiOperation({ summary: 'Get created hunts (Game Master)' })
  getMyHunts(@Req() req: any) {
    return this.gameService.getCreatedHunts(req.user.id);
  }

  @Get('gm-dashboard')
  @ApiOperation({ summary: 'Game Master dashboard with stats and funding status' })
  getGMDashboard(@Req() req: any) {
    return this.gameService.getGMDashboard(req.user.id);
  }
}
