import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResponseDraftReviewModule } from './admin/response-drafts/response-draft-review.module';
import { ShadowPilotModule } from './shadow-pilot/shadow-pilot.module';
import { isEdgarShadowOnlyMode } from './shadow-pilot/shadow-only.config';
import { ShadowOnlyModule } from './shadow-pilot/shadow-only.module';
import { EvolutionWebhookModule } from './webhooks/evolution/evolution-webhook.module';

export function getApplicationModules(
  environment: NodeJS.ProcessEnv = process.env,
) {
  if (isEdgarShadowOnlyMode(environment)) {
    return [ShadowOnlyModule];
  }

  return [EvolutionWebhookModule, ResponseDraftReviewModule, ShadowPilotModule];
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'test' || isEdgarShadowOnlyMode(),
    }),
    ...getApplicationModules(),
  ],
})
export class AppModule {}
