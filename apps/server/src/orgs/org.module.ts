import { Module } from '@nestjs/common';
import { OrganizationController } from './org.controller';

@Module({
  controllers: [OrganizationController],
})
export class OrgsModule {}
