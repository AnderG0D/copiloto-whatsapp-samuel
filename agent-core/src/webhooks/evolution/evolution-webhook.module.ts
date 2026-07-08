import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { EvolutionWebhookController } from './evolution-webhook.controller';
import { EvolutionWebhookService } from './evolution-webhook.service';
import { LeadScoringService } from '../../leads/lead-scoring.service';

@Module({
  imports: [SupabaseModule],
  controllers: [EvolutionWebhookController],
  providers: [EvolutionWebhookService, LeadScoringService],
})
export class EvolutionWebhookModule {}