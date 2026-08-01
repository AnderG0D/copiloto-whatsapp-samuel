import { Test, type TestingModule } from '@nestjs/testing';
import type { AiProvider } from '../ai-provider.interface';
import { AI_PROVIDER } from '../ai.constants';
import type { AiMessage } from '../ai.types';
import { ConversationContextBuilder } from './conversation-context.builder';
import { ResponseDraftService } from './response-draft.service';
import type { ResponseDraftInput } from './response-draft.types';

describe('ResponseDraftService', () => {
  let service: ResponseDraftService;
  let aiProvider: jest.Mocked<AiProvider>;
  let contextBuilder: jest.Mocked<Pick<ConversationContextBuilder, 'build'>>;
  let generateTextMock: jest.MockedFunction<AiProvider['generateText']>;
  let buildContextMock: jest.MockedFunction<
    ConversationContextBuilder['build']
  >;

  const input: ResponseDraftInput = {
    business: {
      name: 'Autos Samuel',
      businessType: 'cars',
    },
    lead: {
      score: 85,
      classification: 'HOT',
      signals: {
        generalInterest: true,
        price: true,
        financing: false,
        downPayment: false,
        monthlyPayment: false,
        availability: false,
        appointment: true,
        urgency: true,
        vehicleSpecific: true,
        vehicleMentioned: 'Ford Ranger',
        modelYearOrVersion: '2026 XLT',
        notInterested: false,
        confusedOrGeneralQuestion: false,
      },
      classificationReason: 'El lead pregunto por precio y solicito una cita.',
    },
    currentMessage: 'Cuanto cuesta y la puedo ver hoy?',
    history: [],
  };

  const messages: AiMessage[] = [
    { role: 'system', content: 'Safe deterministic instruction' },
    { role: 'user', content: input.currentMessage },
  ];

  beforeEach(async () => {
    generateTextMock = jest.fn();
    buildContextMock = jest.fn().mockReturnValue(messages);
    aiProvider = {
      generateText: generateTextMock,
    };
    contextBuilder = {
      build: buildContextMock,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseDraftService,
        {
          provide: AI_PROVIDER,
          useValue: aiProvider,
        },
        {
          provide: ConversationContextBuilder,
          useValue: contextBuilder,
        },
      ],
    }).compile();

    service = module.get(ResponseDraftService);
  });

  it('uses the injected AI provider with the safe conversation context', async () => {
    generateTextMock.mockResolvedValue({ text: 'Candidate response' });

    await service.generate(input);

    expect(buildContextMock).toHaveBeenCalledTimes(1);
    expect(buildContextMock).toHaveBeenCalledWith(input);
    expect(generateTextMock).toHaveBeenCalledTimes(1);
    expect(generateTextMock).toHaveBeenCalledWith({ messages });
  });

  it('returns a trimmed proposed draft', async () => {
    generateTextMock.mockResolvedValue({
      text: '  Claro, verifico la disponibilidad para ti.  ',
    });

    await expect(service.generate(input)).resolves.toEqual({
      text: 'Claro, verifico la disponibilidad para ti.',
      status: 'PROPOSED',
    });
  });

  it.each(['', '   ', '\n\t'])(
    'rejects an empty provider response (%p)',
    async (text) => {
      generateTextMock.mockResolvedValue({ text });

      await expect(service.generate(input)).rejects.toThrow(
        'AI provider returned an empty response draft',
      );
    },
  );

  it('does not call the provider when context construction fails', async () => {
    buildContextMock.mockImplementation(() => {
      throw new Error('Invalid safe context');
    });

    await expect(service.generate(input)).rejects.toThrow(
      'Invalid safe context',
    );
    expect(generateTextMock).not.toHaveBeenCalled();
  });
});
