import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ResponseDraftModule } from '../../ai/response-drafts/response-draft.module';
import { AdminResponseDraftReviewGuard } from './admin-response-draft-review.guard';
import {
  AdminResponseDraftReviewBadRequestFilter,
  ResponseDraftReviewController,
} from './response-draft-review.controller';
import { ReviewResponseDraftBodyPipe } from './review-response-draft-body.pipe';

@Module({
  imports: [ResponseDraftModule],
  controllers: [ResponseDraftReviewController],
  providers: [
    AdminResponseDraftReviewGuard,
    ReviewResponseDraftBodyPipe,
    {
      provide: APP_FILTER,
      useClass: AdminResponseDraftReviewBadRequestFilter,
    },
  ],
})
export class ResponseDraftReviewModule {}
