import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  Controller,
  ExceptionFilter,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DuplicateResponseDraftDecisionError } from '../../ai/response-drafts/response-draft-decision.repository';
import {
  InvalidResponseDraftReviewError,
  ResponseDraftNotEligibleError,
  ResponseDraftNotFoundError,
  ResponseDraftReviewService,
} from '../../ai/response-drafts/response-draft-review.service';
import {
  AdminReviewPrincipal,
  type AdminReviewPrincipal as AdminReviewPrincipalType,
} from './admin-review-principal.decorator';
import { AdminResponseDraftReviewGuard } from './admin-response-draft-review.guard';
import {
  ReviewResponseDraftBodyPipe,
  type ReviewResponseDraftBody,
} from './review-response-draft-body.pipe';

const invalidUuidPipe = () =>
  new ParseUUIDPipe({
    version: '4',
    exceptionFactory: () =>
      new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid response draft review request.',
      }),
  });

@Catch(BadRequestException)
export class AdminResponseDraftReviewBadRequestFilter implements ExceptionFilter<BadRequestException> {
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    if (
      /^\/admin\/businesses\/[^/]+\/response-drafts\/[^/]+\/reviews\/?$/.test(
        request.path,
      )
    ) {
      response.status(400).json({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid response draft review request.',
      });
      return;
    }

    response.status(exception.getStatus()).json(exception.getResponse());
  }
}

@Controller('admin/businesses/:businessId/response-drafts')
@UseGuards(AdminResponseDraftReviewGuard)
export class ResponseDraftReviewController {
  constructor(
    private readonly responseDraftReviewService: ResponseDraftReviewService,
  ) {}

  @Post(':responseDraftId/reviews')
  async reviewResponseDraft(
    @Param('businessId', invalidUuidPipe()) businessId: string,
    @Param('responseDraftId', invalidUuidPipe()) responseDraftId: string,
    @AdminReviewPrincipal() principal: AdminReviewPrincipalType,
    @Body(ReviewResponseDraftBodyPipe) body: ReviewResponseDraftBody,
  ) {
    try {
      const decision = await this.responseDraftReviewService.review(
        body.decision === 'EDIT_AND_APPROVE'
          ? {
              businessId,
              responseDraftId,
              operatorId: principal.operatorId,
              decision: body.decision,
              finalText: body.finalText,
            }
          : {
              businessId,
              responseDraftId,
              operatorId: principal.operatorId,
              decision: body.decision,
            },
      );

      return {
        id: decision.id,
        businessId: decision.business_id,
        responseDraftId: decision.response_draft_id,
        operatorId: decision.operator_id,
        decision: decision.decision,
        finalText: decision.final_text,
        decidedAt: decision.decided_at,
      };
    } catch (error) {
      if (error instanceof InvalidResponseDraftReviewError) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid response draft review request.',
        });
      }

      if (error instanceof ResponseDraftNotFoundError) {
        throw new NotFoundException({
          statusCode: 404,
          error: 'Not Found',
          message: 'Response draft not found.',
        });
      }

      if (error instanceof ResponseDraftNotEligibleError) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: 'Response draft is not eligible for review.',
        });
      }

      if (error instanceof DuplicateResponseDraftDecisionError) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: 'Response draft has already been reviewed.',
        });
      }

      throw new InternalServerErrorException({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Unable to review response draft.',
      });
    }
  }
}
