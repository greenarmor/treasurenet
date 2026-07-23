import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { GeoModule } from '../geo/geo.module';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [
    GeoModule,
    EscrowModule,
    BullModule.registerQueue({ name: 'hunt-events' }),
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway],
  exports: [GameService, GameGateway],
})
export class GameModule {}
