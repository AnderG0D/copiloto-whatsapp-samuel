import {
  Body,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AdminCsrfGuard,
  AdminWebSessionGuard,
} from './admin-web-session.guard';
import { AdminReviewPrincipal } from './admin-review-principal.decorator';
import {
  ADMIN_WEB_SESSION_COOKIE,
  AdminWebSessionService,
  InvalidAdminWebPasswordError,
} from './admin-web-session.service';

@Controller('admin/auth')
export class AdminWebSessionController {
  constructor(private readonly sessions: AdminWebSessionService) {}

  @Post('login')
  async create(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!isLoginBody(body)) {
      throw this.invalidCredential();
    }

    try {
      const session = await this.sessions.create(body.password);

      response.cookie(ADMIN_WEB_SESSION_COOKIE, session.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/admin',
        maxAge: session.maxAge,
      });

      return { authenticated: true };
    } catch (error) {
      if (error instanceof InvalidAdminWebPasswordError) {
        throw this.invalidCredential();
      }

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Unable to authenticate admin session.',
      });
    }
  }

  @Get('me')
  @UseGuards(AdminWebSessionGuard)
  me(
    @AdminReviewPrincipal()
    principal: { businessIds: readonly string[] },
    @Req() request: Request & { adminWebCsrfToken?: string },
  ) {
    return {
      businessIds: principal.businessIds,
      csrfToken: request.adminWebCsrfToken,
    };
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AdminCsrfGuard)
  destroy(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(ADMIN_WEB_SESSION_COOKIE, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/admin',
    });
  }

  private invalidCredential(): UnauthorizedException {
    return new UnauthorizedException({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid admin web credential.',
    });
  }
}

function isLoginBody(value: unknown): value is { password: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const entries = Object.entries(candidate);

  return (
    entries.length === 1 &&
    typeof candidate.password === 'string' &&
    candidate.password.length > 0 &&
    candidate.password.length <= 1024
  );
}
