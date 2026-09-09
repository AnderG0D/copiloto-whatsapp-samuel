import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthorizedLeadsService } from './authorized-leads.service';
import { LeadScoringService } from './lead-scoring.service';

@Module({
  imports: [SupabaseModule],
  providers: [LeadScoringService, AuthorizedLeadsService],
  exports: [LeadScoringService, AuthorizedLeadsService],
})
export class LeadsModule {}
