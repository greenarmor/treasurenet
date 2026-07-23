import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletAuthGuard } from '../auth/wallet-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(WalletAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('hunt/:id')
  @ApiOperation({ summary: 'Get hunt-specific analytics' })
  getHuntAnalytics(@Param('id') id: string) {
    return this.analyticsService.getHuntAnalytics(id);
  }

  @Get('players')
  @ApiOperation({ summary: 'Get player analytics' })
  getPlayerAnalytics() {
    return this.analyticsService.getPlayerAnalytics();
  }
}
