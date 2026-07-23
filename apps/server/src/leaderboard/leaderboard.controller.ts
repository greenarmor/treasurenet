import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletAuthGuard } from '../auth/wallet-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@UseGuards(WalletAuthGuard)
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get global leaderboard' })
  getLeaderboard(@Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    return this.leaderboardService.getLeaderboard(+page, +pageSize);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Get weekly leaderboard' })
  getWeeklyLeaderboard() {
    return this.leaderboardService.getWeeklyLeaderboard();
  }
}
