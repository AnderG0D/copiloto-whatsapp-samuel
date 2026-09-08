import { Injectable } from '@nestjs/common';
import {
  ResponseDraftReadRepository,
  type ResponseDraftListCursor,
} from './response-draft-read.repository';

const PREVIEW_LENGTH = 280;

export type ReadResponseDraftsCommand = {
  businessId: string;
  limit: number;
  cursor?: ResponseDraftListCursor;
};

export class ResponseDraftReadNotFoundError extends Error {}

@Injectable()
export class ResponseDraftReadService {
  constructor(private readonly repository: ResponseDraftReadRepository) {}

  async list(command: ReadResponseDraftsCommand) {
    const result = await this.repository.listProposedForBusiness(
      command.businessId,
      command.limit,
      command.cursor,
    );
    const last = result.rows.at(-1);
    return {
      items: result.rows.map((row) => ({
        id: row.id,
        businessId: row.business_id,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        draftTextPreview: preview(row.text),
        sourceMessage: row.source_message
          ? {
              id: row.source_message.id,
              contentPreview: preview(row.source_message.content),
              createdAt: row.source_message.created_at,
            }
          : null,
        lead: {
          score: row.lead?.score ?? null,
          classification: row.lead?.classification ?? null,
        },
      })),
      page: {
        limit: command.limit,
        nextCursor:
          result.hasMore && last
            ? encodeCursor({ createdAt: last.created_at, id: last.id })
            : null,
      },
    };
  }

  async detail(businessId: string, responseDraftId: string) {
    const detail = await this.repository.findDetailForBusiness(
      businessId,
      responseDraftId,
    );
    if (!detail) throw new ResponseDraftReadNotFoundError();
    return {
      draft: {
        id: detail.draft.id, businessId: detail.draft.business_id, leadId: detail.draft.lead_id,
        sourceMessageId: detail.draft.source_message_id, text: detail.draft.text, status: detail.draft.status,
        createdAt: detail.draft.created_at, updatedAt: detail.draft.updated_at,
      },
      business: { id: detail.business.id, name: detail.business.name, businessType: detail.business.business_type },
      sourceMessage: {
        id: detail.sourceMessage.id, content: detail.sourceMessage.content, direction: detail.sourceMessage.direction,
        role: detail.sourceMessage.role, createdAt: detail.sourceMessage.created_at, score: detail.sourceMessage.score,
        classification: detail.sourceMessage.classification, classificationReason: detail.sourceMessage.classification_reason,
        detectedSignals: objectOrNull(detail.sourceMessage.detected_signals),
      },
      lead: {
        id: detail.lead.id, score: detail.lead.score, classification: detail.lead.classification,
        classificationReason: detail.lead.classification_reason, status: detail.lead.status,
        lastMessageAt: detail.lead.last_message_at,
      },
      safeContext: {
        messages: detail.context.map((message) => ({
          id: message.id, content: message.content, direction: message.direction,
          role: message.role, createdAt: message.created_at,
        })),
        truncated: detail.contextTruncated,
      },
      review: detail.review
        ? { decision: detail.review.decision, operatorId: detail.review.operator_id, finalText: detail.review.final_text, decidedAt: detail.review.decided_at }
        : { decision: null, operatorId: null, finalText: null, decidedAt: null },
    };
  }
}

export function encodeCursor(cursor: ResponseDraftListCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeCursor(value: string): ResponseDraftListCursor | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed !== 'object') return null;
    const cursor = parsed as Record<string, unknown>;
    if (typeof cursor.createdAt !== 'string' || Number.isNaN(Date.parse(cursor.createdAt)) || typeof cursor.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cursor.id)) return null;
    return { createdAt: cursor.createdAt, id: cursor.id };
  } catch { return null; }
}

function preview(value: string): string {
  return value.length <= PREVIEW_LENGTH ? value : `${value.slice(0, PREVIEW_LENGTH - 1)}…`;
}

function objectOrNull(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
