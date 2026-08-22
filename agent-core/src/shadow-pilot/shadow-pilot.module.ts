import { Module } from '@nestjs/common';
import { ShadowPilotService } from './shadow-pilot.service';

@Module({
  providers: [ShadowPilotService],
  exports: [ShadowPilotService],
})
export class ShadowPilotModule {}
