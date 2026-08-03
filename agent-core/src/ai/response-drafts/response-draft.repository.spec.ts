import { Test, type TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../../supabase/supabase.service';
import type { Database } from '../../types/database.types';
import {
  ResponseDraftRepository,
  type CreateResponseDraftInput,
} from './response-draft.repository';

type ResponseDraftRow = Database['public']['Tables']['response_drafts']['Row'];

describe('ResponseDraftRepository', () => {
  let repository: ResponseDraftRepository;
  let fromMock: jest.Mock;
  let insertMock: jest.Mock;
  let selectMock: jest.Mock;
  let singleMock: jest.Mock;

  const input: CreateResponseDraftInput = {
    businessId: 'business-1',
    leadId: 'lead-1',
    sourceMessageId: 'message-1',
    draft: {
      text: 'Claro, verifico la disponibilidad para ti.',
      status: 'PROPOSED',
    },
  };

  const row: ResponseDraftRow = {
    id: 'draft-1',
    business_id: input.businessId,
    lead_id: input.leadId,
    source_message_id: input.sourceMessageId,
    text: input.draft.text,
    status: input.draft.status,
    created_at: '2026-08-02T12:00:00.000Z',
    updated_at: '2026-08-02T12:00:00.000Z',
  };

  beforeEach(async () => {
    singleMock = jest.fn();
    selectMock = jest.fn().mockReturnValue({ single: singleMock });
    insertMock = jest.fn().mockReturnValue({ select: selectMock });
    fromMock = jest.fn().mockReturnValue({ insert: insertMock });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseDraftRepository,
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

    repository = module.get(ResponseDraftRepository);
  });

  it('maps camelCase input to snake_case columns and returns the created row', async () => {
    singleMock.mockResolvedValue({ data: row, error: null });

    await expect(repository.create(input)).resolves.toEqual(row);
    expect(fromMock).toHaveBeenCalledWith('response_drafts');
    expect(insertMock).toHaveBeenCalledWith({
      business_id: input.businessId,
      lead_id: input.leadId,
      source_message_id: input.sourceMessageId,
      text: input.draft.text,
      status: input.draft.status,
    });
    expect(selectMock).toHaveBeenCalledWith(
      'id, business_id, lead_id, source_message_id, text, status, created_at, updated_at',
    );
    expect(singleMock).toHaveBeenCalledTimes(1);
  });

  it('throws a descriptive error when Supabase returns an error', async () => {
    singleMock.mockResolvedValue({
      data: null,
      error: { message: 'duplicate key value violates unique constraint' },
    });

    await expect(repository.create(input)).rejects.toThrow(
      'Failed to create response draft: duplicate key value violates unique constraint',
    );
  });

  it('throws a descriptive error when Supabase returns no data', async () => {
    singleMock.mockResolvedValue({ data: null, error: null });

    await expect(repository.create(input)).rejects.toThrow(
      'Failed to create response draft: Supabase returned no data',
    );
  });
});
