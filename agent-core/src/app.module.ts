import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResponseDraftReviewModule } from './admin/response-drafts/response-draft-review.module';
import { ShadowPilotModule } from './shadow-pilot/shadow-pilot.module';
import { isShadowOnlyMode } from './shadow-pilot/shadow-only.config';
import { ShadowOnlyModule } from './shadow-pilot/shadow-only.module';
import { EvolutionWebhookModule } from './webhooks/evolution/evolution-webhook.module';

export function getApplicationModules(
  environment: NodeJS.ProcessEnv = process.env,
) {
  if (isShadowOnlyMode(environment)) {
    return [ShadowOnlyModule];
  }

  return [EvolutionWebhookModule, ResponseDraftReviewModule, ShadowPilotModule];
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'test' || isShadowOnlyMode(),
    }),
    ...getApplicationModules(),
  ],
})
export class AppModule {}
