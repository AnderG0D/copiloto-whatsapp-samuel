import { Module } from '@nestjs/common';
import { ShadowPilotModule } from './shadow-pilot.module';
import {
  getShadowOnlyPilotId,
  SHADOW_ONLY_ACTIVE_PILOT,
} from './shadow-only.config';
import { ShadowOnlyWebhookController } from './shadow-only-webhook.controller';
import { ShadowOnlyWebhookService } from './shadow-only-webhook.service';

@Module({
  imports: [ShadowPilotModule],
  controllers: [ShadowOnlyWebhookController],
  providers: [
    ShadowOnlyWebhookService,
    {
      provide: SHADOW_ONLY_ACTIVE_PILOT,
      useFactory: () => getShadowOnlyPilotId(),
    },
  ],
})
export class ShadowOnlyModule {}
