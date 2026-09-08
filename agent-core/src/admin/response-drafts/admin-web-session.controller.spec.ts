import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminWebSessionController } from './admin-web-session.controller';
import { AdminCsrfGuard, AdminWebSessionGuard } from './admin-web-session.guard';
import { AdminWebSessionService } from './admin-web-session.service';

describe('AdminWebSessionController', () => {
  let app: INestApplication<App>;
  let configuration: Record<string, unknown>;

  const validConfiguration = () => ({
    ADMIN_WEB_PASSWORD_HASH:
      'scrypt$ZHVtbXktYWRtaW4td2ViLXNhbHQ$kHoMptv_cnuzbkUPYVY8j2eycE0kei7bBK2RYw4YPhJd9PqrYn8wKQc1qZehHl4YuDP0HZRctqmTHJVHWqcWDQ',
    ADMIN_WEB_SESSION_SECRET: 'dummy-admin-web-session-secret-with-32-plus-characters',
    ADMIN_REVIEW_OPERATOR_ID: 'dummy-operator',
    ADMIN_REVIEW_BUSINESS_IDS: '123e4567-e89b-42d3-a456-426614174000',
  });

  beforeAll(async () => {
    configuration = validConfiguration();
    const module = await Test.createTestingModule({
      controllers: [AdminWebSessionController],
      providers: [
        AdminWebSessionService,
        AdminWebSessionGuard,
        AdminCsrfGuard,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => configuration[key]) },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    configuration = validConfiguration();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an HttpOnly, Secure, SameSite session without returning credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ password: 'dummy-web-password' })
      .expect(201);

    expect(response.body).toEqual({ authenticated: true });
    expect(JSON.stringify(response.body)).not.toContain('password');
    expect(response.headers['set-cookie']).toEqual([
      expect.stringContaining('admin_web_session='),
    ]);
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('Secure');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Strict');
    expect(response.headers['set-cookie'][0]).toContain('Path=/admin');
  });

  it.each([
    [{ password: 'wrong-password' }],
    [{ password: '' }],
    [{}],
    [{ password: 'dummy-web-password', unexpected: true }],
  ])('rejects an invalid login body or password', async (body) => {
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send(body)
      .expect(401)
      .expect({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid admin web credential.',
      });
  });

  it('fails closed when the web password hash is not configured', async () => {
    configuration = { ...validConfiguration(), ADMIN_WEB_PASSWORD_HASH: undefined };

    const response = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ password: 'dummy-web-password' })
      .expect(500)
      .expect({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Unable to authenticate admin session.',
      });

    expect(JSON.stringify(response.body)).not.toContain('scrypt');
  });

  it('returns only authorized businesses and a CSRF token from me', async () => {
    const login = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ password: 'dummy-web-password' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/admin/auth/me')
      .set('Cookie', login.headers['set-cookie'])
      .expect(200);

    expect(response.body).toEqual({
      businessIds: ['123e4567-e89b-42d3-a456-426614174000'],
      csrfToken: expect.any(String),
    });
    expect(JSON.stringify(response.body)).not.toContain('operator');
  });

  it('logs out only with the session CSRF token', async () => {
    const session = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ password: 'dummy-web-password' });
    const me = await request(app.getHttpServer())
      .get('/admin/auth/me')
      .set('Cookie', session.headers['set-cookie']);

    await request(app.getHttpServer())
      .post('/admin/auth/logout')
      .set('Cookie', session.headers['set-cookie'])
      .set('X-CSRF-Token', me.body.csrfToken)
      .expect(204);
  });
});
