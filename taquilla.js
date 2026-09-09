function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


function rowHTML(p, { showYear = false } = {}) {
  const pos = Number(p.puesto) || 0;
  const top = pos >= 1 && pos <= 3 ? ' top3' : '';
  const topClass = pos === 1 ? ' top-1' : pos === 2 ? ' top-2' : pos === 3 ? ' top-3' : '';
  const enCartel = p.enCartel === true || Number(p.anio) === new Date().getFullYear();
  const rowClass = enCartel ? ' taquilla-row--cartel' : '';

  const meta = [
    showYear && p.anio ? String(p.anio) : null,
    p.distribuidora || null,
    p.director || null
  ].filter(Boolean).join(' · ');

  const resultado = p.resultado || calcResultado(p.taquilla, p.presupuesto);

  return `
    <article class="taquilla-row${rowClass}${topClass}">
      <span class="taquilla-pos${top}">${pos || '—'}</span>
      <img class="taquilla-poster" src="${escapeHTML(p.poster || '')}" alt=""
           loading="lazy" decoding="async"
           onload="this.classList.add('loaded')"
           onerror="this.style.visibility='hidden'">
      <div class="taquilla-info">
        <strong>
          ${escapeHTML(p.titulo || 'Sin título')}
          ${enCartel ? '<span class="badge-cartel">En cines</span>' : ''}
        </strong>
        ${meta ? `<span>${escapeHTML(meta)}</span>` : ''}
      </div>
      <div class="taquilla-money">
        ${fmtMoney(p.taquilla, p.taquillaTexto)}
        ${p.presupuesto != null || p.resultado ? badgeResultado(resultado) : ''}
      </div>
    </article>
  `;
}

async function loadTaquilla() {
  const res = await fetch('taquilla.json');
  if (!res.ok) throw new Error('No se pudo cargar taquilla.json');
  return res.json();
}

async function initTaquillaHistoria() {
  const list = document.getElementById('taquilla-list');
  const note = document.getElementById('taquilla-note');
  const countEl = document.getElementById('taquilla-count');

  try {
    const data = await loadTaquilla();
    const items = (data.historia || []).slice().sort((a, b) => (a.puesto || 99) - (b.puesto || 99));

    // Ocultar skeleton
    const sk = document.getElementById('skeleton-loading');
    if (sk) sk.style.display = 'none';

    if (note) {
      note.textContent = data.nota ||
        (data.actualizado ? `Actualizado: ${data.actualizado}` : '');
    }

    if (countEl) {
      countEl.textContent = items.length
        ? `${items.length} película${items.length !== 1 ? 's' : ''} en el ranking`
        : '';
    }

    if (!items.length) {
      list.innerHTML = `<p class="empty-state">Aún no hay datos del ranking histórico.</p>`;
      return;
    }
    list.innerHTML = items.map(p => rowHTML(p, { showYear: true })).join('');
  } catch (e) {
    console.error(e);
    if (list) list.innerHTML = `<p class="empty-state">Error al cargar el ranking.</p>`;
  }
}

async function initTaquillaAnio() {
  const box = document.getElementById('taquilla-anio-container');
  const sel = document.getElementById('filtro-anio');
  const tipo = document.getElementById('filtro-tipo');
  const note = document.getElementById('taquilla-note');
  const ordenSel = document.getElementById('filtro-orden');

  try {
    const data = await loadTaquilla();
    const years = (data.porAnio || []).slice().sort((a, b) => b.anio - a.anio);

    if (note) {
      note.textContent = data.nota ||
        (data.actualizado ? `Actualizado: ${data.actualizado}` : '');
    }

    if (!years.length) {
      box.innerHTML = `<p class="empty-state">Aún no hay rankings por año.</p>`;
      return;
    }

    if (sel) {
      sel.innerHTML = years.map(y =>
        `<option value="${y.anio}">${y.anio}</option>`
      ).join('');
    }

   const repintar = () => {
     const anio = sel?.value || years[0].anio;
     const modo = tipo?.value || 'general';
     const orden = ordenSel?.value || 'puesto';
     pintarAnio(years, anio, modo, orden);
   };

    sel?.addEventListener('change', repintar);
    tipo?.addEventListener('change', repintar);
    ordenSel?.addEventListener('change', repintar);
    repintar();
  } catch (e) {
    console.error(e);
    if (box) box.innerHTML = `<p class="empty-state">Error al cargar los datos.</p>`;
  }
}

function pintarAnio(years, anio, modo = 'general', orden = 'puesto') {
  const box = document.getElementById('taquilla-anio-container');
  const countEl = document.getElementById('taquilla-count');
  const y = years.find(x => String(x.anio) === String(anio));
  if (!box) return;

  // Ocultar skeleton
  const sk = document.getElementById('skeleton-loading');
  if (sk) sk.style.display = 'none';

  if (!y) {
    box.innerHTML = `<p class="empty-state">Sin datos para ${escapeHTML(String(anio))}.</p>`;
    if (countEl) countEl.textContent = '';
    return;
  }

  let pelis = [];
  if (modo === 'terror') {
    pelis = (y.terror || y.peliculas || []).filter(p =>
      (p.genero || '').toLowerCase() === 'terror' ||
      (p.generos || []).some(g => /terror|horror/i.test(g))
    );
    if (Array.isArray(y.terror) && y.terror.length) pelis = y.terror;
  } else {
    pelis = (y.peliculas || []).slice();
  }

  // Orden
  if (orden === 'taquilla') {
    pelis = pelis.slice().sort((a, b) => Number(b.taquilla || 0) - Number(a.taquilla || 0));
  } else {
    pelis = pelis.slice().sort((a, b) => (a.puesto || 99) - (b.puesto || 99));
  }

  const tituloLista = modo === 'terror' ? 'Terror' : 'General';

  if (countEl) {
    countEl.textContent = pelis.length
      ? `${pelis.length} película${pelis.length !== 1 ? 's' : ''} · ${tituloLista}`
      : 'Sin resultados';
  }

  box.innerHTML = `
    <div class="year-block">
      <h2>${escapeHTML(String(y.anio))} · ${tituloLista}</h2>
      <div class="taquilla-list">
      ${pelis.length
        ? pelis.map(p => rowHTMLAnio(p)).join('')
        : `<p class="empty-state">No hay películas de ${tituloLista.toLowerCase()} para este año.</p>`}
      </div>
    </div>
  `;
}

function bloqueAnio(y) {
  const pelis = (y.peliculas || []).slice().sort((a, b) => (a.puesto || 99) - (b.puesto || 99));
  return `
    <div class="year-block">
      <h2 style="width:min(var(--max,1120px),calc(100% - 48px));margin:0 auto 14px;">${escapeHTML(String(y.anio))}</h2>
      <div class="taquilla-list">
        ${pelis.length
          ? pelis.map(p => rowHTMLAnio(p)).join('')
          : `<p class="empty-state">No hay películas de ${tituloLista.toLowerCase()} para este año.</p>`}
      </div>
    </div>
  `;
}

function badgeResultado(r) {
  const map = {
    perdida: { label: 'Pérdida', className: 'badge-perdida' },
    rentable: { label: 'Rentable', className: 'badge-rentable' },
    exito: { label: 'Éxito', className: 'badge-exito' },
    'sin-dato': { label: 'Sin dato', className: 'badge-sin-dato' }
  };
  const x = map[r] || map['sin-dato'];
  return `<span class="badge-resultado ${x.className}">${x.label}</span>`;
}

// O calcular en vivo si tienes presupuesto + taquilla:
function calcResultado(taquilla, presupuesto) {
  if (presupuesto == null || presupuesto <= 0 || taquilla == null) return 'sin-dato';
  const m = Number(taquilla) / Number(presupuesto);
  if (m < 2) return 'perdida';
  if (m < 3) return 'rentable';
  return 'exito';
}

function barraPresupuesto(p) {
  const budget = Number(p.presupuesto);
  const gross = Number(p.taquilla);
  if (!budget || budget <= 0) {
    return `<div class="bar-wrap bar-wrap--empty"><span class="bar-empty">Sin presupuesto publicado</span></div>`;
  }

  const rentable = budget * 2;
  const exito = budget * 3;
  const scale = Math.max(gross, exito) * 1.08;
  const pct = (v) => Math.min(100, Math.max(0, (v / scale) * 100));

  const pctGross = pct(gross);
  const pctBudget = pct(budget);
  const pctRent = pct(rentable);
  const pctExito = pct(exito);
  const resultado = p.resultado || calcResultado(gross, budget);
  const mult = (gross / budget).toFixed(1);

  return `
    <div class="bar-wrap">
      <div class="bar-labels">
        <span class="bar-label bar-label--budget" style="left:${pctBudget}%">1× ${fmtMoney(budget, p.presupuestoTexto)}</span>
        <span class="bar-label bar-label--rentable" style="left:${pctRent}%">2× ${fmtMoney(rentable)}</span>
        <span class="bar-label bar-label--exito" style="left:${pctExito}%">3× ${fmtMoney(exito)}</span>
        <span class="bar-label bar-label--now" style="left:${pctGross}%">${mult}×</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill bar-fill--${escapeHTML(resultado)}" style="width:${pctGross}%"></div>
        <span class="bar-mark bar-mark--budget" style="left:${pctBudget}%"></span>
        <span class="bar-mark bar-mark--rentable" style="left:${pctRent}%"></span>
        <span class="bar-mark bar-mark--exito" style="left:${pctExito}%"></span>
      </div>
    </div>
  `;
}


function fmtMoney(n, texto) {
  if (texto) return escapeHTML(texto);
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(2).replace(/\.00$/, '') + ' B';
  if (num >= 1e6) return '$' + Math.round(num / 1e6) + ' M';
  return '$' + num.toLocaleString('en-US');
}

function rowHTMLAnio(p) {
  const pos = Number(p.puesto) || 0;
  const top = pos >= 1 && pos <= 3 ? ' top3' : '';
  const topClass = pos === 1 ? ' top-1' : pos === 2 ? ' top-2' : pos === 3 ? ' top-3' : '';
  const resultado = p.resultado || calcResultado(p.taquilla, p.presupuesto);
  const meta = [p.distribuidora || null].filter(Boolean).join(' · ');

  return `
    <article class="taquilla-row taquilla-row--anio${topClass}">
      <span class="taquilla-pos${top}">${pos || '—'}</span>
      <img class="taquilla-poster" src="${escapeHTML(p.poster || '')}" alt=""
           loading="lazy" decoding="async"
           onload="this.classList.add('loaded')"
           onerror="this.style.visibility='hidden'">
      <div class="taquilla-info">
        <strong>${escapeHTML(p.titulo || 'Sin título')}</strong>
        ${meta ? `<span>${escapeHTML(meta)}</span>` : ''}
        <div class="taquilla-figures">
          <span>Taquilla: <b>${fmtMoney(p.taquilla, p.taquillaTexto)}</b></span>
          <span>Presupuesto: <b>${p.presupuesto != null ? fmtMoney(p.presupuesto, p.presupuestoTexto) : '—'}</b></span>
          ${badgeResultado(resultado)}
        </div>
        ${barraPresupuesto(p)}
      </div>
    </article>
  `;
}

// ===== Toggle tema claro / oscuro =====
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const html = document.documentElement;
    const actual = html.getAttribute('data-theme') || 'dark';
    const nuevo = actual === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', nuevo);
    try {
      localStorage.setItem('lbdc-theme', nuevo);
    } catch (e) {}
  });
});

// ===== Botón volver arriba =====
document.addEventListener('DOMContentLoaded', () => {
  const btnTop = document.getElementById('btn-top');
  if (!btnTop) return;

  function toggleBtnTop() {
    if (window.scrollY > 400) {
      btnTop.classList.add('is-visible');
    } else {
      btnTop.classList.remove('is-visible');
    }
  }

  window.addEventListener('scroll', toggleBtnTop, { passive: true });
  toggleBtnTop();

  btnTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ===== Toggle tema =====
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const html = document.documentElement;
    const actual = html.getAttribute('data-theme') || 'dark';
    const nuevo = actual === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', nuevo);
    try { localStorage.setItem('lbdc-theme', nuevo); } catch (e) {}
  });
});