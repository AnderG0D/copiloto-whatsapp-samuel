import { Injectable } from '@nestjs/common';
import type { Database } from '../../types/database.types';
import { ResponseDraftDecisionRepository } from './response-draft-decision.repository';
import { ResponseDraftRepository } from './response-draft.repository';

type ReviewResponseDraftBaseCommand = {
  businessId: string;
  responseDraftId: string;
  operatorId: string;
};

export type ReviewResponseDraftCommand =
  | (ReviewResponseDraftBaseCommand & {
      decision: 'APPROVE' | 'REJECT';
      finalText?: never;
    })
  | (ReviewResponseDraftBaseCommand & {
      decision: 'EDIT_AND_APPROVE';
      finalText: string;
    });

type ResponseDraftDecisionRow =
  Database['public']['Tables']['response_draft_decisions']['Row'];

export class InvalidResponseDraftReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResponseDraftReviewError';
  }
}

export class ResponseDraftNotFoundError extends Error {
  constructor(readonly responseDraftId: string) {
    super(`Response draft ${responseDraftId} was not found`);
    this.name = 'ResponseDraftNotFoundError';
  }
}

export class ResponseDraftNotEligibleError extends Error {
  constructor(
    readonly responseDraftId: string,
    readonly status: string,
  ) {
    super(
      `Response draft ${responseDraftId} is not eligible for review from status ${status}`,
    );
    this.name = 'ResponseDraftNotEligibleError';
  }
}

@Injectable()
export class ResponseDraftReviewService {
  constructor(
    private readonly responseDraftRepository: ResponseDraftRepository,
    private readonly responseDraftDecisionRepository: ResponseDraftDecisionRepository,
  ) {}

  async review(
    command: ReviewResponseDraftCommand,
  ): Promise<ResponseDraftDecisionRow> {
    this.validateCommand(command);

    const responseDraft =
      await this.responseDraftRepository.findByIdForBusiness(
        command.businessId,
        command.responseDraftId,
      );

    if (!responseDraft) {
      throw new ResponseDraftNotFoundError(command.responseDraftId);
    }

    if (responseDraft.status !== 'PROPOSED') {
      throw new ResponseDraftNotEligibleError(
        responseDraft.id,
        responseDraft.status,
      );
    }

    if (command.decision === 'EDIT_AND_APPROVE') {
      return this.responseDraftDecisionRepository.create({
        businessId: command.businessId,
        responseDraftId: command.responseDraftId,
        operatorId: command.operatorId,
        decision: command.decision,
        finalText: command.finalText.trim(),
      });
    }

    return this.responseDraftDecisionRepository.create({
      businessId: command.businessId,
      responseDraftId: command.responseDraftId,
      operatorId: command.operatorId,
      decision: command.decision,
    });
  }

  private validateCommand(command: ReviewResponseDraftCommand): void {
    this.requireNonBlank(command.businessId, 'businessId');
    this.requireNonBlank(command.responseDraftId, 'responseDraftId');
    this.requireNonBlank(command.operatorId, 'operatorId');

    switch (command.decision) {
      case 'EDIT_AND_APPROVE':
        if (
          typeof command.finalText !== 'string' ||
          !command.finalText.trim()
        ) {
          throw new InvalidResponseDraftReviewError(
            'EDIT_AND_APPROVE requires a non-blank finalText',
          );
        }
        return;
      case 'APPROVE':
      case 'REJECT':
        if (Object.prototype.hasOwnProperty.call(command, 'finalText')) {
          throw new InvalidResponseDraftReviewError(
            `${command.decision} does not accept finalText`,
          );
        }
        return;
      default:
        throw new InvalidResponseDraftReviewError(
          `Unsupported response draft decision: ${String((command as { decision?: unknown }).decision)}`,
        );
    }
  }

  private requireNonBlank(value: string, field: string): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new InvalidResponseDraftReviewError(
        `Response draft review ${field} must not be blank`,
      );
    }
  }
}
