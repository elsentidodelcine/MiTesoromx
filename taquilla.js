function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtMoney(n, texto) {
  if (texto) return escapeHTML(texto);
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(2).replace(/\.?0+$/, '') + ' M';
  if (num >= 1e6) return '$' + Math.round(num / 1e6) + ' M';
  return '$' + num.toLocaleString('en-US');
}

function rowHTML(p, { showYear = false } = {}) {
  const pos = Number(p.puesto) || 0;
  const top = pos >= 1 && pos <= 3 ? ' top3' : '';
  const enCartel = p.enCartel === true || Number(p.anio) === new Date().getFullYear();
  const rowClass = enCartel ? ' taquilla-row--cartel' : '';

  const meta = [
    showYear && p.anio ? String(p.anio) : null,
    p.distribuidora || null,
    p.director || null
  ].filter(Boolean).join(' · ');

  const resultado = p.resultado || calcResultado(p.taquilla, p.presupuesto);

  return `
    <article class="taquilla-row${rowClass}">
      <span class="taquilla-pos${top}">${pos || '—'}</span>
      <img class="taquilla-poster" src="${escapeHTML(p.poster || '')}" alt=""
           loading="lazy" onerror="this.style.visibility='hidden'">
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
  try {
    const data = await loadTaquilla();
    const items = (data.historia || []).slice().sort((a, b) => (a.puesto || 99) - (b.puesto || 99));
    if (note) {
      note.textContent = data.nota ||
        (data.actualizado ? `Actualizado: ${data.actualizado}` : '');
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
      pintarAnio(years, anio, modo);
    };

    sel?.addEventListener('change', repintar);
    tipo?.addEventListener('change', repintar);
    repintar();
  } catch (e) {
    console.error(e);
    if (box) box.innerHTML = `<p class="empty-state">Error al cargar los datos.</p>`;
  }
}

function pintarAnio(years, anio, modo = 'general') {
  const box = document.getElementById('taquilla-anio-container');
  const y = years.find(x => String(x.anio) === String(anio));
  if (!box) return;

  if (!y) {
    box.innerHTML = `<p class="empty-state">Sin datos para ${escapeHTML(String(anio))}.</p>`;
    return;
  }

  let pelis = [];
  if (modo === 'terror') {
    pelis = (y.terror || y.peliculas || []).filter(p =>
      (p.genero || '').toLowerCase() === 'terror' ||
      (p.generos || []).some(g => /terror|horror/i.test(g))
    );
    // Si tienes array dedicado:
    if (Array.isArray(y.terror) && y.terror.length) pelis = y.terror;
  } else {
    pelis = (y.peliculas || []).slice();
  }

  pelis = pelis.slice().sort((a, b) => (a.puesto || 99) - (b.puesto || 99));

  const tituloLista = modo === 'terror' ? 'Terror' : 'General';

  box.innerHTML = `
    <div class="year-block">
      <h2>${escapeHTML(String(y.anio))} · ${tituloLista}</h2>
      <div class="taquilla-list">
        ${pelis.length
          ? pelis.map(p => rowHTML(p)).join('')
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
          ? pelis.map(p => rowHTML(p)).join('')
          : `<p class="empty-state">Sin películas cargadas para este año.</p>`}
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
