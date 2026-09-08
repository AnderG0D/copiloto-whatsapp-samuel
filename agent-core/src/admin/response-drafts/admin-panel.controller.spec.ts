import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminPanelController } from './admin-panel.controller';
import { ADMIN_PANEL_HTML } from './admin-panel.page';

describe('AdminPanelController', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminPanelController],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('serves the same-origin panel without administrative data', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/panel')
      .expect('Content-Type', /html/)
      .expect(200);

    expect(response.text).toContain('Revisión humana de borradores');
    expect(response.text).toContain("fetch(path, { credentials: 'include'");
    expect(response.text).toContain("'/admin/auth/me'");
    expect(response.text).toContain("'/admin/auth/login'");
    expect(response.text).toContain("'/admin/auth/logout'");
    expect(response.text).toContain("'X-CSRF-Token'");
  });

  it('uses cookie authentication and safe DOM rendering without sensitive fields', () => {
    expect(ADMIN_PANEL_HTML).not.toContain('Authorization');
    expect(ADMIN_PANEL_HTML).not.toContain('Bearer');
    expect(ADMIN_PANEL_HTML).not.toContain('localStorage');
    expect(ADMIN_PANEL_HTML).not.toContain('sessionStorage');
    expect(ADMIN_PANEL_HTML).not.toContain('raw_payload');
    expect(ADMIN_PANEL_HTML).not.toContain('external_message_id');
    expect(ADMIN_PANEL_HTML).not.toContain('evolution_instance_name');
    expect(ADMIN_PANEL_HTML).toContain('textContent');
    expect(ADMIN_PANEL_HTML).not.toContain('innerHTML');
  });

  it('includes list, detail, review actions and explicit 401, 403 and 409 handling', () => {
    expect(ADMIN_PANEL_HTML).toContain('nextCursor');
    expect(ADMIN_PANEL_HTML).toContain('slice(0, 10)');
    expect(ADMIN_PANEL_HTML).toContain("review('APPROVE')");
    expect(ADMIN_PANEL_HTML).toContain("review('EDIT_AND_APPROVE'");
    expect(ADMIN_PANEL_HTML).toContain("review('REJECT')");
    expect(ADMIN_PANEL_HTML).toContain('response.status === 401');
    expect(ADMIN_PANEL_HTML).toContain('response.status === 403');
    expect(ADMIN_PANEL_HTML).toContain('response.status === 409');
  });
});
