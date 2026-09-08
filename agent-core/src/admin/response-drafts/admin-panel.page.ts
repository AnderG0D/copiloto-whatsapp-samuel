export const ADMIN_PANEL_HTML = `<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Revisión de borradores</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; color: #17202a; }
    main { max-width: 1100px; margin: auto; } section { margin: 1rem 0; }
    .hidden { display: none; } .layout { display: grid; grid-template-columns: minmax(280px, 1fr) minmax(360px, 2fr); gap: 1rem; }
    button, input, select, textarea { font: inherit; margin: .25rem; padding: .45rem; } textarea { width: 100%; min-height: 8rem; box-sizing: border-box; }
    #status[role="alert"] { color: #9b1c1c; } .item { display: block; width: 100%; text-align: left; }
    .content { white-space: pre-wrap; overflow-wrap: anywhere; } .metadata { color: #53606b; font-size: .9rem; }
  </style>
</head>
<body>
<main>
  <h1>Revisión humana de borradores</h1>
  <p id="status" role="status"></p>
  <section id="login-view">
    <h2>Iniciar sesión</h2>
    <form id="login-form"><label>Contraseña <input id="password" type="password" autocomplete="current-password" required></label><button type="submit">Entrar</button></form>
  </section>
  <section id="panel-view" class="hidden">
    <label>Negocio <select id="business"></select></label>
    <label>Límite <input id="limit" type="number" min="1" max="100" value="25"></label>
    <button id="refresh" type="button">Refrescar</button><button id="logout" type="button">Salir</button>
    <div class="layout"><section><h2>Borradores propuestos</h2><div id="draft-list"></div><button id="next" type="button" class="hidden">Cargar más</button></section>
    <section><h2>Detalle</h2><div id="detail">Selecciona un borrador.</div><div id="actions" class="hidden"><button id="approve" type="button">Aprobar</button><button id="edit" type="button">Editar y aprobar</button><button id="reject" type="button">Rechazar</button><div id="edit-area" class="hidden"><label>Texto final <textarea id="final-text"></textarea></label><button id="save-edit" type="button">Confirmar edición y aprobar</button></div></div></section></div>
  </section>
</main>
<script>
'use strict';
const state = { csrfToken: null, businessId: null, cursor: null, selectedId: null };
const byId = (id) => document.getElementById(id);
const status = byId('status');
function setStatus(message, error) { status.textContent = message; status.setAttribute('role', error ? 'alert' : 'status'); }
function clear(element) { while (element.firstChild) element.removeChild(element.firstChild); }
function addText(parent, tag, value, className) { const element = document.createElement(tag); if (className) element.className = className; element.textContent = String(value ?? ''); parent.appendChild(element); return element; }
function apiError(response, payload) { const fallback = payload && typeof payload.message === 'string' ? payload.message : 'No fue posible completar la solicitud.'; if (response.status === 401) return 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.'; if (response.status === 403) return 'No tienes autorización para esta acción o el token CSRF no es válido.'; if (response.status === 409) return 'El borrador ya no está disponible para revisión. Refresca el listado.'; if (response.status === 400) return 'La solicitud no es válida. Revisa los datos e inténtalo de nuevo.'; return fallback; }
async function request(path, options) { const response = await fetch(path, { credentials: 'include', ...options }); const payload = response.status === 204 ? null : await response.json().catch(() => null); if (!response.ok) throw new Error(apiError(response, payload)); return payload; }
function showLogin(message) { byId('login-view').classList.remove('hidden'); byId('panel-view').classList.add('hidden'); state.csrfToken = null; state.businessId = null; state.selectedId = null; if (message) setStatus(message, true); }
function showPanel(me) { state.csrfToken = me.csrfToken; const select = byId('business'); clear(select); for (const businessId of me.businessIds) { const option = document.createElement('option'); option.value = businessId; option.textContent = businessId; select.appendChild(option); } state.businessId = select.value || null; byId('login-view').classList.add('hidden'); byId('panel-view').classList.remove('hidden'); }
async function loadSession() { try { const me = await request('/admin/auth/me'); if (!me || typeof me.csrfToken !== 'string' || !Array.isArray(me.businessIds) || !me.businessIds.every((id) => typeof id === 'string')) throw new Error('La sesión devolvió datos inválidos.'); showPanel(me); await loadList(true); } catch (error) { showLogin(error.message); } }
function renderList(items) { const list = byId('draft-list'); clear(list); for (const item of items) { const button = document.createElement('button'); button.type = 'button'; button.className = 'item'; button.addEventListener('click', () => loadDetail(item.id)); addText(button, 'strong', item.draftTextPreview || 'Sin texto'); addText(button, 'div', item.createdAt || '', 'metadata'); list.appendChild(button); } }
async function loadList(reset) { if (!state.businessId) return; const limit = Number(byId('limit').value); if (!Number.isInteger(limit) || limit < 1 || limit > 100) { setStatus('El límite debe ser un número entre 1 y 100.', true); return; } if (reset) state.cursor = null; const query = new URLSearchParams({ limit: String(limit) }); if (state.cursor) query.set('cursor', state.cursor); try { const result = await request('/admin/businesses/' + encodeURIComponent(state.businessId) + '/response-drafts?' + query.toString()); renderList(result.items || []); state.cursor = result.page && typeof result.page.nextCursor === 'string' ? result.page.nextCursor : null; byId('next').classList.toggle('hidden', !state.cursor); setStatus('Listado actualizado.', false); } catch (error) { if (error.message.startsWith('Tu sesión')) showLogin(error.message); else setStatus(error.message, true); } }
function renderDetail(data) { const detail = byId('detail'); clear(detail); const draft = data.draft || {}; addText(detail, 'h3', 'Borrador'); addText(detail, 'div', draft.text || '', 'content'); addText(detail, 'div', draft.status || '', 'metadata'); const source = data.sourceMessage || {}; addText(detail, 'h3', 'Mensaje de origen'); addText(detail, 'div', source.content || '', 'content'); addText(detail, 'div', [source.direction, source.role, source.createdAt].filter(Boolean).join(' · '), 'metadata'); addText(detail, 'h3', 'Contexto (máximo 10 mensajes)'); const context = data.safeContext && Array.isArray(data.safeContext.messages) ? data.safeContext.messages.slice(0, 10) : []; for (const message of context) { const container = document.createElement('div'); addText(container, 'div', message.content || '', 'content'); addText(container, 'div', [message.direction, message.role, message.createdAt].filter(Boolean).join(' · '), 'metadata'); detail.appendChild(container); } if (data.safeContext && data.safeContext.truncated) addText(detail, 'p', 'El contexto anterior fue omitido.', 'metadata'); }
async function loadDetail(id) { try { const data = await request('/admin/businesses/' + encodeURIComponent(state.businessId) + '/response-drafts/' + encodeURIComponent(id)); state.selectedId = id; byId('final-text').value = data.draft && typeof data.draft.text === 'string' ? data.draft.text : ''; renderDetail(data); byId('actions').classList.remove('hidden'); byId('edit-area').classList.add('hidden'); } catch (error) { setStatus(error.message, true); } }
async function review(decision, finalText) { if (!state.selectedId || !state.csrfToken) return; const body = decision === 'EDIT_AND_APPROVE' ? { decision, finalText } : { decision }; try { await request('/admin/businesses/' + encodeURIComponent(state.businessId) + '/response-drafts/' + encodeURIComponent(state.selectedId) + '/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken }, body: JSON.stringify(body) }); setStatus('La revisión fue registrada.', false); state.selectedId = null; byId('actions').classList.add('hidden'); await loadList(true); } catch (error) { setStatus(error.message, true); } }
byId('login-form').addEventListener('submit', async (event) => { event.preventDefault(); try { await request('/admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: byId('password').value }) }); byId('password').value = ''; await loadSession(); } catch (error) { setStatus(error.message, true); } });
byId('business').addEventListener('change', () => { state.businessId = byId('business').value; state.selectedId = null; byId('actions').classList.add('hidden'); loadList(true); }); byId('refresh').addEventListener('click', () => loadList(true)); byId('next').addEventListener('click', () => loadList(false)); byId('approve').addEventListener('click', () => review('APPROVE')); byId('reject').addEventListener('click', () => review('REJECT')); byId('edit').addEventListener('click', () => byId('edit-area').classList.remove('hidden')); byId('save-edit').addEventListener('click', () => review('EDIT_AND_APPROVE', byId('final-text').value)); byId('logout').addEventListener('click', async () => { try { await request('/admin/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': state.csrfToken } }); showLogin('Sesión cerrada.'); } catch (error) { setStatus(error.message, true); } });
loadSession();
</script>
</body></html>`;
