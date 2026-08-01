import { Inject, Injectable } from '@nestjs/common';
import type { AiProvider } from '../ai-provider.interface';
import { AI_PROVIDER } from '../ai.constants';
import { ConversationContextBuilder } from './conversation-context.builder';
import type { ResponseDraft, ResponseDraftInput } from './response-draft.types';

@Injectable()
export class ResponseDraftService {
  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
    private readonly contextBuilder: ConversationContextBuilder,
  ) {}

  async generate(input: ResponseDraftInput): Promise<ResponseDraft> {
    const messages = this.contextBuilder.build(input);
    const output = await this.aiProvider.generateText({ messages });
    const text = output.text.trim();

    if (!text) {
      throw new Error('AI provider returned an empty response draft');
    }

    return {
      text,
      status: 'PROPOSED',
    };
  }
}
