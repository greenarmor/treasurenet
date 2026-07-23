import { Controller, Get, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletAuthGuard } from '../auth/wallet-auth.guard';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(WalletAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications' })
  getNotifications(@Req() req: any, @Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    return this.notificationService.getNotifications(req.user.id, +page, +pageSize);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markRead(id, req.user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@Req() req: any) {
    return this.notificationService.markAllRead(req.user.id);
  }
}
