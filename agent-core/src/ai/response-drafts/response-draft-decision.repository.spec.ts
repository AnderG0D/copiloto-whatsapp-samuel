import { Test, type TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../../supabase/supabase.service';
import type { Database } from '../../types/database.types';
import {
  DuplicateResponseDraftDecisionError,
  InvalidResponseDraftDecisionError,
  ResponseDraftDecisionRepository,
  type CreateResponseDraftDecisionInput,
} from './response-draft-decision.repository';

type ResponseDraftDecisionRow =
  Database['public']['Tables']['response_draft_decisions']['Row'];
type ResponseDraftDecisionInsert =
  Database['public']['Tables']['response_draft_decisions']['Insert'];

describe('ResponseDraftDecisionRepository', () => {
  let repository: ResponseDraftDecisionRepository;
  let fromMock: jest.Mock;
  let insertMock: jest.Mock;
  let selectMock: jest.Mock;
  let singleMock: jest.Mock;
  let upsertMock: jest.Mock;
  let updateMock: jest.Mock;
  let deleteMock: jest.Mock;

  const baseInput = {
    businessId: 'business-1',
    responseDraftId: 'draft-1',
    operatorId: 'operator-1',
  };

  const approveInput: CreateResponseDraftDecisionInput = {
    ...baseInput,
    decision: 'APPROVE',
  };

  const approveRow: ResponseDraftDecisionRow = {
    id: 'decision-1',
    business_id: baseInput.businessId,
    response_draft_id: baseInput.responseDraftId,
    operator_id: baseInput.operatorId,
    decision: 'APPROVE',
    final_text: null,
    decided_at: '2026-08-07T08:00:00.000Z',
  };

  beforeEach(async () => {
    singleMock = jest.fn();
    selectMock = jest.fn().mockReturnValue({ single: singleMock });
    insertMock = jest.fn().mockReturnValue({ select: selectMock });
    upsertMock = jest.fn();
    updateMock = jest.fn();
    deleteMock = jest.fn();
    fromMock = jest.fn((table: string) => {
      if (table !== 'response_draft_decisions') {
        throw new Error(`Unexpected Supabase table access: ${table}`);
      }

      return {
        insert: insertMock,
        upsert: upsertMock,
        update: updateMock,
        delete: deleteMock,
      };
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseDraftDecisionRepository,
        {
          provide: SupabaseService,
          useValue: {
            client: {
              from: fromMock,
            },
          },
        },
      ],
    }).compile();

    repository = module.get(ResponseDraftDecisionRepository);
  });

  function expectInsertOnly(): void {
    expect(upsertMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  }

  function expectSingleDecisionInsert(
    payload: ResponseDraftDecisionInsert,
  ): void {
    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith('response_draft_decisions');
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith(payload);
    expectInsertOnly();
  }

  it('inserts APPROVE with the trusted operator and matching business id', async () => {
    singleMock.mockResolvedValue({ data: approveRow, error: null });

    await expect(repository.create(approveInput)).resolves.toEqual(approveRow);
    expectSingleDecisionInsert({
      business_id: baseInput.businessId,
      response_draft_id: baseInput.responseDraftId,
      operator_id: baseInput.operatorId,
      decision: 'APPROVE',
      final_text: null,
    });
    expect(selectMock).toHaveBeenCalledWith(
      'id, business_id, response_draft_id, operator_id, decision, final_text, decided_at',
    );
    expect(singleMock).toHaveBeenCalledTimes(1);
  });

  it('inserts EDIT_AND_APPROVE with a non-blank final text', async () => {
    const input: CreateResponseDraftDecisionInput = {
      ...baseInput,
      decision: 'EDIT_AND_APPROVE',
      finalText: 'Texto final revisado por el operador.',
    };
    const row: ResponseDraftDecisionRow = {
      ...approveRow,
      decision: input.decision,
      final_text: input.finalText,
    };
    singleMock.mockResolvedValue({ data: row, error: null });

    await expect(repository.create(input)).resolves.toEqual(row);
    expectSingleDecisionInsert({
      business_id: input.businessId,
      response_draft_id: input.responseDraftId,
      operator_id: input.operatorId,
      decision: 'EDIT_AND_APPROVE',
      final_text: input.finalText,
    });
  });

  it('inserts REJECT without final text', async () => {
    const input: CreateResponseDraftDecisionInput = {
      ...baseInput,
      decision: 'REJECT',
    };
    const row: ResponseDraftDecisionRow = {
      ...approveRow,
      decision: input.decision,
    };
    singleMock.mockResolvedValue({ data: row, error: null });

    await expect(repository.create(input)).resolves.toEqual(row);
    expectSingleDecisionInsert({
      business_id: input.businessId,
      response_draft_id: input.responseDraftId,
      operator_id: input.operatorId,
      decision: 'REJECT',
      final_text: null,
    });
  });

  it('rejects a blank operator id before calling Supabase', async () => {
    const input: CreateResponseDraftDecisionInput = {
      ...approveInput,
      operatorId: '   ',
    };

    await expect(repository.create(input)).rejects.toThrow(
      new InvalidResponseDraftDecisionError(
        'Response draft decision operatorId must not be blank',
      ),
    );
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects blank final text for EDIT_AND_APPROVE before calling Supabase', async () => {
    const input: CreateResponseDraftDecisionInput = {
      ...baseInput,
      decision: 'EDIT_AND_APPROVE',
      finalText: '  ',
    };

    await expect(repository.create(input)).rejects.toThrow(
      new InvalidResponseDraftDecisionError(
        'EDIT_AND_APPROVE requires a non-blank finalText',
      ),
    );
    expect(fromMock).not.toHaveBeenCalled();
  });

  it.each(['APPROVE', 'REJECT'] as const)(
    'rejects final text for %s before calling Supabase',
    async (decision) => {
      const input = {
        ...baseInput,
        decision,
        finalText: 'Unexpected overwrite',
      } as unknown as CreateResponseDraftDecisionInput;

      await expect(repository.create(input)).rejects.toThrow(
        new InvalidResponseDraftDecisionError(
          `${decision} requires finalText to be null`,
        ),
      );
      expect(fromMock).not.toHaveBeenCalled();
    },
  );

  it('translates duplicate decisions without overwriting the first row', async () => {
    singleMock
      .mockResolvedValueOnce({ data: approveRow, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: '23505',
          message:
            'duplicate key value violates unique constraint "response_draft_decisions_response_draft_id_key"',
        },
      });

    const firstDecision = await repository.create(approveInput);
    await expect(repository.create(approveInput)).rejects.toEqual(
      new DuplicateResponseDraftDecisionError(baseInput.responseDraftId),
    );

    expect(firstDecision).toEqual(approveRow);
    expect(fromMock).toHaveBeenCalledTimes(2);
    expect(fromMock).toHaveBeenNthCalledWith(
      1,
      'response_draft_decisions',
    );
    expect(fromMock).toHaveBeenNthCalledWith(
      2,
      'response_draft_decisions',
    );
    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(insertMock).toHaveBeenNthCalledWith(1, {
      business_id: baseInput.businessId,
      response_draft_id: baseInput.responseDraftId,
      operator_id: baseInput.operatorId,
      decision: 'APPROVE',
      final_text: null,
    });
    expect(insertMock).toHaveBeenNthCalledWith(2, {
      business_id: baseInput.businessId,
      response_draft_id: baseInput.responseDraftId,
      operator_id: baseInput.operatorId,
      decision: 'APPROVE',
      final_text: null,
    });
    expectInsertOnly();
  });

  it('keeps a primary-key 23505 as a generic Supabase error', async () => {
    const message =
      'duplicate key value violates unique constraint "response_draft_decisions_pkey"';
    singleMock.mockResolvedValue({
      data: null,
      error: { code: '23505', message },
    });

    await expect(repository.create(approveInput)).rejects.toThrow(
      `Failed to create response draft decision: ${message}`,
    );
    expectSingleDecisionInsert({
      business_id: baseInput.businessId,
      response_draft_id: baseInput.responseDraftId,
      operator_id: baseInput.operatorId,
      decision: 'APPROVE',
      final_text: null,
    });
  });

  it('keeps a similarly named unique constraint as a generic Supabase error', async () => {
    const message =
      'duplicate key value violates unique constraint "response_draft_decisions_response_draft_id_key_shadow"';
    singleMock.mockResolvedValue({
      data: null,
      error: { code: '23505', message },
    });

    await expect(repository.create(approveInput)).rejects.toThrow(
      `Failed to create response draft decision: ${message}`,
    );
    expectSingleDecisionInsert({
      business_id: baseInput.businessId,
      response_draft_id: baseInput.responseDraftId,
      operator_id: baseInput.operatorId,
      decision: 'APPROVE',
      final_text: null,
    });
  });

  it('keeps an unidentified 23505 as a generic Supabase error', async () => {
    const message = 'duplicate key value violates unique constraint';
    singleMock.mockResolvedValue({
      data: null,
      error: { code: '23505', message },
    });

    await expect(repository.create(approveInput)).rejects.toThrow(
      `Failed to create response draft decision: ${message}`,
    );
    expectSingleDecisionInsert({
      business_id: baseInput.businessId,
      response_draft_id: baseInput.responseDraftId,
      operator_id: baseInput.operatorId,
      decision: 'APPROVE',
      final_text: null,
    });
  });

  it('throws a descriptive error when Supabase returns another error', async () => {
    singleMock.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'permission denied' },
    });

    await expect(repository.create(approveInput)).rejects.toThrow(
      'Failed to create response draft decision: permission denied',
    );
    expectSingleDecisionInsert({
      business_id: baseInput.businessId,
      response_draft_id: baseInput.responseDraftId,
      operator_id: baseInput.operatorId,
      decision: 'APPROVE',
      final_text: null,
    });
  });

  it('throws a descriptive error when Supabase returns no data', async () => {
    singleMock.mockResolvedValue({ data: null, error: null });

    await expect(repository.create(approveInput)).rejects.toThrow(
      'Failed to create response draft decision: Supabase returned no data',
    );
    expectSingleDecisionInsert({
      business_id: baseInput.businessId,
      response_draft_id: baseInput.responseDraftId,
      operator_id: baseInput.operatorId,
      decision: 'APPROVE',
      final_text: null,
    });
  });

  it('creates only a decision row and does not send or persist elsewhere', async () => {
    singleMock.mockResolvedValue({ data: approveRow, error: null });

    await expect(repository.create(approveInput)).resolves.toEqual(approveRow);
    expectSingleDecisionInsert({
      business_id: baseInput.businessId,
      response_draft_id: baseInput.responseDraftId,
      operator_id: baseInput.operatorId,
      decision: 'APPROVE',
      final_text: null,
    });
    expect(fromMock).not.toHaveBeenCalledWith('messages');
    expect(fromMock).not.toHaveBeenCalledWith('outbox');
    expect(fromMock).not.toHaveBeenCalledWith('response_drafts');
    expect(
      Object.getOwnPropertyNames(ResponseDraftDecisionRepository.prototype),
    ).toEqual(['constructor', 'create']);
    expect(
      (repository as unknown as { send?: unknown }).send,
    ).toBeUndefined();
  });
});
