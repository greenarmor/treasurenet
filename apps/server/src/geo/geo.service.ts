import { Injectable, BadRequestException, Inject, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { checkSpeed, checkTeleport, validateLocationProof } from '@treasurenet/shared';
import type { Coordinates } from '@treasurenet/shared';

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  constructor(
    private readonly prisma: PrismaClient,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async validateMovement(
    walletId: string,
    currentLocation: Coordinates,
  ): Promise<void> {
    try {
      const redisKey = `location:${walletId}`;
      const lastEntry = await this.redis.get(redisKey);

      if (lastEntry) {
        const last = JSON.parse(lastEntry) as Coordinates & { timestamp: number };
        const timeDelta = (Date.now() - last.timestamp) / 1000;

        if (timeDelta < 1) return;

        const speedCheck = checkSpeed(last, currentLocation, timeDelta);
        if (!speedCheck.passed) {
          throw new BadRequestException(`Anti-cheat: ${speedCheck.reason}`);
        }

        if (timeDelta < 60) {
          const teleportCheck = checkTeleport(last, currentLocation);
          if (!teleportCheck.passed) {
            throw new BadRequestException(`Anti-cheat: ${teleportCheck.reason}`);
          }
        }
      }

      await this.redis.set(
        redisKey,
        JSON.stringify({ ...currentLocation, timestamp: Date.now() }),
        'EX',
        3600,
      );
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.warn(`Redis unavailable, skipping location cache: ${err.message}`);
    }
  }

  async validateLocationProof(
    proof: { signature: string; timestamp: number; nonce: string },
  ): Promise<void> {
    const check = validateLocationProof(proof.timestamp, proof.nonce);
    if (!check.passed) {
      throw new BadRequestException(`Invalid location proof: ${check.reason}`);
    }

    const existingNonce = await this.prisma.nonce.findUnique({
      where: { value: proof.nonce },
    });

    if (existingNonce) {
      throw new BadRequestException('Nonce already used (replay detected)');
    }
  }
}
