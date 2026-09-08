import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import type { AdminReviewPrincipal } from './admin-review-principal.decorator';

const scrypt = promisify(scryptCallback);
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MINIMUM_SECRET_LENGTH = 32;
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
export const ADMIN_WEB_SESSION_COOKIE = 'admin_web_session';

type AdminWebConfiguration = {
  passwordHash: string;
  sessionSecret: string;
  principal: AdminReviewPrincipal;
};

export type AdminWebSession = {
  principal: AdminReviewPrincipal;
  csrfToken: string;
};

type SerializedSession = {
  v: 1;
  operatorId: string;
  businessIds: string[];
  csrfToken: string;
  expiresAt: number;
};

@Injectable()
export class AdminWebSessionService {
  constructor(private readonly configService: ConfigService) {}

  async create(password: string): Promise<{
    token: string;
    csrfToken: string;
    maxAge: number;
  }> {
    const configuration = this.loadConfigurationOrFailClosed();

    if (!(await this.passwordMatches(configuration.passwordHash, password))) {
      return Promise.reject(new InvalidAdminWebPasswordError());
    }

    const csrfToken = randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const serialized: SerializedSession = {
      v: 1,
      operatorId: configuration.principal.operatorId,
      businessIds: [...configuration.principal.businessIds],
      csrfToken,
      expiresAt,
    };

    return {
      token: this.sign(serialized, configuration.sessionSecret),
      csrfToken,
      maxAge: SESSION_DURATION_MS,
    };
  }

  read(token: string): AdminWebSession | null {
    const configuration = this.loadConfigurationOrFailClosed();
    const payload = this.verify(token, configuration.sessionSecret);

    if (!payload || payload.expiresAt <= Date.now()) {
      return null;
    }

    if (
      payload.operatorId !== configuration.principal.operatorId ||
      payload.businessIds.length !== configuration.principal.businessIds.length ||
      payload.businessIds.some(
        (businessId, index) =>
          businessId !== configuration.principal.businessIds[index],
      )
    ) {
      return null;
    }

    return {
      principal: configuration.principal,
      csrfToken: payload.csrfToken,
    };
  }

  private loadConfigurationOrFailClosed(): AdminWebConfiguration {
    try {
      const passwordHash = this.configService.get<unknown>(
        'ADMIN_WEB_PASSWORD_HASH',
      );
      const sessionSecret = this.configService.get<unknown>(
        'ADMIN_WEB_SESSION_SECRET',
      );
      const operatorId = this.configService.get<unknown>(
        'ADMIN_REVIEW_OPERATOR_ID',
      );
      const configuredBusinessIds = this.configService.get<unknown>(
        'ADMIN_REVIEW_BUSINESS_IDS',
      );

      if (
        typeof passwordHash !== 'string' ||
        !this.isScryptHash(passwordHash) ||
        typeof sessionSecret !== 'string' ||
        sessionSecret.length < MINIMUM_SECRET_LENGTH ||
        /\s/.test(sessionSecret) ||
        typeof operatorId !== 'string' ||
        !operatorId.trim() ||
        typeof configuredBusinessIds !== 'string'
      ) {
        throw new Error('Invalid admin web configuration');
      }

      const businessIds = configuredBusinessIds.split(',').map((entry) => entry.trim());

      if (
        businessIds.length === 0 ||
        businessIds.some(
          (businessId) => !businessId || !UUID_V4_PATTERN.test(businessId),
        )
      ) {
        throw new Error('Invalid admin web configuration');
      }

      const normalizedBusinessIds = businessIds.map((businessId) =>
        businessId.toLowerCase(),
      );

      if (
        new Set(normalizedBusinessIds).size !== normalizedBusinessIds.length
      ) {
        throw new Error('Invalid admin web configuration');
      }

      return {
        passwordHash,
        sessionSecret,
        principal: {
          operatorId: operatorId.trim(),
          businessIds: Object.freeze(normalizedBusinessIds),
        },
      };
    } catch {
      throw new InternalServerErrorException({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Unable to authenticate admin session.',
      });
    }
  }

  private isScryptHash(value: string): boolean {
    const parts = value.split('$');

    return (
      parts.length === 3 &&
      parts[0] === 'scrypt' &&
      /^[A-Za-z0-9_-]{16,}$/.test(parts[1]) &&
      /^[A-Za-z0-9_-]{64,}$/.test(parts[2])
    );
  }

  private async passwordMatches(hash: string, password: string): Promise<boolean> {
    const [, encodedSalt, encodedKey] = hash.split('$');
    const expectedKey = Buffer.from(encodedKey, 'base64url');
    const actualKey = (await scrypt(password, Buffer.from(encodedSalt, 'base64url'), expectedKey.length)) as Buffer;

    return (
      actualKey.length === expectedKey.length &&
      timingSafeEqual(actualKey, expectedKey)
    );
  }

  private sign(payload: SerializedSession, secret: string): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');

    return `${encodedPayload}.${signature}`;
  }

  private verify(token: string, secret: string): SerializedSession | null {
    const parts = token.split('.');

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return null;
    }

    const expectedSignature = createHmac('sha256', secret)
      .update(parts[0])
      .digest('base64url');

    if (
      parts[1].length !== expectedSignature.length ||
      !timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(parts[0], 'base64url').toString('utf8'),
      ) as Partial<SerializedSession>;

      if (
        payload.v !== 1 ||
        typeof payload.operatorId !== 'string' ||
        !Array.isArray(payload.businessIds) ||
        payload.businessIds.some((businessId) => typeof businessId !== 'string') ||
        typeof payload.csrfToken !== 'string' ||
        !/^[A-Za-z0-9_-]{32,}$/.test(payload.csrfToken) ||
        typeof payload.expiresAt !== 'number' ||
        !Number.isSafeInteger(payload.expiresAt)
      ) {
        return null;
      }

      return payload as SerializedSession;
    } catch {
      return null;
    }
  }
}

export class InvalidAdminWebPasswordError extends Error {}
