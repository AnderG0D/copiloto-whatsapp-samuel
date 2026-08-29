import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ShadowOnlyWebhookService } from './shadow-only-webhook.service';

@Controller('webhooks')
export class ShadowOnlyWebhookController {
  constructor(
    private readonly shadowOnlyWebhookService: ShadowOnlyWebhookService,
  ) {}

  @Post('evolution')
  @HttpCode(200)
  receiveEvolutionWebhook(@Body() payload: unknown) {
    return this.shadowOnlyWebhookService.handleIncomingWebhook(payload);
  }
}
