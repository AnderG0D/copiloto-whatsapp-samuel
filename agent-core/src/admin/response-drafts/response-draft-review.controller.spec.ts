import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  DuplicateResponseDraftDecisionError,
  ResponseDraftDecisionRepository,
} from '../../ai/response-drafts/response-draft-decision.repository';
import {
  InvalidResponseDraftReviewError,
  ResponseDraftNotEligibleError,
  ResponseDraftNotFoundError,
  ResponseDraftReviewService,
} from '../../ai/response-drafts/response-draft-review.service';
import type { Database } from '../../types/database.types';
import { AdminResponseDraftReviewGuard } from './admin-response-draft-review.guard';
import {
  AdminResponseDraftReviewBadRequestFilter,
  ResponseDraftReviewController,
} from './response-draft-review.controller';
import { ReviewResponseDraftBodyPipe } from './review-response-draft-body.pipe';

type ResponseDraftDecisionRow =
  Database['public']['Tables']['response_draft_decisions']['Row'];

describe('ResponseDraftReviewController', () => {
  let app: INestApplication<App>;
  let configuration: Record<string, unknown>;
  let reviewMock: jest.MockedFunction<ResponseDraftReviewService['review']>;

  const adminToken = 'dummy-admin-review-token-with-32-plus-characters';
  const operatorId = 'dummy-operator-samuel';
  const businessId = '123e4567-e89b-42d3-a456-426614174000';
  const otherBusinessId = '223e4567-e89b-42d3-a456-426614174000';
  const responseDraftId = '323e4567-e89b-42d3-a456-426614174000';
  const decisionId = '423e4567-e89b-42d3-a456-426614174000';
  const decidedAt = '2026-08-11T23:00:00.000Z';

  const validConfiguration = () => ({
    ADMIN_REVIEW_TOKEN: adminToken,
    ADMIN_REVIEW_OPERATOR_ID: operatorId,
    ADMIN_REVIEW_BUSINESS_IDS: businessId,
  });

  const decisionRow = (
    decision: string,
    finalText: string | null = null,
    reviewedBusinessId = businessId,
  ): ResponseDraftDecisionRow => ({
    id: decisionId,
    business_id: reviewedBusinessId,
    response_draft_id: responseDraftId,
    operator_id: operatorId,
    decision,
    final_text: finalText,
    decided_at: decidedAt,
  });

  const endpoint = (
    routeBusinessId = businessId,
    routeResponseDraftId = responseDraftId,
  ) =>
    `/admin/businesses/${routeBusinessId}/response-drafts/${routeResponseDraftId}/reviews`;

  const postWithCredential = (
    routeBusinessId = businessId,
    routeResponseDraftId = responseDraftId,
  ) =>
    request(app.getHttpServer())
      .post(endpoint(routeBusinessId, routeResponseDraftId))
      .set('Authorization', `Bearer ${adminToken}`);

  beforeAll(async () => {
    configuration = validConfiguration();
    reviewMock = jest.fn();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ResponseDraftReviewController],
      providers: [
        AdminResponseDraftReviewGuard,
        ReviewResponseDraftBodyPipe,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => configuration[key]),
          },
        },
        {
          provide: ResponseDraftReviewService,
          useValue: { review: reviewMock },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AdminResponseDraftReviewBadRequestFilter());
    await app.init();
  });

  beforeEach(() => {
    configuration = validConfiguration();
    reviewMock.mockReset();
    reviewMock.mockResolvedValue(decisionRow('APPROVE'));
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 unauthorized without Authorization', async () => {
    await request(app.getHttpServer())
      .post(endpoint())
      .send({ decision: 'APPROVE' })
      .expect(401)
      .expect({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid admin credential.',
      });

    expect(reviewMock).not.toHaveBeenCalled();
  });

  it.each([
    ['Basic credential'],
    [`bearer ${adminToken}`],
    ['Bearer'],
    [`Bearer  ${adminToken}`],
  ])(
    'returns the same 401 for invalid authorization scheme %p',
    async (header) => {
      await request(app.getHttpServer())
        .post(endpoint())
        .set('Authorization', header)
        .send({ decision: 'APPROVE' })
        .expect(401)
        .expect({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid admin credential.',
        });

      expect(reviewMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['wrong-token-with-different-length'],
    ['x'.repeat(adminToken.length)],
  ])('returns the same 401 for invalid Bearer token %p', async (token) => {
    await request(app.getHttpServer())
      .post(endpoint())
      .set('Authorization', `Bearer ${token}`)
      .send({ decision: 'APPROVE' })
      .expect(401)
      .expect({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid admin credential.',
      });

    expect(reviewMock).not.toHaveBeenCalled();
  });

  it.each([
    ['missing token', { ADMIN_REVIEW_TOKEN: undefined }],
    ['short token', { ADMIN_REVIEW_TOKEN: 'too-short' }],
    [
      'token containing whitespace',
      { ADMIN_REVIEW_TOKEN: `${'x'.repeat(32)} ` },
    ],
    ['missing operator', { ADMIN_REVIEW_OPERATOR_ID: undefined }],
    ['blank operator', { ADMIN_REVIEW_OPERATOR_ID: '   ' }],
    ['missing business list', { ADMIN_REVIEW_BUSINESS_IDS: undefined }],
    ['empty business list', { ADMIN_REVIEW_BUSINESS_IDS: '' }],
    ['invalid business UUID', { ADMIN_REVIEW_BUSINESS_IDS: 'not-a-uuid' }],
    ['empty business entry', { ADMIN_REVIEW_BUSINESS_IDS: `${businessId}, ` }],
    [
      'duplicate business UUID',
      {
        ADMIN_REVIEW_BUSINESS_IDS: `${businessId},${businessId.toUpperCase()}`,
      },
    ],
  ])('fails closed for %s configuration', async (_label, overrides) => {
    configuration = { ...validConfiguration(), ...overrides };

    const response = await postWithCredential()
      .send({ decision: 'APPROVE' })
      .expect(500)
      .expect({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Unable to review response draft.',
      });

    expect(JSON.stringify(response.body)).not.toContain(adminToken);
    expect(reviewMock).not.toHaveBeenCalled();
  });

  it('derives the authenticated operator and authorized businesses from configuration', async () => {
    configuration = {
      ...validConfiguration(),
      ADMIN_REVIEW_OPERATOR_ID: `  ${operatorId}  `,
      ADMIN_REVIEW_BUSINESS_IDS: ` ${otherBusinessId}, ${businessId} `,
    };
    reviewMock.mockResolvedValue(decisionRow('APPROVE'));

    await postWithCredential().send({ decision: 'APPROVE' }).expect(201);

    expect(reviewMock).toHaveBeenCalledWith({
      businessId,
      responseDraftId,
      operatorId,
      decision: 'APPROVE',
    });
  });

  it('returns 403 when the authenticated operator is not authorized for the business', async () => {
    await postWithCredential(otherBusinessId)
      .send({ decision: 'APPROVE' })
      .expect(403)
      .expect({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Admin operator is not authorized for this business.',
      });

    expect(reviewMock).not.toHaveBeenCalled();
  });

  it('rejects operatorId from the body and never calls the service', async () => {
    await postWithCredential()
      .send({ decision: 'APPROVE', operatorId: 'client-operator' })
      .expect(400)
      .expect({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid response draft review request.',
      });

    expect(reviewMock).not.toHaveBeenCalled();
  });

  it.each([
    'email',
    'role',
    'businessId',
    'responseDraftId',
    'businessIds',
    'unexpected',
  ])('rejects the additional body property %s', async (property) => {
    await postWithCredential()
      .send({ decision: 'APPROVE', [property]: 'client-value' })
      .expect(400)
      .expect({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid response draft review request.',
      });

    expect(reviewMock).not.toHaveBeenCalled();
  });

  it.each([null, [], 'APPROVE', 1])(
    'rejects a non-plain body %p',
    async (body) => {
      await postWithCredential()
        .set('Content-Type', 'application/json')
        .send(body)
        .expect(400)
        .expect({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid response draft review request.',
        });

      expect(reviewMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['invalid-business-id', responseDraftId],
    [businessId, 'invalid-response-draft-id'],
  ])(
    'returns 400 for invalid route UUIDs (%s, %s)',
    async (routeBusinessId, routeResponseDraftId) => {
      await postWithCredential(routeBusinessId, routeResponseDraftId)
        .send({ decision: 'APPROVE' })
        .expect(400)
        .expect({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid response draft review request.',
        });

      expect(reviewMock).not.toHaveBeenCalled();
    },
  );

  it('creates an APPROVE decision and maps the response to camelCase', async () => {
    reviewMock.mockResolvedValue(decisionRow('APPROVE'));

    await postWithCredential()
      .send({ decision: 'APPROVE' })
      .expect(201)
      .expect({
        id: decisionId,
        businessId,
        responseDraftId,
        operatorId,
        decision: 'APPROVE',
        finalText: null,
        decidedAt,
      });

    expect(reviewMock).toHaveBeenCalledWith({
      businessId,
      responseDraftId,
      operatorId,
      decision: 'APPROVE',
    });
  });

  it('creates EDIT_AND_APPROVE and returns the text normalized by the service', async () => {
    reviewMock.mockImplementation((command) =>
      Promise.resolve(
        decisionRow(
          command.decision,
          command.decision === 'EDIT_AND_APPROVE'
            ? command.finalText.trim()
            : null,
        ),
      ),
    );

    await postWithCredential()
      .send({
        decision: 'EDIT_AND_APPROVE',
        finalText: '  Texto final revisado.  ',
      })
      .expect(201)
      .expect({
        id: decisionId,
        businessId,
        responseDraftId,
        operatorId,
        decision: 'EDIT_AND_APPROVE',
        finalText: 'Texto final revisado.',
        decidedAt,
      });

    expect(reviewMock).toHaveBeenCalledWith({
      businessId,
      responseDraftId,
      operatorId,
      decision: 'EDIT_AND_APPROVE',
      finalText: '  Texto final revisado.  ',
    });
  });

  it.each([
    { decision: 'EDIT_AND_APPROVE' },
    { decision: 'EDIT_AND_APPROVE', finalText: '' },
    { decision: 'EDIT_AND_APPROVE', finalText: '   ' },
  ])('rejects invalid EDIT_AND_APPROVE body %p', async (body) => {
    await postWithCredential().send(body).expect(400).expect({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid response draft review request.',
    });

    expect(reviewMock).not.toHaveBeenCalled();
  });

  it.each(['APPROVE', 'REJECT'])(
    'rejects finalText with %s',
    async (decision) => {
      await postWithCredential()
        .send({ decision, finalText: 'not-allowed' })
        .expect(400)
        .expect({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid response draft review request.',
        });

      expect(reviewMock).not.toHaveBeenCalled();
    },
  );

  it('creates a REJECT decision', async () => {
    reviewMock.mockResolvedValue(decisionRow('REJECT'));

    await postWithCredential().send({ decision: 'REJECT' }).expect(201).expect({
      id: decisionId,
      businessId,
      responseDraftId,
      operatorId,
      decision: 'REJECT',
      finalText: null,
      decidedAt,
    });

    expect(reviewMock).toHaveBeenCalledWith({
      businessId,
      responseDraftId,
      operatorId,
      decision: 'REJECT',
    });
  });

  it('makes an absent draft indistinguishable from one owned by another business', async () => {
    configuration = {
      ...validConfiguration(),
      ADMIN_REVIEW_BUSINESS_IDS: `${businessId},${otherBusinessId}`,
    };
    reviewMock.mockRejectedValue(
      new ResponseDraftNotFoundError(responseDraftId),
    );

    const absentResponse = await postWithCredential(businessId)
      .send({ decision: 'APPROVE' })
      .expect(404);
    const otherBusinessResponse = await postWithCredential(otherBusinessId)
      .send({ decision: 'APPROVE' })
      .expect(404);

    expect(absentResponse.body).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Response draft not found.',
    });
    expect(otherBusinessResponse.body).toEqual(absentResponse.body);
    expect(reviewMock).toHaveBeenNthCalledWith(1, {
      businessId,
      responseDraftId,
      operatorId,
      decision: 'APPROVE',
    });
    expect(reviewMock).toHaveBeenNthCalledWith(2, {
      businessId: otherBusinessId,
      responseDraftId,
      operatorId,
      decision: 'APPROVE',
    });
  });

  it('maps a non-PROPOSED draft to 409', async () => {
    reviewMock.mockRejectedValue(
      new ResponseDraftNotEligibleError(responseDraftId, 'APPROVED'),
    );

    await postWithCredential()
      .send({ decision: 'APPROVE' })
      .expect(409)
      .expect({
        statusCode: 409,
        error: 'Conflict',
        message: 'Response draft is not eligible for review.',
      });
  });

  it('maps a duplicate decision to 409', async () => {
    reviewMock.mockRejectedValue(
      new DuplicateResponseDraftDecisionError(responseDraftId),
    );

    await postWithCredential()
      .send({ decision: 'APPROVE' })
      .expect(409)
      .expect({
        statusCode: 409,
        error: 'Conflict',
        message: 'Response draft has already been reviewed.',
      });
  });

  it('maps an invalid domain command to the stable 400 response', async () => {
    reviewMock.mockRejectedValue(
      new InvalidResponseDraftReviewError('sensitive internal reason'),
    );

    await postWithCredential()
      .send({ decision: 'APPROVE' })
      .expect(400)
      .expect({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid response draft review request.',
      });
  });

  it('maps unexpected errors to 500 without leaking their message', async () => {
    reviewMock.mockRejectedValue(
      new Error('dummy persistence details that must stay private'),
    );

    const response = await postWithCredential()
      .send({ decision: 'APPROVE' })
      .expect(500)
      .expect({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Unable to review response draft.',
      });

    expect(JSON.stringify(response.body)).not.toContain('persistence details');
  });

  it('depends on ResponseDraftReviewService and not repositories', () => {
    expect(
      Reflect.getMetadata('design:paramtypes', ResponseDraftReviewController),
    ).toEqual([ResponseDraftReviewService]);
    expect(
      Reflect.getMetadata('design:paramtypes', ResponseDraftReviewController),
    ).not.toContain(ResponseDraftDecisionRepository);
  });
});
