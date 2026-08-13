import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResponseDraftReviewModule } from './admin/response-drafts/response-draft-review.module';
import { EvolutionWebhookModule } from './webhooks/evolution/evolution-webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    EvolutionWebhookModule,
    ResponseDraftReviewModule,
  ],
})
export class AppModule {}
