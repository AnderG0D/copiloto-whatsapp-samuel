import { Injectable } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AiProvider } from '../ai-provider.interface';
import { AI_PROVIDER } from '../ai.constants';
import { ResponseDraftModule } from './response-draft.module';
import { ResponseDraftRepository } from './response-draft.repository';
import { ResponseDraftReviewService } from './response-draft-review.service';
import { ResponseDraftService } from './response-draft.service';

@Injectable()
class ExternalConsumer {
  constructor(
    readonly responseDraftService: ResponseDraftService,
    readonly responseDraftRepository: ResponseDraftRepository,
    readonly responseDraftReviewService: ResponseDraftReviewService,
  ) {}
}

describe('ResponseDraftModule', () => {
  let module: TestingModule | undefined;
  let generateTextMock: jest.MockedFunction<AiProvider['generateText']>;
  let supabaseFromMock: jest.Mock;

  afterEach(async () => {
    await module?.close();
  });

  it('exports the response draft service and repository to external consumers', async () => {
    generateTextMock = jest.fn();
    supabaseFromMock = jest.fn();

    const fakeAiProvider: AiProvider = {
      generateText: generateTextMock,
    };

    module = await Test.createTestingModule({
      imports: [ResponseDraftModule],
      providers: [ExternalConsumer],
    })
      .overrideProvider(AI_PROVIDER)
      .useValue(fakeAiProvider)
      .overrideProvider(SupabaseService)
      .useValue({
        client: {
          from: supabaseFromMock,
        },
      })
      .compile();

    const consumer = module.get(ExternalConsumer);

    expect(consumer.responseDraftService).toBeInstanceOf(ResponseDraftService);
    expect(consumer.responseDraftRepository).toBeInstanceOf(
      ResponseDraftRepository,
    );
    expect(consumer.responseDraftReviewService).toBeInstanceOf(
      ResponseDraftReviewService,
    );
    expect(generateTextMock).not.toHaveBeenCalled();
    expect(supabaseFromMock).not.toHaveBeenCalled();
  });
});
