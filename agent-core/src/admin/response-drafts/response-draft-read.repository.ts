import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { Database, Json } from '../../types/database.types';

type DraftRow = Database['public']['Tables']['response_drafts']['Row'];
type BusinessRow = Database['public']['Tables']['businesses']['Row'];
type LeadRow = Database['public']['Tables']['leads']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];
type DecisionRow =
  Database['public']['Tables']['response_draft_decisions']['Row'];

type ListDraftRow = DraftRow & {
  source_message: Pick<MessageRow, 'id' | 'content' | 'created_at'> | null;
  lead: Pick<LeadRow, 'score' | 'classification'> | null;
};

export type ResponseDraftListCursor = { createdAt: string; id: string };

export type ResponseDraftListResult = {
  rows: ListDraftRow[];
  hasMore: boolean;
};

export type ResponseDraftReadDetail = {
  draft: DraftRow;
  business: Pick<BusinessRow, 'id' | 'name' | 'business_type'>;
  sourceMessage: Pick<
    MessageRow,
    | 'id'
    | 'content'
    | 'direction'
    | 'role'
    | 'created_at'
    | 'score'
    | 'classification'
    | 'classification_reason'
    | 'detected_signals'
  >;
  lead: Pick<
    LeadRow,
    'id' | 'score' | 'classification' | 'classification_reason' | 'status' | 'last_message_at'
  >;
  context: Array<
    Pick<MessageRow, 'id' | 'content' | 'direction' | 'role' | 'created_at'>
  >;
  contextTruncated: boolean;
  review: Pick<
    DecisionRow,
    'decision' | 'operator_id' | 'final_text' | 'decided_at'
  > | null;
};

type SupabaseResult<T> = { data: T | null; error: { message: string } | null };

@Injectable()
export class ResponseDraftReadRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listProposedForBusiness(
    businessId: string,
    limit: number,
    cursor?: ResponseDraftListCursor,
  ): Promise<ResponseDraftListResult> {
    let query = this.supabaseService.client
      .from('response_drafts')
      .select(
        'id, business_id, lead_id, source_message_id, text, status, created_at, updated_at, source_message:messages!response_drafts_source_message_id_fkey(id, content, created_at), lead:leads!response_drafts_lead_id_fkey(score, classification)',
      )
      .eq('business_id', businessId)
      .eq('status', 'PROPOSED')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
      );
    }

    const { data, error } = (await query) as unknown as SupabaseResult<
      ListDraftRow[]
    >;

    if (error) {
      throw new Error(`Failed to list response drafts: ${error.message}`);
    }

    const rows = data ?? [];
    return { rows: rows.slice(0, limit), hasMore: rows.length > limit };
  }

  async findDetailForBusiness(
    businessId: string,
    responseDraftId: string,
  ): Promise<ResponseDraftReadDetail | null> {
    const draftResult = (await this.supabaseService.client
      .from('response_drafts')
      .select('id, business_id, lead_id, source_message_id, text, status, created_at, updated_at')
      .eq('business_id', businessId)
      .eq('id', responseDraftId)
      .maybeSingle()) as unknown as SupabaseResult<DraftRow>;

    if (draftResult.error) {
      throw new Error(`Failed to find response draft: ${draftResult.error.message}`);
    }
    if (!draftResult.data) return null;

    const draft = draftResult.data;
    const [businessResult, messageResult, leadResult, contextResult, reviewResult] =
      await Promise.all([
        this.supabaseService.client
          .from('businesses')
          .select('id, name, business_type')
          .eq('id', businessId)
          .maybeSingle(),
        this.supabaseService.client
          .from('messages')
          .select('id, content, direction, role, created_at, score, classification, classification_reason, detected_signals')
          .eq('business_id', businessId)
          .eq('lead_id', draft.lead_id)
          .eq('id', draft.source_message_id)
          .maybeSingle(),
        this.supabaseService.client
          .from('leads')
          .select('id, score, classification, classification_reason, status, last_message_at')
          .eq('business_id', businessId)
          .eq('id', draft.lead_id)
          .maybeSingle(),
        this.supabaseService.client
          .from('messages')
          .select('id, content, direction, role, created_at')
          .eq('business_id', businessId)
          .eq('lead_id', draft.lead_id)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(11),
        this.supabaseService.client
          .from('response_draft_decisions')
          .select('decision, operator_id, final_text, decided_at')
          .eq('business_id', businessId)
          .eq('response_draft_id', responseDraftId)
          .maybeSingle(),
      ]);

    const results = [businessResult, messageResult, leadResult, contextResult, reviewResult] as unknown as Array<SupabaseResult<unknown>>;
    if (results.some((result) => result.error)) {
      throw new Error('Failed to read response draft detail');
    }

    const [business, sourceMessage, lead, contextRows, review] = results.map(
      (result) => result.data,
    ) as [
      ResponseDraftReadDetail['business'] | null,
      ResponseDraftReadDetail['sourceMessage'] | null,
      ResponseDraftReadDetail['lead'] | null,
      ResponseDraftReadDetail['context'] | null,
      ResponseDraftReadDetail['review'],
    ];

    if (!business || !sourceMessage || !lead) return null;
    const newestFirst = contextRows ?? [];
    return {
      draft,
      business,
      sourceMessage,
      lead,
      context: newestFirst.slice(0, 10).reverse(),
      contextTruncated: newestFirst.length > 10,
      review,
    };
  }
}

export type SafeDetectedSignals = Json | null;
