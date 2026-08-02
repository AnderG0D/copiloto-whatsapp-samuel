import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { GeminiProvider } from '../gemini.provider';
import { AI_PROVIDER } from '../ai.constants';
import { ConversationContextBuilder } from './conversation-context.builder';
import { ResponseDraftRepository } from './response-draft.repository';
import { ResponseDraftService } from './response-draft.service';

@Module({
  imports: [SupabaseModule],
  providers: [
    ConversationContextBuilder,
    ResponseDraftService,
    ResponseDraftRepository,
    {
      provide: AI_PROVIDER,
      useClass: GeminiProvider,
    },
  ],
  exports: [ResponseDraftService, ResponseDraftRepository],
})
export class ResponseDraftModule {}
