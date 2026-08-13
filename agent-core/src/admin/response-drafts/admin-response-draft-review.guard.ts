import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import type {
  AdminReviewPrincipal,
  AdminReviewRequest,
} from './admin-review-principal.decorator';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MINIMUM_TOKEN_LENGTH = 32;

type AdminReviewConfiguration = {
  token: string;
  principal: AdminReviewPrincipal;
};

@Injectable()
export class AdminResponseDraftReviewGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configuration = this.loadConfigurationOrFailClosed();
    const request = context.switchToHttp().getRequest<AdminReviewRequest>();
    const suppliedToken = this.extractBearerToken(request);

    if (!this.tokensMatch(configuration.token, suppliedToken)) {
      throw this.invalidCredential();
    }

    const businessId = request.params.businessId;

    if (typeof businessId !== 'string' || !UUID_V4_PATTERN.test(businessId)) {
      throw this.invalidRequest();
    }

    request.adminReviewPrincipal = configuration.principal;

    if (
      !configuration.principal.businessIds.includes(businessId.toLowerCase())
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Admin operator is not authorized for this business.',
      });
    }

    return true;
  }

  private loadConfigurationOrFailClosed(): AdminReviewConfiguration {
    try {
      const token = this.configService.get<unknown>('ADMIN_REVIEW_TOKEN');
      const operatorId = this.configService.get<unknown>(
        'ADMIN_REVIEW_OPERATOR_ID',
      );
      const configuredBusinessIds = this.configService.get<unknown>(
        'ADMIN_REVIEW_BUSINESS_IDS',
      );

      if (
        typeof token !== 'string' ||
        token.length < MINIMUM_TOKEN_LENGTH ||
        /\s/.test(token) ||
        typeof operatorId !== 'string' ||
        !operatorId.trim() ||
        typeof configuredBusinessIds !== 'string'
      ) {
        throw new Error('Invalid admin review configuration');
      }

      const businessIdEntries = configuredBusinessIds.split(',');

      if (businessIdEntries.length === 0) {
        throw new Error('Invalid admin review configuration');
      }

      const businessIds = businessIdEntries.map((entry) => entry.trim());

      if (
        businessIds.some(
          (businessId) => !businessId || !UUID_V4_PATTERN.test(businessId),
        )
      ) {
        throw new Error('Invalid admin review configuration');
      }

      const normalizedBusinessIds = businessIds.map((businessId) =>
        businessId.toLowerCase(),
      );

      if (
        new Set(normalizedBusinessIds).size !== normalizedBusinessIds.length
      ) {
        throw new Error('Invalid admin review configuration');
      }

      return {
        token,
        principal: {
          operatorId: operatorId.trim(),
          businessIds: Object.freeze(normalizedBusinessIds),
        },
      };
    } catch {
      throw new InternalServerErrorException({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Unable to review response draft.',
      });
    }
  }

  private extractBearerToken(request: AdminReviewRequest): string {
    const authorization = request.headers.authorization;

    if (typeof authorization !== 'string') {
      throw this.invalidCredential();
    }

    const match = /^Bearer ([^\s]+)$/.exec(authorization);

    if (!match) {
      throw this.invalidCredential();
    }

    return match[1];
  }

  private tokensMatch(expectedToken: string, suppliedToken: string): boolean {
    const expectedDigest = createHash('sha256').update(expectedToken).digest();
    const suppliedDigest = createHash('sha256').update(suppliedToken).digest();

    return timingSafeEqual(expectedDigest, suppliedDigest);
  }

  private invalidCredential(): UnauthorizedException {
    return new UnauthorizedException({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid admin credential.',
    });
  }

  private invalidRequest(): BadRequestException {
    return new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid response draft review request.',
    });
  }
}
