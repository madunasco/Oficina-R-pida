/* =========================================================
   DADOS
   ========================================================= */
const STORAGE_KEY = 'oficinaRapida:v1';
const STATUS = ['Aguardando', 'Em andamento', 'Concluído'];

function seed() {
  const now = Date.now(), day = 864e5;
  const mk = (id, status, nome, contato, modelo, placa, desc, daysAgo) => ({
    id, status, nome, contato, modelo, placa, descricao: desc,
    criadaEm: new Date(now - daysAgo * day).toISOString(), historico: []
  });
  const u2 = [
    mk(12,'Aguardando','Carlos Mendes','(85) 98812-3344','Fiat Argo 1.3','RQW4E21','Barulho na suspensão dianteira ao passar em lombadas.',0),
    mk(11,'Aguardando','Ana Paula Lima','(85) 99654-1020','Hyundai HB20','PNX2B77','Troca de óleo e filtros. Verificar pastilhas de freio.',1),
    mk(10,'Em andamento','José Ribeiro','(85) 98100-4512','VW Gol G6','OSA8C19','Ar-condicionado não gela. Checar gás e compressor.',2),
    mk(9,'Em andamento','Marina Souza','(85) 99230-7781','Chevrolet Onix','RRT1D05','Luz da injeção acesa no painel.',3),
    mk(8,'Em andamento','Pedro Alves','(85) 98877-6655','Toyota Corolla','QTP5F88','Revisão dos 40.000 km.',4),
    mk(7,'Concluído','Carlos Mendes','(85) 98812-3344','Fiat Argo 1.3','RQW4E21','Alinhamento e balanceamento.',30),
    mk(6,'Concluído','Luana Freitas','(85) 99701-2233','Renault Kwid','PMK3G41','Troca da bateria.',6),
    mk(5,'Concluído','Rafael Costa','(85) 98456-9090','Honda Fit','OQZ7H62','Substituição das velas de ignição.',7),
    mk(4,'Concluído','Beatriz Nunes','(85) 99123-4567','Jeep Renegade','RIB9J30','Troca dos amortecedores traseiros.',8),
    mk(3,'Concluído','Tiago Martins','(85) 98234-5678','Ford Ka','PNC4K12','Reparo no sistema de arrefecimento.',9),
  ];
  const u1 = [
    mk(4,'Aguardando','Fernanda Rocha','(85) 99887-1122','Nissan Kicks','RTA2L33','Ruído no freio traseiro.',0),
    mk(3,'Em andamento','Lucas Pereira','(85) 98765-0011','VW Polo','QSD6M44','Troca da correia dentada.',1),
    mk(2,'Concluído','Juliana Dias','(85) 99345-2211','Fiat Mobi','PLE8N55','Troca de óleo.',3),
    mk(1,'Concluído','Marcos Teixeira','(85) 98444-3322','Chevrolet Tracker','RQB1P66','Revisão geral.',5),
  ];
  return { units: { 1:{seq:4, fichas:u1}, 2:{seq:12, fichas:u2}, 3:{seq:0, fichas:[]} } };
}

function load() {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  return seed();
}
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (e) {} }

let db = load();
const state = { user: null, unit: null, currentId: null };
try { state.user = sessionStorage.getItem('or:user'); } catch (e) {}

const unitData = () => db.units[state.unit];
const sorted = () => [...unitData().fichas].sort((a, b) => b.id - a.id);
const pad = n => String(n).padStart(2, '0');
const fmtDate = iso => new Date(iso).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = id => document.getElementById(id);

/* =========================================================
   NAVEGAÇÃO
   ========================================================= */
function go(name) {
  if (['unit','dash','reg'].includes(name) && !state.user) name = 'login';
  if (['dash','reg'].includes(name) && !state.unit) name = 'unit';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $('s-' + name).classList.add('active');
  window.scrollTo(0, 0);
  if (name === 'dash') renderDash();
  if (name === 'reg') { state.currentId = null; renderReg(); }
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go);
  const u = e.target.closest('[data-unit]'); if (u) { state.unit = u.dataset.unit; go('dash'); }
});
setTimeout(() => go(state.user ? 'unit' : 'welcome'), 1800);

/* =========================================================
   LOGIN
   ========================================================= */
$('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const u = $('lg-user').value.trim(), p = $('lg-pass').value;
  if (!u || !p) { $('lg-err').textContent = 'Preencha usuário e senha.'; return; }
  $('lg-err').textContent = '';
  state.user = u; try { sessionStorage.setItem('or:user', u); } catch (e) {}
  $('lg-pass').value = '';
  go('unit');
});
$('help-btn').addEventListener('click', () => openModal(`
  <h3>Precisa de ajuda?</h3>
  <p>Entre com o usuário e a senha fornecidos pelo responsável da oficina. Se esqueceu seus dados, procure a gerência da sua unidade.</p>
  <div class="row"><button class="btn btn-md" onclick="closeModal()">Entendi</button></div>`));
$('logout-btn').addEventListener('click', () => {
  state.user = null; state.unit = null; try { sessionStorage.removeItem('or:user'); } catch (e) {}
  go('login');
});

/* =========================================================
   PAINEL
   ========================================================= */
function renderDash() {
  $('dash-title').textContent = 'UNIDADE ' + state.unit;
  const f = unitData().fichas;
  $('c-aguardando').textContent = f.filter(x => x.status === 'Aguardando').length;
  $('c-andamento').textContent  = f.filter(x => x.status === 'Em andamento').length;
  $('c-concluido').textContent  = f.filter(x => x.status === 'Concluído').length;
}

$('f-contato').addEventListener('input', e => e.target.value = maskPhone(e.target.value));
$('f-placa').addEventListener('input', e => e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''));
function maskPhone(v) {
  v = v.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 6)  return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 2)  return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  return v;
}

function readForm(prefix) {
  const ids = ['desc','nome','contato','modelo','placa'];
  let ok = true; const v = {};
  ids.forEach(k => {
    const el = $(prefix + k); const val = el.value.trim();
    el.classList.toggle('invalid', !val); if (!val) ok = false; v[k] = val;
  });
  return ok ? v : null;
}

$('new-form').addEventListener('submit', e => {
  e.preventDefault();
  const v = readForm('f-');
  if (!v) { toast('Preencha todos os campos.'); return; }
  const u = unitData();
  u.seq += 1;
  u.fichas.push({ id: u.seq, status: 'Aguardando', descricao: v.desc, nome: v.nome, contato: v.contato,
                  modelo: v.modelo, placa: v.placa.toUpperCase(), criadaEm: new Date().toISOString(), historico: [] });
  save();
  e.target.reset();
  renderDash();
  toast(`Ficha ${pad(u.seq)} registrada!`);
});

/* =========================================================
   REGISTROS
   ========================================================= */
function renderReg() {
  const list = sorted();
  const main = $('reg-main'), prev = $('prev-list');
  if (!list.length) {
    $('reg-label').textContent = 'Último registro';
    main.innerHTML = `<div class="empty">Nenhuma ficha registrada nesta unidade.<br><br>
      <button class="btn btn-md" data-go="dash">Nova solicitação</button></div>`;
    prev.innerHTML = '<div class="empty" style="flex:1">Sem registros anteriores.</div>';
    requestAnimationFrame(syncBar);
    return;
  }
  let cur = list.find(f => f.id === state.currentId) || list[0];
  state.currentId = cur.id;
  $('reg-label').textContent = cur.id === list[0].id ? 'Último registro' : 'Ficha selecionada';

  // histórico: alterações da ficha + outras visitas do mesmo veículo
  const visits = list.filter(f => f.id !== cur.id && f.placa === cur.placa)
    .map(f => ({ data: f.criadaEm, texto: `Ficha ${pad(f.id)} — ${f.status}: ${f.descricao}` }));
  const hist = [...cur.historico, ...visits].sort((a, b) => b.data.localeCompare(a.data));

  main.innerHTML = `
    <div class="ficha-head">
      <div class="ficha-id"><small>FICHA</small><b>${pad(cur.id)}</b></div>
      <div class="ficha-side">
        <div class="st">Status: <select id="quick-status" aria-label="Alterar status">
          ${STATUS.map(s => `<option ${s === cur.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select></div>
        <div class="ficha-btns">
          <button class="btn btn-sm" id="btn-edit">Editar</button>
          <button class="btn btn-sm btn-danger" id="btn-del">Excluir</button>
        </div>
      </div>
    </div>
    <div class="ficha-body">
      <div class="data-col">
        <h4>Dados do cliente</h4>
        <p><span>Nome</span>${esc(cur.nome)}</p>
        <p><span>Contato</span>${esc(cur.contato)}</p>
        <h4 class="muted-line" style="margin-top:20px">Dados do veículo</h4>
        <p><span>Modelo</span>${esc(cur.modelo)}</p>
        <p><span>Placa</span>${esc(cur.placa)}</p>
      </div>
      <div class="hist">
        <h4>Histórico</h4>
        ${hist.length ? `<ul>${hist.map(h => `<li><time>${fmtDate(h.data)}</time>${esc(h.texto)}</li>`).join('')}</ul>` : '<p style="font-size:16px">Não possui</p>'}
      </div>
    </div>
    <div class="desc-box"><span>Solicitação · aberta em ${fmtDate(cur.criadaEm)}</span>${esc(cur.descricao)}</div>`;

  const others = list.filter(f => f.id !== cur.id);
  $('prev-title').textContent = cur.id === list[0].id ? 'Registros anteriores' : 'Outros registros';
  prev.innerHTML = others.length ? others.map(f => `
    <div class="prev-card">
      <small>FICHA</small><b>${pad(f.id)}</b><span class="tag">${f.status}</span>
      <button class="btn btn-sm" data-view="${f.id}" style="width:90px">ver</button>
    </div>`).join('') : '<div class="empty" style="flex:1">Sem registros anteriores.</div>';
  prev.scrollTo({ left: 0, top: 0 });
  requestAnimationFrame(syncBar);

  $('btn-edit').onclick = () => openEdit(cur);
  $('btn-del').onclick = () => confirmDelete(cur);
  $('quick-status').onchange = e => updateStatus(cur, e.target.value);
}

$('prev-list').addEventListener('click', e => {
  const b = e.target.closest('[data-view]'); if (!b) return;
  state.currentId = Number(b.dataset.view);
  renderReg();
  $('reg-label').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ---- Barra de arrastar (horizontal no celular, vertical no desktop) ---- */
const listEl = $('prev-list'), barEl = $('drag-bar'), thumbEl = $('drag-thumb');
const isVertical = () => matchMedia('(min-width: 960px)').matches;
function metrics() {
  const v = isVertical();
  const view = v ? listEl.clientHeight : listEl.clientWidth;
  const total = v ? listEl.scrollHeight : listEl.scrollWidth;
  const track = v ? barEl.clientHeight : barEl.clientWidth;
  const thumb = Math.max(48, track * view / Math.max(total, 1));
  return { v, max: total - view, track, thumb, pos: v ? listEl.scrollTop : listEl.scrollLeft };
}
function syncBar() {
  const m = metrics();
  barEl.classList.toggle('hidden', m.max <= 1);
  if (m.v) barEl.style.height = listEl.clientHeight + 'px'; else barEl.style.height = '';
  const off = m.max > 0 ? (m.pos / m.max) * (m.track - m.thumb) : 0;
  if (m.v) { thumbEl.style.height = m.thumb + 'px'; thumbEl.style.width = ''; thumbEl.style.top = off + 'px'; thumbEl.style.left = ''; }
  else { thumbEl.style.width = m.thumb + 'px'; thumbEl.style.height = ''; thumbEl.style.left = off + 'px'; thumbEl.style.top = ''; }
}
function scrollToRatio(r) {
  const m = metrics(), val = Math.min(1, Math.max(0, r)) * m.max;
  if (m.v) listEl.scrollTop = val; else listEl.scrollLeft = val;
}
listEl.addEventListener('scroll', syncBar, { passive: true });
window.addEventListener('resize', syncBar);
let drag = null;
thumbEl.addEventListener('pointerdown', e => {
  e.preventDefault(); e.stopPropagation(); thumbEl.setPointerCapture(e.pointerId);
  const m = metrics(); drag = { start: m.v ? e.clientY : e.clientX, pos: m.pos, m };
  listEl.style.scrollSnapType = 'none';
});
thumbEl.addEventListener('pointermove', e => {
  if (!drag) return; const { m } = drag;
  const delta = (m.v ? e.clientY : e.clientX) - drag.start;
  const ratio = (drag.pos / Math.max(m.max, 1)) + delta / Math.max(m.track - m.thumb, 1);
  scrollToRatio(ratio);
});
const endDrag = () => { if (drag) { drag = null; listEl.style.scrollSnapType = ''; } };
thumbEl.addEventListener('pointerup', endDrag);
thumbEl.addEventListener('pointercancel', endDrag);
barEl.addEventListener('pointerdown', e => {          // clique na linha: pula até o ponto
  if (e.target === thumbEl) return;
  const m = metrics(), r = barEl.getBoundingClientRect();
  const p = (m.v ? e.clientY - r.top : e.clientX - r.left) - m.thumb / 2;
  listEl.style.scrollBehavior = 'smooth'; scrollToRatio(p / Math.max(m.track - m.thumb, 1));
  setTimeout(() => listEl.style.scrollBehavior = '', 400);
});

function updateStatus(f, status) {
  if (f.status === status) return;
  f.historico.push({ data: new Date().toISOString(), texto: `Status alterado de ${f.status} para ${status}` });
  f.status = status; save(); renderReg(); toast('Status atualizado.');
}

function openEdit(f) {
  openModal(`
    <h3>Editar ficha ${pad(f.id)}</h3>
    <form id="edit-form" novalidate>
      <label>Status</label>
      <select class="input" id="e-status">${STATUS.map(s => `<option ${s === f.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <label>Solicitação</label><textarea class="input" id="e-desc">${esc(f.descricao)}</textarea>
      <label>Nome do cliente</label><input class="input" id="e-nome" value="${esc(f.nome)}">
      <label>Contato do cliente</label><input class="input" id="e-contato" value="${esc(f.contato)}" inputmode="tel">
      <label>Modelo do veículo</label><input class="input" id="e-modelo" value="${esc(f.modelo)}">
      <label>Placa</label><input class="input" id="e-placa" value="${esc(f.placa)}" maxlength="8" style="text-transform:uppercase">
      <div class="row">
        <button type="button" class="btn btn-md btn-ghost" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-md">Salvar</button>
      </div>
    </form>`);
  $('e-contato').addEventListener('input', e => e.target.value = maskPhone(e.target.value));
  $('edit-form').addEventListener('submit', e => {
    e.preventDefault();
    const v = readForm('e-'); if (!v) { toast('Preencha todos os campos.'); return; }
    const now = new Date().toISOString(), newStatus = $('e-status').value;
    const changed = v.desc !== f.descricao || v.nome !== f.nome || v.contato !== f.contato ||
                    v.modelo !== f.modelo || v.placa.toUpperCase() !== f.placa;
    if (newStatus !== f.status) f.historico.push({ data: now, texto: `Status alterado de ${f.status} para ${newStatus}` });
    if (changed) f.historico.push({ data: now, texto: 'Dados da ficha atualizados' });
    Object.assign(f, { status: newStatus, descricao: v.desc, nome: v.nome, contato: v.contato, modelo: v.modelo, placa: v.placa.toUpperCase() });
    save(); closeModal(); renderReg(); toast('Ficha atualizada.');
  });
}

function confirmDelete(f) {
  openModal(`
    <h3>Excluir ficha ${pad(f.id)}?</h3>
    <p>Essa ação não pode ser desfeita. Os dados de <b>${esc(f.nome)}</b> (${esc(f.placa)}) serão removidos.</p>
    <div class="row">
      <button class="btn btn-md btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-md btn-danger" id="do-del">Excluir</button>
    </div>`);
  $('do-del').onclick = () => {
    const list = sorted();
    const idx = list.findIndex(x => x.id === f.id);
    const next = list[idx + 1] || list[idx - 1];         // ficha anterior; se não houver, a mais próxima
    unitData().fichas = unitData().fichas.filter(x => x.id !== f.id);
    state.currentId = next ? next.id : null;
    save(); closeModal(); renderReg();
    toast(`Ficha ${pad(f.id)} excluída.`);
  };
}

/* =========================================================
   MODAL / TOAST
   ========================================================= */
function openModal(html) { $('modal').innerHTML = html; $('overlay').classList.add('open'); }
function closeModal() { $('overlay').classList.remove('open'); }
$('overlay').addEventListener('click', e => { if (e.target.id === 'overlay') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
let tt;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2400);
}
