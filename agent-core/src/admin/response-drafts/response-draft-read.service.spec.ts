import { ResponseDraftReadRepository } from './response-draft-read.repository';
import { ResponseDraftReadService } from './response-draft-read.service';

describe('ResponseDraftReadService', () => {
  const businessId = '123e4567-e89b-42d3-a456-426614174000';
  const draftId = '323e4567-e89b-42d3-a456-426614174000';
  let repository: jest.Mocked<Pick<ResponseDraftReadRepository, 'listProposedForBusiness' | 'findDetailForBusiness'>>;
  let service: ResponseDraftReadService;

  beforeEach(() => { repository = { listProposedForBusiness: jest.fn(), findDetailForBusiness: jest.fn() }; service = new ResponseDraftReadService(repository as unknown as ResponseDraftReadRepository); });

  it('returns only the safe list projection and creates an opaque next cursor', async () => {
    repository.listProposedForBusiness.mockResolvedValue({ hasMore: true, rows: [{
      id: draftId, business_id: businessId, lead_id: 'lead', source_message_id: 'message', text: 'x'.repeat(300), status: 'PROPOSED', created_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-09-01T00:00:00.000Z',
      source_message: { id: 'message', content: 'hola', created_at: '2026-09-01T00:00:00.000Z' }, lead: { score: 8, classification: 'HOT' },
    }] } as never);
    const result = await service.list({ businessId, limit: 25 });
    expect(repository.listProposedForBusiness).toHaveBeenCalledWith(businessId, 25, undefined);
    expect(result.items[0]).toEqual(expect.objectContaining({ id: draftId, draftTextPreview: `${'x'.repeat(279)}…`, sourceMessage: { id: 'message', contentPreview: 'hola', createdAt: '2026-09-01T00:00:00.000Z' } }));
    expect(JSON.stringify(result)).not.toMatch(/raw_payload|phone|jid|external_message_id|token|credential/i);
    expect(result.page.nextCursor).toEqual(expect.any(String));
  });

  it('maps complete detail while retaining no more than ten safe context messages', async () => {
    const context = Array.from({ length: 10 }, (_, index) => ({ id: `m${index}`, content: 'safe', direction: 'IN', role: 'USER', created_at: `2026-09-${String(index + 1).padStart(2, '0')}T00:00:00.000Z` }));
    repository.findDetailForBusiness.mockResolvedValue({
      draft: { id: draftId, business_id: businessId, lead_id: 'lead', source_message_id: 'source', text: 'draft', status: 'PROPOSED', created_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-09-01T00:00:00.000Z' },
      business: { id: businessId, name: 'Samuel', business_type: 'vehicles' },
      sourceMessage: { id: 'source', content: 'source', direction: 'IN', role: 'USER', created_at: '2026-09-01T00:00:00.000Z', score: 1, classification: 'HOT', classification_reason: null, detected_signals: { intent: 'buy' } },
      lead: { id: 'lead', score: 1, classification: 'HOT', classification_reason: null, status: 'NEW', last_message_at: null }, context, contextTruncated: true,
      review: { decision: 'APPROVE', operator_id: 'operator', final_text: null, decided_at: '2026-09-02T00:00:00.000Z' },
    } as never);
    const result = await service.detail(businessId, draftId);
    expect(repository.findDetailForBusiness).toHaveBeenCalledWith(businessId, draftId);
    expect(result.safeContext.messages).toHaveLength(10);
    expect(result.safeContext.truncated).toBe(true);
    expect(result.review.decision).toBe('APPROVE');
    expect(JSON.stringify(result)).not.toMatch(/raw_payload|phone|jid|external_message_id|token|credential/i);
  });
});
