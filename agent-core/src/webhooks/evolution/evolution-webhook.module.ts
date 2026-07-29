import { Module } from '@nestjs/common';
import { LeadsModule } from '../../leads/leads.module';
import { SupabaseModule } from '../../supabase/supabase.module';
import { EvolutionWebhookController } from './evolution-webhook.controller';
import { EvolutionWebhookService } from './evolution-webhook.service';

@Module({
  imports: [SupabaseModule, LeadsModule],
  controllers: [EvolutionWebhookController],
  providers: [EvolutionWebhookService],
})
export class EvolutionWebhookModule {}
