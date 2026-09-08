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

describe('ResponseDraftDecisionRepository', () => {
  let repository: ResponseDraftDecisionRepository;
  let rpcMock: jest.Mock;
  let singleMock: jest.Mock;

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
    rpcMock = jest.fn().mockReturnValue({ single: singleMock });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseDraftDecisionRepository,
        {
          provide: SupabaseService,
          useValue: {
            client: {
              rpc: rpcMock,
            },
          },
        },
      ],
    }).compile();

    repository = module.get(ResponseDraftDecisionRepository);
  });

  function expectAtomicReview(
    input: CreateResponseDraftDecisionInput,
  ): void {
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith('review_response_draft', {
      p_business_id: input.businessId,
      p_response_draft_id: input.responseDraftId,
      p_operator_id: input.operatorId,
      p_decision: input.decision,
      p_final_text: input.finalText ?? null,
    });
    expect(singleMock).toHaveBeenCalledTimes(1);
  }

  it('applies APPROVE through the atomic review function', async () => {
    singleMock.mockResolvedValue({ data: approveRow, error: null });

    await expect(repository.create(approveInput)).resolves.toEqual(approveRow);
    expectAtomicReview(approveInput);
  });

  it('applies EDIT_AND_APPROVE with a non-blank final text', async () => {
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
    expectAtomicReview(input);
  });

  it('applies REJECT without final text', async () => {
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
    expectAtomicReview(input);
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
    expect(rpcMock).not.toHaveBeenCalled();
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
    expect(rpcMock).not.toHaveBeenCalled();
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
      expect(rpcMock).not.toHaveBeenCalled();
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
    expect(rpcMock).toHaveBeenCalledTimes(2);
  });

  it('keeps an unidentified unique violation as a generic Supabase error', async () => {
    const message =
      'duplicate key value violates unique constraint "response_draft_decisions_pkey"';
    singleMock.mockResolvedValue({
      data: null,
      error: { code: '23505', message },
    });

    await expect(repository.create(approveInput)).rejects.toThrow(
      `Failed to create response draft decision: ${message}`,
    );
    expectAtomicReview(approveInput);
  });

  it('throws a descriptive error when Supabase returns another error', async () => {
    singleMock.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'permission denied' },
    });

    await expect(repository.create(approveInput)).rejects.toThrow(
      'Failed to create response draft decision: permission denied',
    );
    expectAtomicReview(approveInput);
  });

  it('throws a descriptive error when Supabase returns no data', async () => {
    singleMock.mockResolvedValue({ data: null, error: null });

    await expect(repository.create(approveInput)).rejects.toThrow(
      'Failed to create response draft decision: Supabase returned no data',
    );
    expectAtomicReview(approveInput);
  });

  it('uses only the atomic review RPC and does not access tables or outbound channels', async () => {
    singleMock.mockResolvedValue({ data: approveRow, error: null });

    await expect(repository.create(approveInput)).resolves.toEqual(approveRow);
    expectAtomicReview(approveInput);
    expect(
      Object.getOwnPropertyNames(ResponseDraftDecisionRepository.prototype),
    ).toEqual(['constructor', 'create']);
    expect((repository as unknown as { send?: unknown }).send).toBeUndefined();
  });
});
