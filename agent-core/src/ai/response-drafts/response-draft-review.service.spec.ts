import 'reflect-metadata';
import type { Database } from '../../types/database.types';
import {
  DuplicateResponseDraftDecisionError,
  ResponseDraftDecisionRepository,
} from './response-draft-decision.repository';
import { ResponseDraftRepository } from './response-draft.repository';
import {
  InvalidResponseDraftReviewError,
  ResponseDraftNotEligibleError,
  ResponseDraftNotFoundError,
  ResponseDraftReviewService,
  type ReviewResponseDraftCommand,
} from './response-draft-review.service';

type ResponseDraftRow = Database['public']['Tables']['response_drafts']['Row'];
type ResponseDraftDecisionRow =
  Database['public']['Tables']['response_draft_decisions']['Row'];

describe('ResponseDraftReviewService', () => {
  let service: ResponseDraftReviewService;
  let findByIdForBusinessMock: jest.MockedFunction<
    ResponseDraftRepository['findByIdForBusiness']
  >;
  let createResponseDraftMock: jest.MockedFunction<
    ResponseDraftRepository['create']
  >;
  let createDecisionMock: jest.MockedFunction<
    ResponseDraftDecisionRepository['create']
  >;

  const baseCommand = {
    businessId: 'business-1',
    responseDraftId: 'draft-1',
    operatorId: 'operator-1',
  };

  const responseDraft: ResponseDraftRow = {
    id: baseCommand.responseDraftId,
    business_id: baseCommand.businessId,
    lead_id: 'lead-1',
    source_message_id: 'message-1',
    text: 'Texto original propuesto.',
    status: 'PROPOSED',
    created_at: '2026-08-11T08:00:00.000Z',
    updated_at: '2026-08-11T08:00:00.000Z',
  };

  const decisionRow = (
    decision: ReviewResponseDraftCommand['decision'],
    finalText: string | null = null,
  ): ResponseDraftDecisionRow => ({
    id: 'decision-1',
    business_id: baseCommand.businessId,
    response_draft_id: baseCommand.responseDraftId,
    operator_id: baseCommand.operatorId,
    decision,
    final_text: finalText,
    decided_at: '2026-08-11T08:05:00.000Z',
  });

  beforeEach(() => {
    findByIdForBusinessMock = jest.fn().mockResolvedValue(responseDraft);
    createResponseDraftMock = jest.fn();
    createDecisionMock = jest.fn();

    const responseDraftRepository = {
      findByIdForBusiness: findByIdForBusinessMock,
      create: createResponseDraftMock,
    } as unknown as ResponseDraftRepository;
    const responseDraftDecisionRepository = {
      create: createDecisionMock,
    } as unknown as ResponseDraftDecisionRepository;

    service = new ResponseDraftReviewService(
      responseDraftRepository,
      responseDraftDecisionRepository,
    );
  });

  it('reviews a PROPOSED draft with APPROVE', async () => {
    const result = decisionRow('APPROVE');
    createDecisionMock.mockResolvedValue(result);

    await expect(
      service.review({ ...baseCommand, decision: 'APPROVE' }),
    ).resolves.toEqual(result);

    expect(findByIdForBusinessMock).toHaveBeenCalledWith(
      baseCommand.businessId,
      baseCommand.responseDraftId,
    );
    expect(createDecisionMock).toHaveBeenCalledWith({
      ...baseCommand,
      decision: 'APPROVE',
    });
    expect(createResponseDraftMock).not.toHaveBeenCalled();
  });

  it('reviews a PROPOSED draft with REJECT', async () => {
    const result = decisionRow('REJECT');
    createDecisionMock.mockResolvedValue(result);

    await expect(
      service.review({ ...baseCommand, decision: 'REJECT' }),
    ).resolves.toEqual(result);

    expect(createDecisionMock).toHaveBeenCalledWith({
      ...baseCommand,
      decision: 'REJECT',
    });
    expect(createResponseDraftMock).not.toHaveBeenCalled();
  });

  it('normalizes final text for EDIT_AND_APPROVE', async () => {
    const normalizedText = 'Texto final revisado.';
    const result = decisionRow('EDIT_AND_APPROVE', normalizedText);
    createDecisionMock.mockResolvedValue(result);

    await expect(
      service.review({
        ...baseCommand,
        decision: 'EDIT_AND_APPROVE',
        finalText: `  ${normalizedText}  `,
      }),
    ).resolves.toEqual(result);

    expect(createDecisionMock).toHaveBeenCalledWith({
      ...baseCommand,
      decision: 'EDIT_AND_APPROVE',
      finalText: normalizedText,
    });
    expect(createResponseDraftMock).not.toHaveBeenCalled();
  });

  it('rejects EDIT_AND_APPROVE without final text', async () => {
    const command = {
      ...baseCommand,
      decision: 'EDIT_AND_APPROVE',
    } as ReviewResponseDraftCommand;

    await expect(service.review(command)).rejects.toEqual(
      new InvalidResponseDraftReviewError(
        'EDIT_AND_APPROVE requires a non-blank finalText',
      ),
    );
    expect(findByIdForBusinessMock).not.toHaveBeenCalled();
    expect(createDecisionMock).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only final text for EDIT_AND_APPROVE', async () => {
    await expect(
      service.review({
        ...baseCommand,
        decision: 'EDIT_AND_APPROVE',
        finalText: '   ',
      }),
    ).rejects.toEqual(
      new InvalidResponseDraftReviewError(
        'EDIT_AND_APPROVE requires a non-blank finalText',
      ),
    );
    expect(findByIdForBusinessMock).not.toHaveBeenCalled();
    expect(createDecisionMock).not.toHaveBeenCalled();
  });

  it.each(['APPROVE', 'REJECT'] as const)(
    'rejects finalText supplied with %s',
    async (decision) => {
      const command = {
        ...baseCommand,
        decision,
        finalText: 'Texto no permitido',
      } as unknown as ReviewResponseDraftCommand;

      await expect(service.review(command)).rejects.toEqual(
        new InvalidResponseDraftReviewError(
          `${decision} does not accept finalText`,
        ),
      );
      expect(findByIdForBusinessMock).not.toHaveBeenCalled();
      expect(createDecisionMock).not.toHaveBeenCalled();
    },
  );

  it.each(['', '   '])(
    'rejects a blank operatorId (%p)',
    async (operatorId) => {
      await expect(
        service.review({
          ...baseCommand,
          operatorId,
          decision: 'APPROVE',
        }),
      ).rejects.toEqual(
        new InvalidResponseDraftReviewError(
          'Response draft review operatorId must not be blank',
        ),
      );
      expect(findByIdForBusinessMock).not.toHaveBeenCalled();
      expect(createDecisionMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['businessId', { businessId: '   ' }],
    ['responseDraftId', { responseDraftId: '' }],
  ] as const)('rejects a blank %s', async (field, override) => {
    const command = {
      ...baseCommand,
      ...override,
      decision: 'APPROVE',
    } as ReviewResponseDraftCommand;

    await expect(service.review(command)).rejects.toEqual(
      new InvalidResponseDraftReviewError(
        `Response draft review ${field} must not be blank`,
      ),
    );
    expect(findByIdForBusinessMock).not.toHaveBeenCalled();
    expect(createDecisionMock).not.toHaveBeenCalled();
  });

  it('returns the domain not-found error for an absent draft', async () => {
    findByIdForBusinessMock.mockResolvedValue(null);

    await expect(
      service.review({ ...baseCommand, decision: 'APPROVE' }),
    ).rejects.toEqual(
      new ResponseDraftNotFoundError(baseCommand.responseDraftId),
    );
    expect(createDecisionMock).not.toHaveBeenCalled();
  });

  it('makes a draft from another business indistinguishable from an absent draft', async () => {
    findByIdForBusinessMock.mockResolvedValue(null);
    const command = {
      ...baseCommand,
      businessId: 'other-business',
      decision: 'APPROVE',
    } as const;

    await expect(service.review(command)).rejects.toEqual(
      new ResponseDraftNotFoundError(baseCommand.responseDraftId),
    );
    expect(findByIdForBusinessMock).toHaveBeenCalledWith(
      'other-business',
      baseCommand.responseDraftId,
    );
    expect(createDecisionMock).not.toHaveBeenCalled();
  });

  it('rejects a draft that is not PROPOSED', async () => {
    findByIdForBusinessMock.mockResolvedValue({
      ...responseDraft,
      status: 'APPROVED',
    });

    await expect(
      service.review({ ...baseCommand, decision: 'APPROVE' }),
    ).rejects.toEqual(
      new ResponseDraftNotEligibleError(responseDraft.id, 'APPROVED'),
    );
    expect(createDecisionMock).not.toHaveBeenCalled();
    expect(createResponseDraftMock).not.toHaveBeenCalled();
  });

  it('preserves the exact duplicate domain error returned by the repository', async () => {
    const duplicateError = new DuplicateResponseDraftDecisionError(
      baseCommand.responseDraftId,
    );
    createDecisionMock.mockRejectedValue(duplicateError);

    await expect(
      service.review({ ...baseCommand, decision: 'APPROVE' }),
    ).rejects.toBe(duplicateError);
    expect(createDecisionMock).toHaveBeenCalledTimes(1);
  });

  it('does not reclassify a generic persistence error as a duplicate', async () => {
    const persistenceError = new Error(
      'Failed to create response draft decision: permission denied',
    );
    createDecisionMock.mockRejectedValue(persistenceError);

    await expect(
      service.review({ ...baseCommand, decision: 'APPROVE' }),
    ).rejects.toBe(persistenceError);
  });

  it('reads the draft and inserts only the decision without mutating response_drafts', async () => {
    createDecisionMock.mockResolvedValue(decisionRow('APPROVE'));

    await service.review({ ...baseCommand, decision: 'APPROVE' });

    expect(findByIdForBusinessMock).toHaveBeenCalledTimes(1);
    expect(createDecisionMock).toHaveBeenCalledTimes(1);
    expect(createResponseDraftMock).not.toHaveBeenCalled();
  });

  it('depends only on the draft and decision repositories', () => {
    expect(
      Reflect.getMetadata('design:paramtypes', ResponseDraftReviewService),
    ).toEqual([ResponseDraftRepository, ResponseDraftDecisionRepository]);
    expect(findByIdForBusinessMock).not.toHaveBeenCalled();
    expect(createResponseDraftMock).not.toHaveBeenCalled();
    expect(createDecisionMock).not.toHaveBeenCalled();
  });
});
