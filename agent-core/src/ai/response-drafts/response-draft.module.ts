import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { GeminiProvider } from '../gemini.provider';
import { AI_PROVIDER } from '../ai.constants';
import { ConversationContextBuilder } from './conversation-context.builder';
import { ResponseDraftDecisionRepository } from './response-draft-decision.repository';
import { ResponseDraftRepository } from './response-draft.repository';
import { ResponseDraftReviewService } from './response-draft-review.service';
import { ResponseDraftService } from './response-draft.service';

@Module({
  imports: [SupabaseModule],
  providers: [
    ConversationContextBuilder,
    ResponseDraftService,
    ResponseDraftRepository,
    ResponseDraftDecisionRepository,
    ResponseDraftReviewService,
    {
      provide: AI_PROVIDER,
      useClass: GeminiProvider,
    },
  ],
  exports: [
    ResponseDraftService,
    ResponseDraftRepository,
    ResponseDraftReviewService,
  ],
})
export class ResponseDraftModule {}
