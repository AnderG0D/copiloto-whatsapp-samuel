import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ResponseDraftModule } from '../../ai/response-drafts/response-draft.module';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AdminResponseDraftReviewGuard } from './admin-response-draft-review.guard';
import {
  AdminResponseDraftReviewBadRequestFilter,
  ResponseDraftReviewController,
} from './response-draft-review.controller';
import { ReviewResponseDraftBodyPipe } from './review-response-draft-body.pipe';
import { ResponseDraftReadController } from './response-draft-read.controller';
import { ResponseDraftReadQueryPipe } from './response-draft-read-query.pipe';
import { ResponseDraftReadRepository } from './response-draft-read.repository';
import { ResponseDraftReadService } from './response-draft-read.service';
import { AdminWebSessionController } from './admin-web-session.controller';
import { AdminCsrfGuard, AdminWebSessionGuard } from './admin-web-session.guard';
import { AdminWebSessionService } from './admin-web-session.service';
import { AdminPanelController } from './admin-panel.controller';

@Module({
  imports: [ResponseDraftModule, SupabaseModule],
  controllers: [
    ResponseDraftReviewController,
    ResponseDraftReadController,
    AdminWebSessionController,
    AdminPanelController,
  ],
  providers: [
    AdminResponseDraftReviewGuard,
    AdminWebSessionGuard,
    AdminCsrfGuard,
    AdminWebSessionService,
    ReviewResponseDraftBodyPipe,
    ResponseDraftReadQueryPipe,
    ResponseDraftReadRepository,
    ResponseDraftReadService,
    {
      provide: APP_FILTER,
      useClass: AdminResponseDraftReviewBadRequestFilter,
    },
  ],
})
export class ResponseDraftReviewModule {}
