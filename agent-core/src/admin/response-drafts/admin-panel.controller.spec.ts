import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminPanelController } from './admin-panel.controller';
import {
  clearPreservedDraftEditorText,
  preserveDraftEditorText,
  resolveDraftEditorText,
} from './editor-text-state';
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

    expect(response.text).toContain('Revisión de borradores');
    expect(response.text).toContain("fetch(path,{credentials:'include'");
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

  it('includes the mobile-first inbox, safe detail, review actions and explicit errors', () => {
    expect(ADMIN_PANEL_HTML).toContain('nextCursor');
    expect(ADMIN_PANEL_HTML).toContain('slice(0,10)');
    expect(ADMIN_PANEL_HTML).toContain("review('APPROVE')");
    expect(ADMIN_PANEL_HTML).toContain("review('EDIT_AND_APPROVE'");
    expect(ADMIN_PANEL_HTML).toContain("review('REJECT')");
    expect(ADMIN_PANEL_HTML).toContain('r.status===401');
    expect(ADMIN_PANEL_HTML).toContain('r.status===403');
    expect(ADMIN_PANEL_HTML).toContain('r.status===409');
    expect(ADMIN_PANEL_HTML).toContain('Aprobar draft');
    expect(ADMIN_PANEL_HTML).toContain('Editar y aprobar');
    expect(ADMIN_PANEL_HTML).toContain('¿Rechazar este borrador?');
    expect(ADMIN_PANEL_HTML).toContain('safe-area-inset-bottom');
    expect(ADMIN_PANEL_HTML).toContain('@media(min-width:780px)');
    expect(ADMIN_PANEL_HTML).toContain('overflow-x:hidden');
    expect(ADMIN_PANEL_HTML).toContain('new Set(state.items.map(item=>item.id))');
    expect(ADMIN_PANEL_HTML).toContain('state.items.concat');
    expect(ADMIN_PANEL_HTML).toContain("El texto final no puede estar vacío.");
    expect(ADMIN_PANEL_HTML).toContain('state.currentDraftText');
    expect(ADMIN_PANEL_HTML).toContain('No se envió ningún mensaje.');
  });

  it('restores only the preserved draft text after a 401 login flow and clears it after success', () => {
    const draftA = { id: 'draft-a', text: 'Texto original del draft A' };
    const editedText = 'Texto editado por la persona revisora';
    const reviewResponse = { status: 401 };

    let preservedText = null;
    let loginVisible = false;
    if (reviewResponse.status === 401) {
      preservedText = preserveDraftEditorText(draftA.id, editedText);
      loginVisible = true;
    }

    expect(loginVisible).toBe(true);
    expect(preservedText).toEqual({ draftId: draftA.id, text: editedText });
    expect(resolveDraftEditorText(draftA.id, draftA.text, preservedText)).toBe(
      editedText,
    );

    preservedText = clearPreservedDraftEditorText();
    expect(resolveDraftEditorText(draftA.id, draftA.text, preservedText)).toBe(
      draftA.text,
    );
    expect(ADMIN_PANEL_HTML).toContain(resolveDraftEditorText.toString());
  });

  it('does not reuse preserved text when the reviewer selects a different draft', () => {
    const draftA = { id: 'draft-a', text: 'Texto original del draft A' };
    const draftB = { id: 'draft-b', text: 'Texto original del draft B' };
    const preservedText = preserveDraftEditorText(
      draftA.id,
      'Texto editado del draft A',
    );

    expect(resolveDraftEditorText(draftB.id, draftB.text, preservedText)).toBe(
      draftB.text,
    );
  });

  it('keeps the operator flow receive-only and resilient on mobile', () => {
    expect(ADMIN_PANEL_HTML).toContain('session-state');
    expect(ADMIN_PANEL_HTML).toContain('list-loading');
    expect(ADMIN_PANEL_HTML).toContain('empty-list');
    expect(ADMIN_PANEL_HTML).toContain('appendUnique');
    expect(ADMIN_PANEL_HTML).toContain('position:sticky');
    expect(ADMIN_PANEL_HTML).toContain('min-height:46px');
    expect(ADMIN_PANEL_HTML).toContain('error.status=r.status');
    expect(ADMIN_PANEL_HTML).toContain("'/response-drafts/'+encodeURIComponent(state.selectedId)+'/reviews'");
    expect(ADMIN_PANEL_HTML).not.toContain('sender');
    expect(ADMIN_PANEL_HTML).not.toContain('/send');
  });
});
