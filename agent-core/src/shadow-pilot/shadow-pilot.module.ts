import { Module } from '@nestjs/common';
import {
  ShadowReceiveOnlyGuard,
  SHADOW_RECEIVE_ONLY_RUNTIME_ENV,
} from './shadow-receive-only.guard';
import { ShadowPilotService } from './shadow-pilot.service';

@Module({
  providers: [
    ShadowPilotService,
    ShadowReceiveOnlyGuard,
    {
      provide: SHADOW_RECEIVE_ONLY_RUNTIME_ENV,
      useFactory: () => process.env,
    },
  ],
  exports: [ShadowPilotService, ShadowReceiveOnlyGuard],
})
export class ShadowPilotModule {}
