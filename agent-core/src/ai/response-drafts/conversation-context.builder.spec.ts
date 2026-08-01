import type { DetectedSignals } from '../../leads/lead-scoring.service';
import { ConversationContextBuilder } from './conversation-context.builder';
import type {
  ResponseDraftInput,
  SafeHistoryMessage,
} from './response-draft.types';

describe('ConversationContextBuilder', () => {
  let builder: ConversationContextBuilder;

  const signals: DetectedSignals = {
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
  };

  const createInput = (
    overrides: Partial<ResponseDraftInput> = {},
  ): ResponseDraftInput => ({
    business: {
      name: 'Autos Samuel',
      businessType: 'cars',
    },
    lead: {
      score: 85,
      classification: 'HOT',
      signals,
      classificationReason: 'El lead pregunto por precio y solicito una cita.',
    },
    currentMessage: 'Cuanto cuesta y la puedo ver hoy?',
    history: [],
    ...overrides,
  });

  const createHistoryMessage = (
    index: number,
    overrides: Partial<SafeHistoryMessage> = {},
  ): SafeHistoryMessage => ({
    role: 'customer',
    content: `Message ${index}`,
    createdAt: new Date(Date.UTC(2026, 6, 1, 0, index)).toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    builder = new ConversationContextBuilder();
  });

  it('builds system context followed by the current message when history is empty', () => {
    const messages = builder.build(createInput());

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('Autos Samuel (cars)');
    expect(messages[1]).toEqual({
      role: 'user',
      content: 'Cuanto cuesta y la puedo ver hoy?',
    });
  });

  it('sorts history chronologically without mutating the input', () => {
    const history = [
      createHistoryMessage(3),
      createHistoryMessage(1),
      createHistoryMessage(2),
    ];
    const originalOrder = history.map((message) => message.content);

    const messages = builder.build(createInput({ history }));

    expect(messages.slice(1, -1).map((message) => message.content)).toEqual([
      'Message 1',
      'Message 2',
      'Message 3',
    ]);
    expect(history.map((message) => message.content)).toEqual(originalOrder);
  });

  it('uses the ten most recent history messages by default', () => {
    const history = Array.from({ length: 12 }, (_, index) =>
      createHistoryMessage(index),
    );

    const messages = builder.build(createInput({ history }));

    expect(messages.slice(1, -1).map((message) => message.content)).toEqual(
      Array.from({ length: 10 }, (_, index) => `Message ${index + 2}`),
    );
  });

  it('uses a configurable history limit and keeps the newest messages', () => {
    const history = [
      createHistoryMessage(4),
      createHistoryMessage(1),
      createHistoryMessage(3),
      createHistoryMessage(2),
    ];

    const messages = builder.build(createInput({ history, historyLimit: 2 }));

    expect(messages.slice(1, -1).map((message) => message.content)).toEqual([
      'Message 3',
      'Message 4',
    ]);
  });

  it.each([
    ['customer', 'user'],
    ['bot', 'assistant'],
    ['human', 'assistant'],
  ] as const)('maps the %s history role to %s', (historyRole, aiRole) => {
    const messages = builder.build(
      createInput({
        history: [createHistoryMessage(1, { role: historyRole })],
      }),
    );

    expect(messages[1].role).toBe(aiRole);
  });

  it('always places the current message last as a user message', () => {
    const messages = builder.build(
      createInput({
        currentMessage: '  Current customer message  ',
        history: [createHistoryMessage(1, { role: 'bot' })],
      }),
    );

    expect(messages.at(-1)).toEqual({
      role: 'user',
      content: 'Current customer message',
    });
  });

  it('builds deterministic safety instructions with internal lead context', () => {
    const input = createInput();

    const firstInstruction = builder.build(input)[0].content;
    const secondInstruction = builder.build(input)[0].content;

    expect(firstInstruction).toBe(secondInstruction);
    expect(firstInstruction).toContain('score 85');
    expect(firstInstruction).toContain('clasificación HOT');
    expect(firstInstruction).toContain('vehículo específico (Ford Ranger)');
    expect(firstInstruction).toContain('modelo, año o versión (2026 XLT)');
    expect(firstInstruction).toContain(
      'Nunca reveles el score, la clasificación, las señales ni la razón interna.',
    );
    expect(firstInstruction).toContain(
      'No inventes inventario, precios, promociones, disponibilidad ni datos del vehículo.',
    );
  });

  it('does not copy forbidden metadata from objects with extra properties', () => {
    const input = createInput() as ResponseDraftInput & {
      phone: string;
      raw_payload: object;
    };
    input.phone = 'PRIVATE_PHONE_MARKER';
    input.raw_payload = { secret: 'PRIVATE_PAYLOAD_MARKER' };
    Object.assign(input.lead, { jid: 'PRIVATE_JID_MARKER' });
    const historyMessage = createHistoryMessage(1) as SafeHistoryMessage & {
      externalMessageId: string;
    };
    historyMessage.externalMessageId = 'PRIVATE_ID_MARKER';
    input.history = [historyMessage];

    const serializedMessages = JSON.stringify(builder.build(input));

    expect(serializedMessages).not.toContain('PRIVATE_PHONE_MARKER');
    expect(serializedMessages).not.toContain('PRIVATE_PAYLOAD_MARKER');
    expect(serializedMessages).not.toContain('PRIVATE_JID_MARKER');
    expect(serializedMessages).not.toContain('PRIVATE_ID_MARKER');
  });

  it.each(['', '   ', '\n\t'])(
    'rejects an empty current message (%p)',
    (text) => {
      expect(() =>
        builder.build(createInput({ currentMessage: text })),
      ).toThrow('Current message cannot be empty');
    },
  );

  it('rejects an invalid history date', () => {
    expect(() =>
      builder.build(
        createInput({
          history: [createHistoryMessage(1, { createdAt: 'not-a-date' })],
        }),
      ),
    ).toThrow('Invalid history message date: not-a-date');
  });

  it('rejects an empty history message', () => {
    expect(() =>
      builder.build(
        createInput({
          history: [createHistoryMessage(1, { content: '   ' })],
        }),
      ),
    ).toThrow('History message content cannot be empty');
  });

  it.each([0, -1, 1.5, 21, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects an invalid history limit (%p)',
    (historyLimit) => {
      expect(() => builder.build(createInput({ historyLimit }))).toThrow(
        'History limit must be an integer between 1 and 20',
      );
    },
  );

  it('rejects unsupported history roles at runtime', () => {
    const history = [
      createHistoryMessage(1, {
        role: 'system' as SafeHistoryMessage['role'],
      }),
    ];

    expect(() => builder.build(createInput({ history }))).toThrow(
      'Unsupported history role: system',
    );
  });

  it('rejects a non-finite lead score', () => {
    expect(() =>
      builder.build(
        createInput({
          lead: {
            ...createInput().lead,
            score: Number.NaN,
          },
        }),
      ),
    ).toThrow('Lead score must be a finite number');
  });
});
