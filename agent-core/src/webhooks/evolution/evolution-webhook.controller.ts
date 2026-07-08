import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { EvolutionWebhookService } from './evolution-webhook.service';

@Controller('webhooks')
export class EvolutionWebhookController {
  constructor(
    private readonly evolutionWebhookService: EvolutionWebhookService,
  ) {}

  @Post('evolution')
  @HttpCode(200)
  async receiveEvolutionWebhook(@Body() payload: any) {
    return this.evolutionWebhookService.handleIncomingWebhook(payload);
  }
}