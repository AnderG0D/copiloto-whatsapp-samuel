import { Logger } from '@nestjs/common';
import type { SupabaseService } from '../supabase/supabase.service';
import { AuthorizedLeadsService } from './authorized-leads.service';

describe('AuthorizedLeadsService', () => {
  const businessId = 'business-dummy-1';
  const otherBusinessId = 'business-dummy-2';
  const phone = '5215550000000';
  let fromMock: jest.Mock;
  let service: AuthorizedLeadsService;

  const configureLookup = (result: unknown) => {
    const query: any = {};
    query.select = jest.fn().mockReturnValue(query);
    query.eq = jest.fn().mockReturnValue(query);
    query.maybeSingle = jest.fn().mockResolvedValue(result);
    fromMock.mockReturnValue(query);
    return query;
  };

  beforeEach(() => {
    fromMock = jest.fn();
    service = new AuthorizedLeadsService({
      client: { from: fromMock },
    } as unknown as SupabaseService);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('authorizes an active lead only for its matching business and normalized phone', async () => {
    const query = configureLookup({
      data: { business_id: businessId, phone, is_active: true },
      error: null,
    });

    await expect(service.isAuthorized(businessId, phone)).resolves.toBe(true);
    expect(fromMock).toHaveBeenCalledWith('authorized_leads');
    expect(query.eq.mock.calls).toEqual([
      ['business_id', businessId],
      ['phone', phone],
      ['is_active', true],
    ]);
  });

  it('fails closed when the allowlist is empty', async () => {
    configureLookup({ data: null, error: null });

    await expect(service.isAuthorized(businessId, phone)).resolves.toBe(false);
  });

  it.each([
    [
      'is absent',
      { data: null, error: { message: 'relation does not exist' } },
    ],
    [
      'returns invalid data',
      {
        data: { business_id: businessId, phone, is_active: false },
        error: null,
      },
    ],
    [
      'contains the lead for another business',
      {
        data: { business_id: otherBusinessId, phone, is_active: true },
        error: null,
      },
    ],
  ])('fails closed when the allowlist %s', async (_scenario, result) => {
    configureLookup(result);

    await expect(service.isAuthorized(businessId, phone)).resolves.toBe(false);
  });

  it('fails closed when the allowlist lookup throws', async () => {
    fromMock.mockImplementation(() => {
      throw new Error('query failed');
    });

    await expect(service.isAuthorized(businessId, phone)).resolves.toBe(false);
  });
});
