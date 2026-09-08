import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminResponseDraftReviewGuard } from './admin-response-draft-review.guard';
import { AdminWebSessionGuard } from './admin-web-session.guard';
import { AdminWebSessionService } from './admin-web-session.service';
import { ResponseDraftReadController } from './response-draft-read.controller';
import { ResponseDraftReadQueryPipe } from './response-draft-read-query.pipe';
import { ResponseDraftReadNotFoundError, ResponseDraftReadService } from './response-draft-read.service';

describe('ResponseDraftReadController', () => {
  let app: INestApplication<App>;
  let list: jest.Mock;
  let detail: jest.Mock;
  let sessions: AdminWebSessionService;
  let cookie: string;
  const businessId = '123e4567-e89b-42d3-a456-426614174000';
  const draftId = '323e4567-e89b-42d3-a456-426614174000';
  const passwordHash =
    'scrypt$ZHVtbXktYWRtaW4td2ViLXNhbHQ$kHoMptv_cnuzbkUPYVY8j2eycE0kei7bBK2RYw4YPhJd9PqrYn8wKQc1qZehHl4YuDP0HZRctqmTHJVHWqcWDQ';
  const headers = () => ({ Cookie: cookie });
  const base = `/admin/businesses/${businessId}/response-drafts`;

  beforeAll(async () => {
    list = jest.fn(); detail = jest.fn();
    const module = await Test.createTestingModule({
      controllers: [ResponseDraftReadController],
      providers: [
        AdminResponseDraftReviewGuard, ResponseDraftReadQueryPipe,
        AdminWebSessionGuard, AdminWebSessionService,
        { provide: ConfigService, useValue: { get: jest.fn((key: string) => ({ ADMIN_WEB_PASSWORD_HASH: passwordHash, ADMIN_WEB_SESSION_SECRET: 'dummy-admin-web-session-secret-with-32-plus-characters', ADMIN_REVIEW_OPERATOR_ID: 'dummy-operator', ADMIN_REVIEW_BUSINESS_IDS: businessId })[key]) } },
        { provide: ResponseDraftReadService, useValue: { list, detail } },
      ],
    }).compile();
    sessions = module.get(AdminWebSessionService);
    app = module.createNestApplication(); await app.init();
  });
  beforeEach(async () => { const session = await sessions.create('dummy-web-password'); cookie = `admin_web_session=${session.token}`; list.mockReset().mockResolvedValue({ items: [], page: { limit: 25, nextCursor: null } }); detail.mockReset(); });
  afterAll(async () => { await app.close(); });

  it('lists PROPOSED drafts with default limit 25', async () => {
    await request(app.getHttpServer()).get(base).set(headers()).expect(200);
    expect(list).toHaveBeenCalledWith({ businessId, limit: 25 });
  });
  it('accepts the maximum limit of 100', async () => {
    await request(app.getHttpServer()).get(`${base}?limit=100`).set(headers()).expect(200);
    expect(list).toHaveBeenCalledWith({ businessId, limit: 100 });
  });
  it.each(['0', '101', '1.5', 'nope'])('rejects invalid limits', async (limit) => {
    await request(app.getHttpServer()).get(`${base}?limit=${limit}`).set(headers()).expect(400);
    expect(list).not.toHaveBeenCalled();
  });
  it('rejects an invalid cursor', async () => {
    await request(app.getHttpServer()).get(`${base}?cursor=not-a-cursor`).set(headers()).expect(400);
    expect(list).not.toHaveBeenCalled();
  });
  it('rejects an invalid business UUID before reading', async () => {
    await request(app.getHttpServer()).get('/admin/businesses/not-a-uuid/response-drafts').set(headers()).expect(400);
    expect(list).not.toHaveBeenCalled();
  });
  it('requires both valid UUIDs for detail', async () => {
    await request(app.getHttpServer()).get(`${base}/not-a-uuid`).set(headers()).expect(400);
    expect(detail).not.toHaveBeenCalled();
  });
  it('returns 404 without distinguishing an absent or invisible draft', async () => {
    detail.mockRejectedValue(new ResponseDraftReadNotFoundError());
    await request(app.getHttpServer()).get(`${base}/${draftId}`).set(headers()).expect(404).expect({ statusCode: 404, error: 'Not Found', message: 'Response draft not found.' });
  });
  it('does not alter the POST review route metadata', () => {
    expect(Reflect.getMetadata('path', ResponseDraftReadController)).toBe('admin/businesses/:businessId/response-drafts');
  });
});
