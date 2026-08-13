import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export type AdminReviewPrincipal = {
  operatorId: string;
  businessIds: readonly string[];
};

export type AdminReviewRequest = Request & {
  adminReviewPrincipal?: AdminReviewPrincipal;
};

export const AdminReviewPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AdminReviewPrincipal => {
    const request = context.switchToHttp().getRequest<AdminReviewRequest>();

    return request.adminReviewPrincipal as AdminReviewPrincipal;
  },
);
