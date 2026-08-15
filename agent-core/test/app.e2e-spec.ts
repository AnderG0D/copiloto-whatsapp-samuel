import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import type { AiProvider } from './../src/ai/ai-provider.interface';
import { AI_PROVIDER } from './../src/ai/ai.constants';
import { DuplicateResponseDraftDecisionError } from './../src/ai/response-drafts/response-draft-decision.repository';
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
  let persistedDecision: {
    id: string;
    business_id: string;
    response_draft_id: string;
    operator_id: string;
    decision: 'APPROVE' | 'EDIT_AND_APPROVE' | 'REJECT';
    final_text: string | null;
    decided_at: string;
  } | null = null;
  const reviewMock: jest.MockedFunction<ResponseDraftReviewService['review']> =
    jest.fn(async (command) => {
      if (persistedDecision) {
        throw new DuplicateResponseDraftDecisionError(command.responseDraftId);
      }

      persistedDecision = {
        id: '423e4567-e89b-42d3-a456-426614174000',
        business_id: command.businessId,
        response_draft_id: command.responseDraftId,
        operator_id: command.operatorId,
        decision: command.decision,
        final_text:
          command.decision === 'EDIT_AND_APPROVE'
            ? command.finalText
            : null,
        decided_at: '2026-08-11T23:00:00.000Z',
      };

      return persistedDecision;
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
            AUTO_SEND_MESSAGES: false,
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
    persistedDecision = null;
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

    it.each([
      {
        firstRequest: { decision: 'APPROVE' },
        firstCommand: {
          businessId,
          responseDraftId,
          operatorId,
          decision: 'APPROVE' as const,
        },
        firstResponse: {
          id: '423e4567-e89b-42d3-a456-426614174000',
          businessId,
          responseDraftId,
          operatorId,
          decision: 'APPROVE',
          finalText: null,
          decidedAt: '2026-08-11T23:00:00.000Z',
        },
        secondRequest: { decision: 'REJECT' },
      },
      {
        firstRequest: {
          decision: 'EDIT_AND_APPROVE',
          finalText: 'Texto final del operador.',
        },
        firstCommand: {
          businessId,
          responseDraftId,
          operatorId,
          decision: 'EDIT_AND_APPROVE' as const,
          finalText: 'Texto final del operador.',
        },
        firstResponse: {
          id: '423e4567-e89b-42d3-a456-426614174000',
          businessId,
          responseDraftId,
          operatorId,
          decision: 'EDIT_AND_APPROVE',
          finalText: 'Texto final del operador.',
          decidedAt: '2026-08-11T23:00:00.000Z',
        },
        secondRequest: { decision: 'REJECT' },
      },
      {
        firstRequest: { decision: 'REJECT' },
        firstCommand: {
          businessId,
          responseDraftId,
          operatorId,
          decision: 'REJECT' as const,
        },
        firstResponse: {
          id: '423e4567-e89b-42d3-a456-426614174000',
          businessId,
          responseDraftId,
          operatorId,
          decision: 'REJECT',
          finalText: null,
          decidedAt: '2026-08-11T23:00:00.000Z',
        },
        secondRequest: { decision: 'APPROVE' },
      },
    ])(
      'creates $firstRequest.decision once and rejects a later decision without changing it',
      async ({ firstRequest, firstCommand, firstResponse, secondRequest }) => {
        await request(app.getHttpServer())
          .post(endpoint)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(firstRequest)
          .expect(201)
          .expect(firstResponse);

        const initialDecision = { ...persistedDecision };

        await request(app.getHttpServer())
          .post(endpoint)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(secondRequest)
          .expect(409)
          .expect({
            statusCode: 409,
            error: 'Conflict',
            message: 'Response draft has already been reviewed.',
          });

        expect(reviewMock).toHaveBeenNthCalledWith(1, firstCommand);
        expect(reviewMock).toHaveBeenCalledTimes(2);
        expect(persistedDecision).toEqual(initialDecision);
        expect(generateTextMock).not.toHaveBeenCalled();
      },
    );

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
