import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EvolutionWebhookModule } from './webhooks/evolution/evolution-webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    EvolutionWebhookModule,
  ],
})
export class AppModule {}