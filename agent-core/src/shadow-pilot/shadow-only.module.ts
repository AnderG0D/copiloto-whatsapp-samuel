import { Module } from '@nestjs/common';
import { ShadowPilotModule } from './shadow-pilot.module';
import { ShadowOnlyWebhookController } from './shadow-only-webhook.controller';
import { ShadowOnlyWebhookService } from './shadow-only-webhook.service';

@Module({
  imports: [ShadowPilotModule],
  controllers: [ShadowOnlyWebhookController],
  providers: [ShadowOnlyWebhookService],
})
export class ShadowOnlyModule {}
