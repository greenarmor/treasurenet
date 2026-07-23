import { Global, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { StellarService } from './stellar.service';
import { TenantMiddleware } from './tenant.middleware';
import { PrismaClient } from '@prisma/client';

@Global()
@Module({
  providers: [
    StellarService,
    TenantMiddleware,
    {
      provide: PrismaClient,
      useFactory: () => {
        const client = new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
        return client;
      },
    },
  ],
  exports: [StellarService, TenantMiddleware, PrismaClient],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
