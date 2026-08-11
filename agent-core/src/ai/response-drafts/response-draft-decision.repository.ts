import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { Database } from '../../types/database.types';

const responseDraftDecisionDuplicateConstraint =
  'response_draft_decisions_response_draft_id_key';

function extractUniqueConstraintName(message: string): string | undefined {
  return message.match(/duplicate key value violates unique constraint "([^"]+)"/)?.[1];
}

type ResponseDraftDecisionBaseInput = {
  businessId: string;
  responseDraftId: string;
  operatorId: string;
};

export type CreateResponseDraftDecisionInput =
  | (ResponseDraftDecisionBaseInput & {
      decision: 'APPROVE' | 'REJECT';
      finalText?: null;
    })
  | (ResponseDraftDecisionBaseInput & {
      decision: 'EDIT_AND_APPROVE';
      finalText: string;
    });

export class DuplicateResponseDraftDecisionError extends Error {
  constructor(readonly responseDraftId: string) {
    super(`A decision already exists for response draft ${responseDraftId}`);
    this.name = 'DuplicateResponseDraftDecisionError';
  }
}

export class InvalidResponseDraftDecisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResponseDraftDecisionError';
  }
}

function validateDecisionInput(input: CreateResponseDraftDecisionInput): void {
  if (!input.operatorId.trim()) {
    throw new InvalidResponseDraftDecisionError(
      'Response draft decision operatorId must not be blank',
    );
  }

  if (input.decision === 'EDIT_AND_APPROVE') {
    if (!input.finalText.trim()) {
      throw new InvalidResponseDraftDecisionError(
        'EDIT_AND_APPROVE requires a non-blank finalText',
      );
    }
    return;
  }

  if (input.finalText !== undefined && input.finalText !== null) {
    throw new InvalidResponseDraftDecisionError(
      `${input.decision} requires finalText to be null`,
    );
  }
}

@Injectable()
export class ResponseDraftDecisionRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(
    input: CreateResponseDraftDecisionInput,
  ): Promise<
    Database['public']['Tables']['response_draft_decisions']['Row']
  > {
    validateDecisionInput(input);

    const { data, error } = await this.supabaseService.client
      .from('response_draft_decisions')
      .insert({
        business_id: input.businessId,
        response_draft_id: input.responseDraftId,
        operator_id: input.operatorId,
        decision: input.decision,
        final_text: input.finalText ?? null,
      })
      .select(
        'id, business_id, response_draft_id, operator_id, decision, final_text, decided_at',
      )
      .single();

    if (error) {
      if (
        error.code === '23505' &&
        extractUniqueConstraintName(error.message) ===
          responseDraftDecisionDuplicateConstraint
      ) {
        throw new DuplicateResponseDraftDecisionError(input.responseDraftId);
      }

      throw new Error(
        `Failed to create response draft decision: ${error.message}`,
      );
    }

    if (!data) {
      throw new Error(
        'Failed to create response draft decision: Supabase returned no data',
      );
    }

    return data;
  }
}
