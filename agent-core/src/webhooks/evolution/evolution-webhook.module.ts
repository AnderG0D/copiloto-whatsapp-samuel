import { Module } from '@nestjs/common';
import { ResponseDraftModule } from '../../ai/response-drafts/response-draft.module';
import { LeadsModule } from '../../leads/leads.module';
import { ShadowPilotModule } from '../../shadow-pilot/shadow-pilot.module';
import { SupabaseModule } from '../../supabase/supabase.module';
import { EvolutionWebhookController } from './evolution-webhook.controller';
import { EvolutionWebhookService } from './evolution-webhook.service';

@Module({
  imports: [
    SupabaseModule,
    LeadsModule,
    ResponseDraftModule,
    ShadowPilotModule,
  ],
  controllers: [EvolutionWebhookController],
  providers: [EvolutionWebhookService],
})
export class EvolutionWebhookModule {}
