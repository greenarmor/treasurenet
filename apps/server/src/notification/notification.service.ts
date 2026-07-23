import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaClient) {}

  async getNotifications(walletId: string, page = 1, pageSize = 20) {
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where: { walletId } }),
    ]);

    return { data, total, page, pageSize, hasMore: page * pageSize < total };
  }

  async markRead(notificationId: string, walletId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, walletId },
      data: { isRead: true },
    });
  }

  async markAllRead(walletId: string) {
    return this.prisma.notification.updateMany({
      where: { walletId, isRead: false },
      data: { isRead: true },
    });
  }

  async sendNotification(walletId: string, title: string, body: string, data?: Record<string, unknown>) {
    return this.prisma.notification.create({
      data: { walletId, title, body, data: (data || {}) as any },
    });
  }

  async sendNearbyHuntAlert(walletId: string, huntTitle: string, distance: number) {
    return this.sendNotification(
      walletId,
      'Nearby Treasure!',
      `${huntTitle} is ${Math.round(distance)}m away`,
      { type: 'nearby_hunt' },
    );
  }
}
