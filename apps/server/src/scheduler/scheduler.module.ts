import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { HuntExpiryProcessor } from './hunt-expiry.processor';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: 'hunt-events' }),
  ],
  providers: [SchedulerService, HuntExpiryProcessor],
})
export class SchedulerModule {}
