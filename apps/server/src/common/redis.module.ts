import { Global, Module, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            if (times > 3) return null;
            return Math.min(times * 200, 1000);
          },
          lazyConnect: true,
        });

        redis.on('error', (err) => {
          Logger.warn(`Redis unavailable (continuing without cache): ${err.message}`, 'RedisModule');
        });

        redis.connect().catch(() => {
          Logger.warn('Redis not available — running without cache', 'RedisModule');
        });

        return redis;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
