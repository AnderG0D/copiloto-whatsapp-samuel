import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResponseDraftReviewModule } from './admin/response-drafts/response-draft-review.module';
import { ShadowPilotModule } from './shadow-pilot/shadow-pilot.module';
import { EvolutionWebhookModule } from './webhooks/evolution/evolution-webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),

    EvolutionWebhookModule,
    ResponseDraftReviewModule,
    ShadowPilotModule,
  ],
})
export class AppModule {}
