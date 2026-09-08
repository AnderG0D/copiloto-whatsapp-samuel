import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { AdminReviewRequest } from './admin-review-principal.decorator';
import {
  ADMIN_WEB_SESSION_COOKIE,
  AdminWebSessionService,
} from './admin-web-session.service';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RequestWithSession = AdminReviewRequest & {
  adminWebCsrfToken?: string;
};

@Injectable()
export class AdminWebSessionGuard implements CanActivate {
  constructor(private readonly sessions: AdminWebSessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const token = readCookie(request, ADMIN_WEB_SESSION_COOKIE);
    const session = token ? this.sessions.read(token) : null;

    if (!session) {
      throw this.invalidSession();
    }

    const businessId = request.params.businessId;

    if (
      typeof businessId === 'string' &&
      UUID_V4_PATTERN.test(businessId) &&
      !session.principal.businessIds.includes(businessId.toLowerCase())
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Admin operator is not authorized for this business.',
      });
    }

    request.adminReviewPrincipal = session.principal;
    request.adminWebCsrfToken = session.csrfToken;
    return true;
  }

  private invalidSession(): UnauthorizedException {
    return new UnauthorizedException({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid admin session.',
    });
  }
}

@Injectable()
export class AdminCsrfGuard implements CanActivate {
  constructor(private readonly sessionGuard: AdminWebSessionGuard) {}

  canActivate(context: ExecutionContext): boolean {
    this.sessionGuard.canActivate(context);
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const token = request.headers['x-csrf-token'];

    if (
      typeof token !== 'string' ||
      !request.adminWebCsrfToken ||
      token.length !== request.adminWebCsrfToken.length ||
      !timingSafeEqual(Buffer.from(token), Buffer.from(request.adminWebCsrfToken))
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Invalid admin CSRF token.',
      });
    }

    return true;
  }
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.cookie;

  if (typeof header !== 'string') {
    return null;
  }

  const prefix = `${name}=`;
  const entry = header.split(';').map((part) => part.trim()).find((part) =>
    part.startsWith(prefix),
  );

  if (!entry) {
    return null;
  }

  try {
    return decodeURIComponent(entry.slice(prefix.length));
  } catch {
    return null;
  }
}
