import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { Database } from '../../types/database.types';
import type { ResponseDraft } from './response-draft.types';

export type CreateResponseDraftInput = {
  businessId: string;
  leadId: string;
  sourceMessageId: string;
  draft: ResponseDraft;
};

type ResponseDraftRow = Database['public']['Tables']['response_drafts']['Row'];

@Injectable()
export class ResponseDraftRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(input: CreateResponseDraftInput): Promise<ResponseDraftRow> {
    const { data, error } = await this.supabaseService.client
      .from('response_drafts')
      .insert({
        business_id: input.businessId,
        lead_id: input.leadId,
        source_message_id: input.sourceMessageId,
        text: input.draft.text,
        status: input.draft.status,
      })
      .select(
        'id, business_id, lead_id, source_message_id, text, status, created_at, updated_at',
      )
      .single();

    if (error) {
      throw new Error(`Failed to create response draft: ${error.message}`);
    }

    if (!data) {
      throw new Error(
        'Failed to create response draft: Supabase returned no data',
      );
    }

    return data;
  }

  async findByIdForBusiness(
    businessId: string,
    responseDraftId: string,
  ): Promise<ResponseDraftRow | null> {
    const { data, error } = await this.supabaseService.client
      .from('response_drafts')
      .select(
        'id, business_id, lead_id, source_message_id, text, status, created_at, updated_at',
      )
      .eq('business_id', businessId)
      .eq('id', responseDraftId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find response draft: ${error.message}`);
    }

    return data;
  }
}
