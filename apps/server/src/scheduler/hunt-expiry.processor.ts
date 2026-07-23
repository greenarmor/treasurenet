import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('hunt-events')
export class HuntExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(HuntExpiryProcessor.name);

  async process(job: Job<{ type: string; huntId: string; walletId: string; data: any }>) {
    this.logger.log(`Processing event: ${job.data.type} for hunt ${job.data.huntId}`);
  }
}
