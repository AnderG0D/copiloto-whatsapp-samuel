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
  let updateResponseDraftMock: jest.Mock;
  let deleteResponseDraftMock: jest.Mock;
  let upsertResponseDraftMock: jest.Mock;
  let createDecisionMock: jest.MockedFunction<
    ResponseDraftDecisionRepository['create']
  >;
  let unexpectedCollaboratorAccessMock: jest.Mock;

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
    updateResponseDraftMock = jest.fn();
    deleteResponseDraftMock = jest.fn();
    upsertResponseDraftMock = jest.fn();
    createDecisionMock = jest.fn();
    unexpectedCollaboratorAccessMock = jest.fn();

    const responseDraftRepository = new Proxy(
      {
        findByIdForBusiness: findByIdForBusinessMock,
        create: createResponseDraftMock,
        update: updateResponseDraftMock,
        delete: deleteResponseDraftMock,
        upsert: upsertResponseDraftMock,
      },
      {
        get(target, property, receiver) {
          if (!Reflect.has(target, property)) {
            unexpectedCollaboratorAccessMock(property);
            throw new Error(
              `Unexpected response draft repository access: ${String(property)}`,
            );
          }

          return Reflect.get(target, property, receiver);
        },
      },
    ) as unknown as ResponseDraftRepository;
    const responseDraftDecisionRepository = new Proxy(
      { create: createDecisionMock },
      {
        get(target, property, receiver) {
          if (!Reflect.has(target, property)) {
            unexpectedCollaboratorAccessMock(property);
            throw new Error(
              `Unexpected response draft decision repository access: ${String(property)}`,
            );
          }

          return Reflect.get(target, property, receiver);
        },
      },
    ) as unknown as ResponseDraftDecisionRepository;

    service = new ResponseDraftReviewService(
      responseDraftRepository,
      responseDraftDecisionRepository,
    );
  });

  function expectOnlyDecisionInsert(): void {
    expect(createResponseDraftMock).not.toHaveBeenCalled();
    expect(updateResponseDraftMock).not.toHaveBeenCalled();
    expect(deleteResponseDraftMock).not.toHaveBeenCalled();
    expect(upsertResponseDraftMock).not.toHaveBeenCalled();
    expect(unexpectedCollaboratorAccessMock).not.toHaveBeenCalled();
  }

  it.each([
    {
      command: { ...baseCommand, decision: 'APPROVE' as const },
      expectedDecision: { ...baseCommand, decision: 'APPROVE' as const },
      result: decisionRow('APPROVE'),
    },
    {
      command: {
        ...baseCommand,
        decision: 'EDIT_AND_APPROVE' as const,
        finalText: '  Texto final revisado.  ',
      },
      expectedDecision: {
        ...baseCommand,
        decision: 'EDIT_AND_APPROVE' as const,
        finalText: 'Texto final revisado.',
      },
      result: decisionRow('EDIT_AND_APPROVE', 'Texto final revisado.'),
    },
    {
      command: { ...baseCommand, decision: 'REJECT' as const },
      expectedDecision: { ...baseCommand, decision: 'REJECT' as const },
      result: decisionRow('REJECT'),
    },
  ])(
    'for $command.decision, reads the proposed draft and inserts only its decision',
    async ({ command, expectedDecision, result }) => {
      createDecisionMock.mockResolvedValue(result);
      const originalText = responseDraft.text;

      await expect(service.review(command)).resolves.toEqual(result);

      expect(findByIdForBusinessMock).toHaveBeenCalledTimes(1);
      expect(findByIdForBusinessMock).toHaveBeenCalledWith(
        baseCommand.businessId,
        baseCommand.responseDraftId,
      );
      expect(createDecisionMock).toHaveBeenCalledTimes(1);
      expect(createDecisionMock).toHaveBeenCalledWith(expectedDecision);
      expect(responseDraft.text).toBe(originalText);
      expectOnlyDecisionInsert();
    },
  );

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

  it('keeps the first decision and propagates the duplicate error on a second review', async () => {
    const firstDecision = decisionRow('APPROVE');
    const duplicateError = new DuplicateResponseDraftDecisionError(
      baseCommand.responseDraftId,
    );
    const persistedDecisions = [firstDecision];
    createDecisionMock
      .mockResolvedValueOnce(firstDecision)
      .mockImplementationOnce(async () => {
        throw duplicateError;
      });
    const originalText = responseDraft.text;

    await expect(
      service.review({ ...baseCommand, decision: 'APPROVE' }),
    ).resolves.toEqual(firstDecision);
    await expect(
      service.review({ ...baseCommand, decision: 'REJECT' }),
    ).rejects.toBe(duplicateError);

    expect(findByIdForBusinessMock).toHaveBeenCalledTimes(2);
    expect(createDecisionMock).toHaveBeenCalledTimes(2);
    expect(createDecisionMock).toHaveBeenNthCalledWith(1, {
      ...baseCommand,
      decision: 'APPROVE',
    });
    expect(createDecisionMock).toHaveBeenNthCalledWith(2, {
      ...baseCommand,
      decision: 'REJECT',
    });
    expect(persistedDecisions).toEqual([firstDecision]);
    expect(responseDraft.text).toBe(originalText);
    expectOnlyDecisionInsert();
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
    expectOnlyDecisionInsert();
  });

  it('depends only on the draft and decision repositories', () => {
    expect(
      Reflect.getMetadata('design:paramtypes', ResponseDraftReviewService),
    ).toEqual([ResponseDraftRepository, ResponseDraftDecisionRepository]);
    expect(findByIdForBusinessMock).not.toHaveBeenCalled();
    expect(createResponseDraftMock).not.toHaveBeenCalled();
    expect(createDecisionMock).not.toHaveBeenCalled();
    expect(unexpectedCollaboratorAccessMock).not.toHaveBeenCalled();
  });
});
