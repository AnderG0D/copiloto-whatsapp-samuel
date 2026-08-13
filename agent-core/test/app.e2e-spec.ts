import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import type { AiProvider } from './../src/ai/ai-provider.interface';
import { AI_PROVIDER } from './../src/ai/ai.constants';
import { ResponseDraftReviewService } from './../src/ai/response-drafts/response-draft-review.service';
import { AppModule } from './../src/app.module';
import { SupabaseService } from './../src/supabase/supabase.service';

describe('EvolutionWebhookController (e2e)', () => {
  let app: INestApplication<App>;
  const adminToken = 'dummy-e2e-admin-review-token-32-characters-minimum';
  const operatorId = 'dummy-e2e-operator';
  const businessId = '123e4567-e89b-42d3-a456-426614174000';
  const responseDraftId = '323e4567-e89b-42d3-a456-426614174000';
  const generateTextMock: jest.MockedFunction<AiProvider['generateText']> =
    jest.fn();
  const reviewMock: jest.MockedFunction<ResponseDraftReviewService['review']> =
    jest.fn().mockResolvedValue({
      id: '423e4567-e89b-42d3-a456-426614174000',
      business_id: businessId,
      response_draft_id: responseDraftId,
      operator_id: operatorId,
      decision: 'APPROVE',
      final_text: null,
      decided_at: '2026-08-11T23:00:00.000Z',
    });
  const fakeAiProvider: AiProvider = {
    generateText: generateTextMock,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AI_PROVIDER)
      .useValue(fakeAiProvider)
      .overrideProvider(SupabaseService)
      .useValue({ client: {} })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) =>
          ({
            ADMIN_REVIEW_TOKEN: adminToken,
            ADMIN_REVIEW_OPERATOR_ID: operatorId,
            ADMIN_REVIEW_BUSINESS_IDS: businessId,
          })[key],
      })
      .overrideProvider(ResponseDraftReviewService)
      .useValue({ review: reviewMock })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    generateTextMock.mockClear();
    reviewMock.mockClear();
  });

  it('POST /webhooks/evolution ignores unrelated events', async () => {
    await request(app.getHttpServer())
      .post('/webhooks/evolution')
      .send({
        event: 'connection.update',
      })
      .expect(200)
      .expect({
        ok: true,
        ignored: true,
      });

    expect(generateTextMock).not.toHaveBeenCalled();
  });

  describe('authenticated admin response draft review API', () => {
    const endpoint = `/admin/businesses/${businessId}/response-drafts/${responseDraftId}/reviews`;

    it('returns 401 unauthorized without an admin credential', async () => {
      await request(app.getHttpServer())
        .post(endpoint)
        .send({ decision: 'APPROVE' })
        .expect(401)
        .expect({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid admin credential.',
        });

      expect(reviewMock).not.toHaveBeenCalled();
      expect(generateTextMock).not.toHaveBeenCalled();
    });

    it('creates an approve review with the operator derived from configuration', async () => {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'APPROVE' })
        .expect(201)
        .expect({
          id: '423e4567-e89b-42d3-a456-426614174000',
          businessId,
          responseDraftId,
          operatorId,
          decision: 'APPROVE',
          finalText: null,
          decidedAt: '2026-08-11T23:00:00.000Z',
        });

      expect(reviewMock).toHaveBeenCalledWith({
        businessId,
        responseDraftId,
        operatorId,
        decision: 'APPROVE',
      });
      expect(generateTextMock).not.toHaveBeenCalled();
    });

    it('rejects a client-supplied operatorId before calling the service', async () => {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'APPROVE', operatorId: 'client-operator' })
        .expect(400)
        .expect({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid response draft review request.',
        });

      expect(reviewMock).not.toHaveBeenCalled();
      expect(generateTextMock).not.toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
