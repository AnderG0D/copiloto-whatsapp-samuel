import { Logger } from '@nestjs/common';
import type { ResponseDraftRepository } from '../../ai/response-drafts/response-draft.repository';
import type { ResponseDraftService } from '../../ai/response-drafts/response-draft.service';
import type { ResponseDraft } from '../../ai/response-drafts/response-draft.types';
import type {
  LeadScoringResult,
  LeadScoringService,
} from '../../leads/lead-scoring.service';
import type { SupabaseService } from '../../supabase/supabase.service';
import type { Database } from '../../types/database.types';
import { EvolutionWebhookService } from './evolution-webhook.service';

type ResponseDraftRow = Database['public']['Tables']['response_drafts']['Row'];

type MessageError = {
  code: string;
  message: string;
};

describe('EvolutionWebhookService', () => {
  let service: EvolutionWebhookService;
  let fromMock: jest.Mock;
  let scoreMessageMock: jest.MockedFunction<LeadScoringService['scoreMessage']>;
  let generateDraftMock: jest.MockedFunction<ResponseDraftService['generate']>;
  let createDraftMock: jest.MockedFunction<ResponseDraftRepository['create']>;

  const business = {
    id: 'business-1',
    name: 'Autos Samuel',
    business_type: 'cars',
    evolution_instance_name: 'samuel-instance',
    active: true,
  };

  const lead = {
    id: 'lead-1',
    business_id: business.id,
    phone: '5215550000000',
    name: 'Samuel',
    score: 15,
    classification: 'COLD',
  };

  const scoringResult: LeadScoringResult = {
    messageScore: 40,
    leadScore: 55,
    classification: 'WARM',
    classificationReason: 'El lead preguntó por precio y disponibilidad.',
    signals: {
      generalInterest: true,
      price: true,
      financing: false,
      downPayment: false,
      monthlyPayment: false,
      availability: true,
      appointment: false,
      urgency: false,
      vehicleSpecific: true,
      vehicleMentioned: 'Ranger',
      modelYearOrVersion: null,
      notInterested: false,
      confusedOrGeneralQuestion: false,
    },
  };

  const generatedDraft: ResponseDraft = {
    text: 'Claro, confirmo la disponibilidad y te comparto los detalles.',
    status: 'PROPOSED',
  };

  const draftRow: ResponseDraftRow = {
    id: 'draft-1',
    business_id: business.id,
    lead_id: lead.id,
    source_message_id: 'message-uuid-1',
    text: generatedDraft.text,
    status: generatedDraft.status,
    created_at: '2026-08-02T12:00:00.000Z',
    updated_at: '2026-08-02T12:00:00.000Z',
  };

  const payload = {
    event: 'messages.upsert',
    instance: business.evolution_instance_name,
    privatePayloadMarker: 'PRIVATE_PAYLOAD_MARKER',
    data: {
      key: {
        fromMe: false,
        remoteJid: `${lead.phone}@s.whatsapp.net`,
        id: 'external-message-1',
      },
      pushName: lead.name,
      message: {
        conversation: '¿Cuánto cuesta la Ranger y sigue disponible?',
      },
    },
  };

  beforeEach(() => {
    fromMock = jest.fn();
    scoreMessageMock = jest.fn().mockReturnValue(scoringResult);
    generateDraftMock = jest.fn().mockResolvedValue(generatedDraft);
    createDraftMock = jest.fn().mockResolvedValue(draftRow);

    service = new EvolutionWebhookService(
      { client: { from: fromMock } } as unknown as SupabaseService,
      { scoreMessage: scoreMessageMock } as unknown as LeadScoringService,
      { generate: generateDraftMock } as unknown as ResponseDraftService,
      { create: createDraftMock } as unknown as ResponseDraftRepository,
    );

    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const configureSupabase = (options?: { messageError?: MessageError }) => {
    const businessQuery: any = {};
    businessQuery.select = jest.fn().mockReturnValue(businessQuery);
    businessQuery.eq = jest.fn().mockReturnValue(businessQuery);
    businessQuery.single = jest
      .fn()
      .mockResolvedValue({ data: business, error: null });

    const leadUpsertQuery: any = {};
    leadUpsertQuery.upsert = jest.fn().mockReturnValue(leadUpsertQuery);
    leadUpsertQuery.select = jest.fn().mockReturnValue(leadUpsertQuery);
    leadUpsertQuery.single = jest
      .fn()
      .mockResolvedValue({ data: lead, error: null });

    const messageInsertQuery: any = {};
    messageInsertQuery.insert = jest.fn().mockReturnValue(messageInsertQuery);
    messageInsertQuery.select = jest.fn().mockReturnValue(messageInsertQuery);
    messageInsertQuery.single = jest.fn().mockResolvedValue({
      data: options?.messageError ? null : { id: 'message-uuid-1' },
      error: options?.messageError ?? null,
    });

    const leadUpdateQuery: any = {};
    leadUpdateQuery.update = jest.fn().mockReturnValue(leadUpdateQuery);
    leadUpdateQuery.eq = jest.fn().mockResolvedValue({ error: null });

    const historyQuery: any = {};
    historyQuery.select = jest.fn().mockReturnValue(historyQuery);
    historyQuery.eq = jest.fn().mockReturnValue(historyQuery);
    historyQuery.neq = jest.fn().mockReturnValue(historyQuery);
    historyQuery.in = jest.fn().mockReturnValue(historyQuery);
    historyQuery.order = jest.fn().mockReturnValue(historyQuery);
    historyQuery.limit = jest.fn().mockResolvedValue({
      data: [
        {
          role: 'bot',
          content: '¿Qué modelo buscas?',
          created_at: '2026-08-02T11:55:00.000Z',
        },
        {
          role: 'system',
          content: 'UNSAFE_HISTORY_MARKER',
          created_at: '2026-08-02T11:54:00.000Z',
        },
        {
          role: 'customer',
          content: 'Busco una Ranger.',
          created_at: '2026-08-02T11:53:00.000Z',
        },
      ],
      error: null,
    });

    let leadQueryCount = 0;
    let messageQueryCount = 0;

    fromMock.mockImplementation((table: string) => {
      if (table === 'businesses') {
        return businessQuery;
      }

      if (table === 'leads') {
        leadQueryCount += 1;
        return leadQueryCount === 1 ? leadUpsertQuery : leadUpdateQuery;
      }

      if (table === 'messages') {
        messageQueryCount += 1;
        return messageQueryCount === 1 ? messageInsertQuery : historyQuery;
      }

      throw new Error(`Unexpected Supabase table: ${table}`);
    });

    return {
      businessQuery,
      leadUpsertQuery,
      messageInsertQuery,
      leadUpdateQuery,
      historyQuery,
    };
  };

  it('generates and persists a proposed draft using updated scoring and safe history', async () => {
    const queries = configureSupabase();

    const result = await service.handleIncomingWebhook(payload);

    expect(scoreMessageMock).toHaveBeenCalledWith({
      message: payload.data.message.conversation,
      currentLeadScore: lead.score,
      businessType: business.business_type,
    });
    expect(queries.messageInsertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: business.id,
        lead_id: lead.id,
        content: payload.data.message.conversation,
        external_message_id: payload.data.key.id,
      }),
    );
    expect(queries.messageInsertQuery.select).toHaveBeenCalledWith('id');
    expect(queries.messageInsertQuery.single).toHaveBeenCalledTimes(1);
    expect(queries.leadUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        score: scoringResult.leadScore,
        classification: scoringResult.classification,
        classification_reason: scoringResult.classificationReason,
      }),
    );
    expect(queries.historyQuery.select).toHaveBeenCalledWith(
      'role, content, created_at',
    );
    expect(queries.historyQuery.eq).toHaveBeenCalledWith('lead_id', lead.id);
    expect(queries.historyQuery.neq).toHaveBeenCalledWith(
      'id',
      'message-uuid-1',
    );
    expect(queries.historyQuery.in).toHaveBeenCalledWith('role', [
      'customer',
      'bot',
      'human',
    ]);
    expect(queries.historyQuery.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
    expect(queries.historyQuery.limit).toHaveBeenCalledWith(10);
    expect(generateDraftMock).toHaveBeenCalledTimes(1);
    expect(generateDraftMock).toHaveBeenCalledWith({
      business: {
        name: business.name,
        businessType: business.business_type,
      },
      lead: {
        score: scoringResult.leadScore,
        classification: scoringResult.classification,
        signals: scoringResult.signals,
        classificationReason: scoringResult.classificationReason,
      },
      currentMessage: payload.data.message.conversation,
      history: [
        {
          role: 'bot',
          content: '¿Qué modelo buscas?',
          createdAt: '2026-08-02T11:55:00.000Z',
        },
        {
          role: 'customer',
          content: 'Busco una Ranger.',
          createdAt: '2026-08-02T11:53:00.000Z',
        },
      ],
    });
    expect(JSON.stringify(generateDraftMock.mock.calls[0][0])).not.toContain(
      'PRIVATE_PAYLOAD_MARKER',
    );
    expect(JSON.stringify(generateDraftMock.mock.calls[0][0])).not.toContain(
      payload.data.key.id,
    );
    expect(createDraftMock).toHaveBeenCalledTimes(1);
    expect(createDraftMock).toHaveBeenCalledWith({
      businessId: business.id,
      leadId: lead.id,
      sourceMessageId: 'message-uuid-1',
      draft: generatedDraft,
    });
    expect(result).toMatchObject({
      ok: true,
      received: true,
      saved: true,
      score: scoringResult.leadScore,
      classification: scoringResult.classification,
      draftSaved: true,
      draftStatus: 'PROPOSED',
    });
  });

  it('does not load history or create a draft for a duplicate message', async () => {
    const queries = configureSupabase({
      messageError: {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      },
    });

    await expect(service.handleIncomingWebhook(payload)).resolves.toEqual({
      ok: true,
      received: true,
      saved: false,
      duplicated: true,
    });
    expect(queries.historyQuery.select).not.toHaveBeenCalled();
    expect(queries.leadUpdateQuery.update).not.toHaveBeenCalled();
    expect(generateDraftMock).not.toHaveBeenCalled();
    expect(createDraftMock).not.toHaveBeenCalled();
  });

  it('keeps the saved incoming message when draft generation fails', async () => {
    const queries = configureSupabase();
    generateDraftMock.mockRejectedValue(new Error('Provider unavailable'));

    const result = await service.handleIncomingWebhook(payload);

    expect(queries.messageInsertQuery.single).toHaveBeenCalledTimes(1);
    expect(queries.leadUpdateQuery.update).toHaveBeenCalledTimes(1);
    expect(generateDraftMock).toHaveBeenCalledTimes(1);
    expect(createDraftMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
      received: true,
      saved: true,
      draftSaved: false,
    });
    expect(result).not.toHaveProperty('draftStatus');
  });

  it('keeps the saved incoming message when draft persistence fails', async () => {
    const queries = configureSupabase();
    createDraftMock.mockRejectedValue(new Error('Persistence unavailable'));

    const result = await service.handleIncomingWebhook(payload);

    expect(queries.messageInsertQuery.single).toHaveBeenCalledTimes(1);
    expect(queries.leadUpdateQuery.update).toHaveBeenCalledTimes(1);
    expect(generateDraftMock).toHaveBeenCalledTimes(1);
    expect(createDraftMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      ok: true,
      received: true,
      saved: true,
      draftSaved: false,
    });
    expect(result).not.toHaveProperty('draftStatus');
  });

  it.each([
    ['an unrelated event', { event: 'connection.update' }],
    [
      'an invalid message payload',
      {
        event: 'messages.upsert',
        instance: business.evolution_instance_name,
        data: {
          key: {
            fromMe: false,
            remoteJid: `${lead.phone}@s.whatsapp.net`,
          },
          message: {},
        },
      },
    ],
  ])('does not call AI for %s', async (_scenario, ignoredPayload) => {
    await expect(
      service.handleIncomingWebhook(ignoredPayload),
    ).resolves.toEqual({
      ok: true,
      ignored: true,
    });
    expect(fromMock).not.toHaveBeenCalled();
    expect(generateDraftMock).not.toHaveBeenCalled();
    expect(createDraftMock).not.toHaveBeenCalled();
  });
});
