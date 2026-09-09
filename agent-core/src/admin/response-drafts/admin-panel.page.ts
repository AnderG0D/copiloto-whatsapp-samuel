import {
  clearPreservedDraftEditorText,
  preserveDraftEditorText,
  resolveDraftEditorText,
} from './editor-text-state';

export const ADMIN_PANEL_HTML = `<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>Revisión de borradores</title>
  <style>
    :root{--ink:#17251e;--muted:#617168;--line:#dce5de;--paper:#fff;--bg:#f5f7f4;--green:#146c43;--green-soft:#e8f1ea;--red:#b42318;--red-soft:#fff0ef;--focus:#79b596}
    *{box-sizing:border-box}
    html,body{margin:0;min-width:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    body{min-height:100vh;overflow-x:hidden}
    button,input,select,textarea{font:inherit}
    button,input,select{min-height:46px}
    button{border:0;border-radius:12px;padding:.7rem 1rem;font-weight:750;cursor:pointer}
    button:disabled{opacity:.55;cursor:wait}
    button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
    .hidden{display:none!important}
    .shell{max-width:1280px;min-height:100vh;margin:auto}
    .notice{margin:.75rem 1rem;padding:.75rem .9rem;border-radius:12px;background:#e9f5ed;color:#0c4f30;line-height:1.4}
    .notice[role=alert]{background:var(--red-soft);color:var(--red)}
    .login{max-width:440px;margin:auto;padding:2rem 1rem}
    .login h1{margin:0;font-size:1.7rem;letter-spacing:-.02em}
    .login form,.login label{display:grid;gap:.7rem}
    input,textarea,select{width:100%;padding:.7rem;border:1px solid var(--line);border-radius:12px;background:var(--paper);color:var(--ink)}
    textarea{line-height:1.5}
    .primary,.approve{background:var(--green);color:#fff}
    .subtle,.metadata{color:var(--muted);font-size:.86rem;line-height:1.4}
    .topbar{display:grid;gap:.7rem;padding:max(1rem,env(safe-area-inset-top)) 1rem 1rem;background:var(--paper);border-bottom:1px solid var(--line)}
    .brand{font-weight:800;font-size:1.1rem;letter-spacing:-.01em}
    .session{display:flex;align-items:center;gap:.5rem;min-width:0}
    .session select{flex:1;min-width:0}
    .session-state{display:inline-flex;align-items:center;min-height:30px;padding:.2rem .55rem;border-radius:999px;background:#edf3ee;color:#0c4f30;font-size:.75rem;font-weight:800;white-space:nowrap}
    .icon,.secondary,.back{background:var(--green-soft);color:#0c4f30}
    .icon{width:46px;padding:0}
    .workspace{display:grid;min-width:0}
    .inbox{min-width:0;padding:1rem}
    .heading,.card-top,.tags{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap}
    .heading{justify-content:space-between;margin-bottom:.8rem}
    .heading h1{margin:0;font-size:1.15rem;letter-spacing:-.01em}
    .draft-list{display:grid;gap:.65rem}
    .draft-card{display:grid;gap:.55rem;width:100%;min-height:116px;padding:.9rem;text-align:left;border:1px solid var(--line);border-radius:16px;background:var(--paper);color:inherit}
    .draft-card:hover,.draft-card[aria-current=true]{border-color:var(--green);box-shadow:0 0 0 1px var(--green)}
    .card-top{justify-content:space-between}
    .badge{min-height:25px;padding:.15rem .5rem;border-radius:999px;background:#edf3ee;color:#0c4f30;font-size:.74rem;font-weight:800}
    .badge.status{background:#edf1f7;color:#36536f}
    .badge.hot{background:#fff3d8;color:#9a6700}
    .preview{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-height:1.4}
    .empty,.loading{padding:2rem 1rem;text-align:center;border:1px dashed #c7d4ca;border-radius:16px;color:var(--muted);background:var(--paper)}
    .load-more{width:100%;margin-top:.8rem;background:var(--green-soft);color:#0c4f30}
    .detail-pane{position:fixed;inset:0;z-index:2;display:none;flex-direction:column;background:var(--bg)}
    .detail-pane.is-open{display:flex}
    .detail-header{display:flex;align-items:center;gap:.5rem;padding:max(.75rem,env(safe-area-inset-top)) 1rem .75rem;background:var(--paper);border-bottom:1px solid var(--line)}
    .detail-header h2{margin:0;font-size:1.05rem}
    .back{padding-inline:.85rem}
    .detail-scroll{flex:1;overflow:auto;padding:1rem 1rem calc(8rem + env(safe-area-inset-bottom))}
    .detail-content{display:grid;gap:1rem;max-width:760px;margin:auto}
    .detail-section{padding-bottom:1rem;border-bottom:1px solid var(--line)}
    .detail-section h3{margin:0 0 .55rem;font-size:.85rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
    .content{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5}
    .history{display:grid;gap:.75rem}
    .history-item{padding-left:.75rem;border-left:3px solid #c9dbcd}
    .action-bar{position:sticky;bottom:0;display:grid;grid-template-columns:1fr 1fr;gap:.6rem;padding:.75rem 1rem calc(.75rem + env(safe-area-inset-bottom));background:#fffffff2;border-top:1px solid var(--line)}
    .reject{grid-column:1/-1;background:var(--red-soft);color:var(--red)}
    .editor{display:grid;gap:.65rem}
    .editor textarea{min-height:10rem;resize:vertical}
    .confirm-sheet{position:fixed;inset:0;z-index:5;display:grid;align-items:end;background:#17251e66}
    .confirm-sheet>div{padding:1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom));border-radius:20px 20px 0 0;background:var(--paper)}
    .confirm-actions{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
    .danger{background:var(--red);color:#fff}
    @media(min-width:780px){
      .topbar{grid-template-columns:1fr auto;align-items:center;padding-inline:1.5rem}
      .workspace{grid-template-columns:minmax(320px,.85fr) minmax(440px,1.5fr)}
      .inbox{height:calc(100vh - 85px);overflow:auto;border-right:1px solid var(--line);padding:1.25rem}
      .detail-pane{position:sticky;top:0;display:flex;height:calc(100vh - 85px);background:transparent}
      .detail-pane:not(.is-open) .detail-scroll,.detail-pane:not(.is-open) .action-bar{display:none}
      .detail-pane:not(.is-open):after{content:'Selecciona un borrador para revisar.';display:grid;place-items:center;height:100%;color:var(--muted)}
      .back{display:none}
      .detail-scroll{padding:1rem 1.5rem}
      .action-bar{padding:.9rem 1.5rem}
      .confirm-sheet{align-items:center}
      .confirm-sheet>div{width:min(420px,100%);margin:auto;border-radius:20px}
    }
  </style>
</head>
<body>
  <main class="shell">
    <p id="status" class="notice hidden" role="status" aria-live="polite"></p>
    <section id="login-view" class="login">
      <h1>Revisión de borradores</h1>
      <p class="subtle">Acceso para revisión humana. Aprobar una propuesta no envía mensajes.</p>
      <form id="login-form"><label>Contraseña <input id="password" type="password" autocomplete="current-password" required></label><button class="primary" type="submit">Entrar</button></form>
    </section>
    <section id="panel-view" class="hidden">
      <header class="topbar">
        <div><div class="brand">Revisión de borradores</div><div id="business-label" class="subtle">Negocio seleccionado</div></div>
        <div class="session"><span id="session-state" class="session-state">Sesión activa</span><select id="business" aria-label="Negocio seleccionado"></select><button id="refresh" class="icon" type="button" aria-label="Actualizar bandeja">↻</button><button id="logout" class="icon" type="button">Salir</button></div>
      </header>
      <div class="workspace">
        <section class="inbox" aria-labelledby="inbox-title">
          <div class="heading"><h1 id="inbox-title">Bandeja</h1><span id="draft-count" class="metadata"></span></div>
          <div id="list-loading" class="loading hidden" role="status" aria-live="polite">Cargando borradores…</div>
          <div id="draft-list" class="draft-list"></div>
          <div id="empty-list" class="empty hidden">No hay borradores pendientes de revisión.</div>
          <button id="next" class="load-more hidden" type="button">Cargar más</button>
        </section>
        <section id="detail-pane" class="detail-pane" aria-label="Detalle del borrador">
          <header class="detail-header"><button id="back" class="back" type="button">Volver</button><h2>Detalle del borrador</h2></header>
          <div id="detail" class="detail-scroll"></div>
          <div id="actions" class="action-bar hidden"><button id="approve" class="approve" type="button">Aprobar draft</button><button id="edit" class="secondary" type="button">Editar y aprobar</button><button id="reject" class="reject" type="button">Rechazar</button></div>
        </section>
      </div>
    </section>
  </main>
  <div id="reject-confirmation" class="confirm-sheet hidden" role="dialog" aria-modal="true" aria-labelledby="reject-title"><div><h2 id="reject-title">¿Rechazar este borrador?</h2><p class="subtle">La decisión se registrará. No se enviará ningún mensaje al lead.</p><div class="confirm-actions"><button id="cancel-reject" class="secondary" type="button">Cancelar</button><button id="confirm-reject" class="danger" type="button">Sí, rechazar</button></div></div></div>
  <script>
    'use strict';
    const preserveDraftEditorText=${preserveDraftEditorText.toString()};
    const resolveDraftEditorText=${resolveDraftEditorText.toString()};
    const clearPreservedDraftEditorText=${clearPreservedDraftEditorText.toString()};
    const state={csrfToken:null,businessId:null,cursor:null,selectedId:null,items:[],busy:false,hasLoadedList:false,currentDraftText:'',preservedEditorText:null};
    const byId=id=>document.getElementById(id);
    const status=byId('status');
    function setStatus(message,error){status.textContent=message||'';status.classList.toggle('hidden',!message);status.setAttribute('role',error?'alert':'status')}
    function clear(el){while(el.firstChild)el.removeChild(el)}
    function text(parent,tag,value,cn){const el=document.createElement(tag);if(cn)el.className=cn;el.textContent=String(value??'');parent.appendChild(el);return el}
    function apiError(r,p){if(r.status===401)return 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.';if(r.status===403)return 'No tienes autorización para esta acción o el token CSRF no es válido.';if(r.status===409)return 'El borrador ya no está disponible para revisión. Refresca el listado.';if(r.status===400)return 'La solicitud no es válida. Revisa los datos e inténtalo de nuevo.';return p&&typeof p.message==='string'?p.message:'No fue posible completar la solicitud.'}
    async function request(path,options){const r=await fetch(path,{credentials:'include',...options});const p=r.status===204?null:await r.json().catch(()=>null);if(!r.ok){const error=new Error(apiError(r,p));error.status=r.status;throw error}return p}
    function busy(value,message){state.busy=value;document.querySelectorAll('button,select,input,textarea').forEach(el=>{el.disabled=value});if(message)setStatus(message,false)}
    function showLogin(message){byId('login-view').classList.remove('hidden');byId('panel-view').classList.add('hidden');byId('detail-pane').classList.remove('is-open');state.csrfToken=null;state.businessId=null;state.selectedId=null;state.cursor=null;state.items=[];state.hasLoadedList=false;if(message)setStatus(message,true)}
    function preserveEditorText(){const editor=byId('final-text');const currentText=editor?editor.value:state.currentDraftText;state.preservedEditorText=preserveDraftEditorText(state.selectedId,currentText)}
    function showPanel(me){state.csrfToken=me.csrfToken;const select=byId('business');clear(select);me.businessIds.forEach(id=>{const option=document.createElement('option');option.value=id;option.textContent=id;select.appendChild(option)});state.businessId=select.value||null;byId('business-label').textContent=state.businessId?'Negocio autorizado · '+state.businessId:'Sin negocio seleccionado';byId('session-state').textContent='Sesión activa';byId('login-view').classList.add('hidden');byId('panel-view').classList.remove('hidden')}
    async function loadSession(){try{const me=await request('/admin/auth/me');if(!me||typeof me.csrfToken!=='string'||!Array.isArray(me.businessIds)||!me.businessIds.every(id=>typeof id==='string'))throw new Error('La sesión devolvió datos inválidos.');showPanel(me);await loadList(true)}catch(error){showLogin(error.message)}}
    function badge(parent,value,cn){if(value!==null&&value!==undefined&&value!=='')text(parent,'span',value,'badge '+(cn||''))}
    function renderList(){const list=byId('draft-list');clear(list);state.items.forEach(item=>{const card=document.createElement('button');card.type='button';card.className='draft-card';card.setAttribute('aria-current',String(item.id===state.selectedId));card.addEventListener('click',()=>loadDetail(item.id));const top=document.createElement('div');top.className='card-top';const tags=document.createElement('div');tags.className='tags';badge(tags,item.lead&&item.lead.classification,String(item.lead&&item.lead.classification||'').toLowerCase()==='hot'?'hot':'');badge(tags,item.status,'status');top.append(tags);text(top,'span',item.createdAt||'','metadata');card.append(top);text(card,'div',item.draftTextPreview||'Sin texto','preview');const meta=document.createElement('div');meta.className='tags';if(item.lead&&item.lead.score!==null&&item.lead.score!==undefined)badge(meta,'Score '+item.lead.score);if(item.priority)badge(meta,'Prioridad '+item.priority,'hot');card.append(meta);list.append(card)});byId('draft-count').textContent=state.items.length?state.items.length+' borrador(es)':'';byId('empty-list').classList.toggle('hidden',!state.hasLoadedList||state.items.length!==0||state.busy)}
    function appendUnique(items){const known=new Set(state.items.map(item=>item.id));const fresh=items.filter(item=>{if(!item||typeof item.id!=='string'||known.has(item.id))return false;known.add(item.id);return true});state.items=state.items.concat(fresh)}
    async function loadList(reset,announce=true,allowBusy=false){if(!state.businessId||(state.busy&&!allowBusy))return false;if(reset){state.cursor=null;state.items=[];state.hasLoadedList=false;renderList()}byId('list-loading').classList.remove('hidden');busy(true,reset?'Actualizando bandeja…':'Cargando más borradores…');const query=new URLSearchParams({limit:'25'});if(state.cursor)query.set('cursor',state.cursor);try{const result=await request('/admin/businesses/'+encodeURIComponent(state.businessId)+'/response-drafts?'+query.toString());appendUnique(Array.isArray(result.items)?result.items:[]);state.cursor=result.page&&typeof result.page.nextCursor==='string'&&result.page.nextCursor.length>0?result.page.nextCursor:null;state.hasLoadedList=true;byId('next').classList.toggle('hidden',!state.cursor);if(announce)setStatus(state.items.length?'Bandeja actualizada.':'No hay borradores pendientes de revisión.',false);return true}catch(error){if(error.status===401)showLogin(error.message);else setStatus(error.message,true);return false}finally{byId('list-loading').classList.add('hidden');busy(false);renderList()}}
    function section(parent,title){const el=document.createElement('section');el.className='detail-section';text(el,'h3',title);parent.append(el);return el}
    function signals(parent,value){const list=document.createElement('div');list.className='history';if(value&&typeof value==='object'&&!Array.isArray(value))Object.entries(value).forEach(([key,item])=>{if(item===null||['string','number','boolean'].includes(typeof item))text(list,'div',key+': '+String(item),'metadata')});if(!list.childElementCount)text(list,'p','Sin señales disponibles.','metadata');parent.append(list)}
    function renderDetail(data){const detail=byId('detail');clear(detail);const content=document.createElement('div');content.className='detail-content';detail.append(content);const draft=data.draft||{},source=data.sourceMessage||{},lead=data.lead||{};const originalDraftText=typeof draft.text==='string'?draft.text:'';const draftText=resolveDraftEditorText(state.selectedId,originalDraftText,state.preservedEditorText);let current=section(content,'Draft de Gemini');text(current,'div',draftText||'Sin texto','content');text(current,'div',[draft.status,draft.createdAt].filter(Boolean).join(' · '),'metadata');current=section(content,'Mensaje recibido');text(current,'div',source.content||'Sin mensaje','content');text(current,'div',[source.direction,source.role,source.createdAt].filter(Boolean).join(' · '),'metadata');current=section(content,'Clasificación y score');const tags=document.createElement('div');tags.className='tags';badge(tags,lead.classification,String(lead.classification||'').toLowerCase()==='hot'?'hot':'');badge(tags,lead.score===null||lead.score===undefined?null:'Score '+lead.score);badge(tags,lead.status,'status');current.append(tags);if(typeof lead.classificationReason==='string'&&lead.classificationReason)text(current,'p',lead.classificationReason,'metadata');current=section(content,'Señales');signals(current,source.detectedSignals);if(typeof source.classificationReason==='string'&&source.classificationReason)text(current,'p','Motivo: '+source.classificationReason,'metadata');current=section(content,'Historial seguro');const history=document.createElement('div');history.className='history';const messages=data.safeContext&&Array.isArray(data.safeContext.messages)?data.safeContext.messages.slice(0,10):[];messages.forEach(message=>{const item=document.createElement('div');item.className='history-item';text(item,'div',message.content||'','content');text(item,'div',[message.direction,message.role,message.createdAt].filter(Boolean).join(' · '),'metadata');history.append(item)});if(!messages.length)text(history,'p','Sin mensajes adicionales.','metadata');if(data.review&&data.review.decision){const review=document.createElement('div');review.className='history-item';text(review,'div','Revisión registrada: '+data.review.decision,'content');text(review,'div',data.review.decidedAt||'','metadata');history.append(review)}current.append(history);if(data.safeContext&&data.safeContext.truncated)text(current,'p','El contexto anterior fue omitido.','metadata');state.currentDraftText=draftText;byId('business-label').textContent=data.business&&data.business.name?'Negocio · '+data.business.name:'Negocio autorizado · '+state.businessId}
    async function loadDetail(id){if(state.busy)return;busy(true,'Cargando detalle…');try{const data=await request('/admin/businesses/'+encodeURIComponent(state.businessId)+'/response-drafts/'+encodeURIComponent(id));state.selectedId=id;renderDetail(data);renderList();byId('detail-pane').classList.add('is-open');byId('actions').classList.remove('hidden')}catch(error){if(error.status===401)showLogin(error.message);else setStatus(error.message,true)}finally{busy(false)}}
    function showEditor(){if(byId('final-text'))return;const editor=document.createElement('section');editor.className='detail-section editor';text(editor,'h3','Texto final');const area=document.createElement('textarea');area.id='final-text';area.setAttribute('aria-label','Texto final');area.value=state.currentDraftText;area.addEventListener('input',()=>{state.currentDraftText=area.value;area.style.height='auto';area.style.height=Math.max(160,area.scrollHeight)+'px'});editor.append(area);const save=document.createElement('button');save.id='save-edit';save.type='button';save.className='primary';save.textContent='Confirmar y aprobar';save.addEventListener('click',()=>review('EDIT_AND_APPROVE',area.value));editor.append(save);byId('detail').firstChild.append(editor);area.dispatchEvent(new Event('input'));area.focus();area.scrollIntoView({block:'center'})}
    async function review(decision,finalText){if(!state.selectedId||!state.csrfToken||state.busy)return;if(decision==='EDIT_AND_APPROVE'&&(!finalText||!finalText.trim())){setStatus('El texto final no puede estar vacío.',true);byId('final-text').focus();return}busy(true,'Registrando revisión…');try{await request('/admin/businesses/'+encodeURIComponent(state.businessId)+'/response-drafts/'+encodeURIComponent(state.selectedId)+'/reviews',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrfToken},body:JSON.stringify(decision==='EDIT_AND_APPROVE'?{decision,finalText}:{decision})});const refreshed=await loadList(true,false,true);setStatus(refreshed?'La revisión fue registrada. No se envió ningún mensaje.':'La revisión fue registrada. No se pudo actualizar la bandeja; puedes refrescarla.',!refreshed);state.selectedId=null;state.currentDraftText='';state.preservedEditorText=clearPreservedDraftEditorText();byId('actions').classList.add('hidden');byId('detail-pane').classList.remove('is-open')}catch(error){if(error.status===401){preserveEditorText();showLogin(error.message)}else setStatus(error.message,true)}finally{busy(false)}}
    byId('login-form').addEventListener('submit',async event=>{event.preventDefault();if(state.busy)return;busy(true,'Iniciando sesión…');try{await request('/admin/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:byId('password').value})});byId('password').value='';busy(false);await loadSession()}catch(error){setStatus(error.message,true)}finally{busy(false)}});
    byId('business').addEventListener('change',()=>{state.businessId=byId('business').value;byId('business-label').textContent='Negocio autorizado · '+state.businessId;state.selectedId=null;byId('actions').classList.add('hidden');byId('detail-pane').classList.remove('is-open');loadList(true)});
    byId('refresh').addEventListener('click',()=>loadList(true));byId('next').addEventListener('click',()=>loadList(false));byId('back').addEventListener('click',()=>byId('detail-pane').classList.remove('is-open'));byId('approve').addEventListener('click',()=>review('APPROVE'));byId('edit').addEventListener('click',showEditor);byId('reject').addEventListener('click',()=>byId('reject-confirmation').classList.remove('hidden'));byId('cancel-reject').addEventListener('click',()=>byId('reject-confirmation').classList.add('hidden'));byId('confirm-reject').addEventListener('click',()=>{byId('reject-confirmation').classList.add('hidden');review('REJECT')});byId('logout').addEventListener('click',async()=>{busy(true,'Cerrando sesión…');try{await request('/admin/auth/logout',{method:'POST',headers:{'X-CSRF-Token':state.csrfToken}});showLogin('Sesión cerrada.')}catch(error){if(error.status===401)showLogin(error.message);else setStatus(error.message,true)}finally{busy(false)}});loadSession();
  </script>
</body>
</html>`;
