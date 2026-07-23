import { Global, Module } from '@nestjs/common';
import { StellarService } from './stellar.service';
import { PrismaClient } from '@prisma/client';

@Global()
@Module({
  providers: [
    StellarService,
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
  exports: [StellarService, PrismaClient],
})
export class CommonModule {}
