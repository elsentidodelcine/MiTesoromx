document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('precios-container');
  const tabs = document.getElementById('cine-tabs');
  const selectComplejo = document.getElementById('filtro-complejo');
  const complejoWrap = document.getElementById('complejo-filter-wrap');
  const ciudadTabs = document.getElementById('ciudad-tabs');

  let data = [];
  let metaActualizado = null;
  let cadenaActiva = 'cinepolis';
  let complejoActivo = null;
  let ciudadActiva = 'sfr';

  let filtroDia = 'promedio';
  let filtroModo = 'combo';
  let filtroCat = 'todos';
  let usarClub = false;

  const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const DIAS_LABEL = {
    lunes: 'lunes', martes: 'martes', miercoles: 'miércoles', jueves: 'jueves',
    viernes: 'viernes', sabado: 'sábado', domingo: 'domingo'
  };

  const CIUDADES = {
    sfr: {
      nombre: 'San Francisco del Rincón',
      complejos: ['san-francisco', 'movie-center']
    },
    leon: {
      nombre: 'León',
      complejos: [
        'plaza-mayor-market', 'plaza-mayor-platino', 'plaza-stadium',
        'hilamas', 'leon', 'paso-morelos', 'galerias-las-torres',
        'altacia', 'altacia-vip', 'city-center-vip', 'centro-max', 'leon-centro'
      ]
    },
    'leon-cadenas': {
      nombre: 'León · por cadena',
      modo: 'cadenas',
      complejos: [
        'plaza-mayor-market', 'plaza-mayor-platino', 'plaza-stadium',
        'hilamas', 'leon', 'paso-morelos', 'galerias-las-torres',
        'altacia', 'altacia-vip', 'city-center-vip', 'centro-max', 'leon-centro'
      ]
    }
  };

  try {
    const response = await fetch('precios.json');
    if (!response.ok) throw new Error('No se pudo cargar precios.json');

    const raw = await response.json();
    data = normalizarData(raw);

    // Listeners (ANTES estaban faltando)
    bindTabs();
    bindHerramientas();

    cargarComplejos();
    render();
    actualizarNotaFecha();
    llenarVersusSelects();
    refreshTools();
  } catch (error) {
    console.error(error);
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          No se pudieron cargar los precios.<br>
          Revisa que exista el archivo <strong>precios.json</strong> junto a esta página.
        </div>`;
    }
  }

  function normalizarData(raw) {
    if (Array.isArray(raw)) {
      metaActualizado = null;
      return raw;
    }
    metaActualizado = raw.actualizado || null;
    return raw.cadenas || [];
  }

  function bindTabs() {
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.cine-tab');
        if (!btn) return;
        tabs.querySelectorAll('.cine-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        cadenaActiva = btn.dataset.cadena;
        cargarComplejos();
        render();
      });
    }

    if (selectComplejo) {
      selectComplejo.addEventListener('change', () => {
        complejoActivo = selectComplejo.value;
        render();
      });
    }

    if (ciudadTabs) {
      ciudadTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.ciudad-tab');
        if (!btn) return;
        ciudadTabs.querySelectorAll('.ciudad-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ciudadActiva = btn.dataset.ciudad;
        renderComparativa(ciudadActiva);
        renderTipYTop3();
      });
    }
  }

  function getCadena() {
    return data.find(c => c.cadena === cadenaActiva);
  }

  function getComplejo() {
    const cadena = getCadena();
    if (!cadena) return null;
    return (cadena.complejos || []).find(c => c.id === complejoActivo) || (cadena.complejos || [])[0];
  }

  function cargarComplejos() {
    const cadena = getCadena();
    if (!cadena || !selectComplejo) return;

    const complejos = cadena.complejos || [];
    if (complejos.length <= 1) complejoWrap?.classList.add('hidden');
    else complejoWrap?.classList.remove('hidden');

    selectComplejo.innerHTML = complejos
      .map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.nombre)}</option>`)
      .join('');

    complejoActivo = complejos[0]?.id || null;
    selectComplejo.value = complejoActivo || '';
  }

  function render() {
    const cadena = getCadena();
    const complejo = getComplejo();

    if (!cadena || !complejo) {
      container.innerHTML = `<div class="error-state">No hay datos para este complejo.</div>`;
      return;
    }

    // Sin "compra típica"
    container.innerHTML = `
      <section class="cine-section active">
        <div class="cine-header">
          <h2>${escapeHTML(cadena.nombreCadena)} — ${escapeHTML(complejo.nombre)}</h2>
          <span class="ubicacion">${escapeHTML(complejo.zona || 'Precios de referencia')}</span>
        </div>
        ${tablaBoletos(complejo)}
        ${tablaSnacks(complejo)}
      </section>
    `;
  }

  function tablaBoletos(complejo) {
    let boletos = complejo.boletos || [];
    if (!Array.isArray(boletos)) boletos = [boletos];
    const diasLabel = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const filas = boletos.map(b => `
      <tr>
        <td>${escapeHTML(b.label || 'Boleto')}</td>
        ${DIAS.map(dia => {
          const p = b[dia];
          const vacio = p == null || p === 0;
          return `<td class="${vacio ? 'na' : 'precio'}">${vacio ? '—' : fmt(p)}</td>`;
        }).join('')}
      </tr>
    `).join('');

    return `
      <div class="table-block">
        <h3><span>★</span> Boletos</h3>
        <div class="table-scroll">
          <table class="precios-table">
            <thead>
              <tr>
                <th>Tipo</th>
                ${diasLabel.map(d => `<th>${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function tablaSnacks(complejo) {
    const snacks = complejo.snacks || [];
    const filas = snacks.map(s => {
      const paraLlevar = s.parallevar ?? s.paraLlevar ?? s['para llevar'] ?? null;
      return `
        <tr>
          <td>${escapeHTML(s.nombre)}</td>
          <td class="${s.chica == null ? 'na' : 'precio'}">${fmt(s.chica)}</td>
          <td class="${s.mediana == null ? 'na' : 'precio'}">${fmt(s.mediana)}</td>
          <td class="${s.grande == null ? 'na' : 'precio'}">${fmt(s.grande)}</td>
          <td class="${s.jumbo == null ? 'na' : 'precio'}">${fmt(s.jumbo)}</td>
          <td class="${paraLlevar == null ? 'na' : 'precio'}">${fmt(paraLlevar)}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="table-block">
        <h3><span>★</span> Dulcero / Snacks</h3>
        <div class="table-scroll">
          <table class="precios-table snacks-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Chica</th>
                <th>Mediana</th>
                <th>Grande</th>
                <th>Jumbo</th>
                <th>Para llevar</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function flatComplejos() {
    const list = [];
    data.forEach(cadena => {
      (cadena.complejos || []).forEach(c => {
        let boletos = c.boletos || [];
        if (!Array.isArray(boletos)) boletos = [boletos];
        list.push({
          ...c,
          boletos,
          cadena: cadena.cadena,
          nombreCadena: cadena.nombreCadena,
          categoria: c.categoria || (/vip|platino/i.test(c.nombre || '') ? 'premium' : 'economico')
        });
      });
    });
    return list;
  }

  function precioBoleto(complejo, dia, { nino = false, club = false } = {}) {
    const boletos = complejo.boletos || [];
    if (club) {
      const memb = boletos.find(b => /club|tarjeta/i.test(b.label || ''));
      if (memb && memb[dia] > 0) return Number(memb[dia]);
    }
    if (nino) {
      const n = boletos.find(b => /niñ|nino/i.test(b.label || ''));
      if (n && n[dia] > 0) return Number(n[dia]);
    }
    const b2d =
      boletos.find(b => /2d/i.test(b.label || '') && !/niñ|nino/i.test(b.label || '')) ||
      boletos.find(b => !/vip|platino|club|tarjeta|macro|pluus|junior|dolby|x4d/i.test(b.label || '')) ||
      boletos[0];
    const v = b2d?.[dia];
    return v == null || v === 0 ? null : Number(v);
  }

  function snackSize(complejo, nombreRx, size) {
    const s = (complejo.snacks || []).find(x => nombreRx.test(x.nombre || ''));
    if (!s) return null;
    const v = s[size];
    return v == null ? null : Number(v);
  }

  function getSnackGrande(complejo, nombreRegex) {
    return snackSize(complejo, nombreRegex, 'grande');
  }

  function costoPersona(complejo, dia, modo = filtroModo, club = usarClub) {
    const boleto = precioBoleto(complejo, dia, { club });
    if (boleto == null) return null;
    if (modo === 'boleto') return boleto;

    const palSize = modo === 'premium' ? 'jumbo' : 'grande';
    let pal = snackSize(complejo, /palomitas/i, palSize);
    if (pal == null && modo === 'premium') pal = snackSize(complejo, /palomitas/i, 'grande');
    const ref =
      snackSize(complejo, /refresco/i, modo === 'premium' ? 'jumbo' : 'grande') ??
      snackSize(complejo, /refresco/i, 'grande');

    if (pal == null || ref == null) return null;
    return boleto + pal + ref;
  }

  function scoreComplejo(complejo) {
    if (filtroDia === 'promedio') {
      const vals = DIAS.map(d => costoPersona(complejo, d)).filter(v => v != null);
      if (!vals.length) return null;
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
    return costoPersona(complejo, filtroDia);
  }

  function mejorDiaDe(complejo) {
    let best = null;
    DIAS.forEach(d => {
      const v = costoPersona(complejo, d);
      if (v == null) return;
      if (!best || v < best.v) best = { d, v };
    });
    return best;
  }

  function filtrarLista(ids) {
    return flatComplejos()
      .filter(c => ids.includes(c.id))
      .filter(c => filtroCat === 'todos' || c.categoria === filtroCat);
  }

  function renderComparativa(ciudadKey) {
    const box = document.getElementById('comparativa-container');
    if (!box) return;

    const ciudad = CIUDADES[ciudadKey];
    if (!ciudad) {
      box.innerHTML = `<div class="error-state">Ciudad no configurada.</div>`;
      return;
    }

    let lista = flatComplejos().filter(c => ciudad.complejos.includes(c.id));
    if (filtroCat !== 'todos') lista = lista.filter(c => c.categoria === filtroCat);

    if (!lista.length) {
      box.innerHTML = `<div class="error-state">No hay complejos para esta ciudad / filtro.</div>`;
      return;
    }

    if (ciudad.modo === 'cadenas') {
      const porCadena = {};
      lista.forEach(c => {
        const prom = scoreComplejo(c);
        if (prom == null) return;
        if (!porCadena[c.cadena] || prom < porCadena[c.cadena].prom) {
          porCadena[c.cadena] = { complejo: c, prom };
        }
      });
      const filas = Object.values(porCadena).sort((a, b) => a.prom - b.prom);
      if (!filas.length) {
        box.innerHTML = `<div class="error-state">No hay datos suficientes (prueba modo “Solo boleto”).</div>`;
        return;
      }
      const mejor = filas[0];
      box.innerHTML = `
        <div class="comp-winner">
          En León, la cadena más barata es
          <strong>${escapeHTML(mejor.complejo.nombreCadena)}</strong>
          con <strong>$${mejor.prom}</strong> en ${escapeHTML(mejor.complejo.nombre)}.
        </div>
        <div class="table-block">
          <h3><span>★</span> Mejor complejo por cadena</h3>
          <div class="table-scroll">
            <table class="precios-table">
              <thead><tr><th>Cadena</th><th>Mejor complejo</th><th>Total</th></tr></thead>
              <tbody>
                ${filas.map((f, i) => `
                  <tr class="${i === 0 ? 'mejor' : ''}">
                    <td>${escapeHTML(f.complejo.nombreCadena)}</td>
                    <td>${escapeHTML(f.complejo.nombre)}</td>
                    <td class="precio">$${f.prom}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
      return;
    }

    const diasLabel = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const ranked = lista
      .map(c => ({ c, prom: scoreComplejo(c) }))
      .filter(x => x.prom != null)
      .sort((a, b) => a.prom - b.prom);
    const ganador = ranked[0];

    const filas = lista.map(c => {
      const pal = getSnackGrande(c, /palomitas/i);
      const ref = getSnackGrande(c, /refresco/i);
      const prom = scoreComplejo(c);
      const esMejor = ganador && c.id === ganador.c.id;
      return `
        <tr class="${esMejor ? 'mejor' : ''}">
          <td>
            <strong>${escapeHTML(c.nombre)}</strong><br>
            <span style="color:var(--muted-2);font-size:.72rem;">
              ${escapeHTML(c.nombreCadena)}${c.categoria === 'premium' ? ' · VIP/Platino' : ''}
            </span>
          </td>
          <td class="precio">${fmt(precioBoleto(c, 'viernes', { club: usarClub }))}</td>
          <td class="precio">${fmt(pal)}</td>
          <td class="precio">${fmt(ref)}</td>
          ${DIAS.map(d => {
            const t = costoPersona(c, d);
            return `<td class="${t == null ? 'na' : 'precio'}">${t == null ? '—' : '$' + t}</td>`;
          }).join('')}
          <td class="precio"><strong>${prom == null ? '—' : '$' + prom}</strong></td>
        </tr>`;
    }).join('');

    box.innerHTML = `
      ${ganador ? `
        <div class="comp-winner">
          En <strong>${escapeHTML(ciudad.nombre)}</strong> conviene más
          <strong>${escapeHTML(ganador.c.nombreCadena)} · ${escapeHTML(ganador.c.nombre)}</strong>
          con <strong>$${ganador.prom}</strong>.
        </div>` : ''}
      <div class="table-block">
        <h3><span>★</span> Comparativa de gasto adulto</h3>
        <div class="table-scroll">
          <table class="precios-table">
            <thead>
              <tr>
                <th>Complejo</th>
                <th>Boleto*</th>
                <th>Pal G</th>
                <th>Ref G</th>
                ${diasLabel.map(d => `<th>${d}</th>`).join('')}
                <th>Score</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        <p style="padding:12px 18px;color:var(--muted);font-size:.78rem;margin:0;">
          * Viernes (o membresía). Si ves muchos “—”, cambia el modo a “Solo boleto”.
        </p>
      </div>`;
  }

  function renderTipYTop3() {
    const tip = document.getElementById('tip-mejor-dia');
    const top3 = document.getElementById('top3-box');
    if (!tip || !top3) return;

    const ciudadKey = document.getElementById('sim-ciudad')?.value || ciudadActiva || 'sfr';
    const baseKey = ciudadKey === 'leon-cadenas' ? 'leon' : ciudadKey;
    const ids = CIUDADES[baseKey]?.complejos || CIUDADES.sfr.complejos;

    const lista = filtrarLista(ids)
      .map(c => ({ c, score: scoreComplejo(c), best: mejorDiaDe(c) }))
      .filter(x => x.score != null)
      .sort((a, b) => a.score - b.score);

    if (!lista.length) {
      tip.innerHTML = 'No hay datos suficientes para este filtro (prueba “Solo boleto”).';
      top3.innerHTML = '';
      return;
    }

    const g = lista[0];
    tip.innerHTML = g.best
      ? `Conviene <strong>${escapeHTML(g.c.nombreCadena)} · ${escapeHTML(g.c.nombre)}</strong>
         (${fmt(g.score)}). Mejor día: <strong>${DIAS_LABEL[g.best.d]}</strong> (${fmt(g.best.v)}).`
      : '';

    top3.innerHTML = `
      <h3><span>★</span> Top 3 más baratos · ${escapeHTML(CIUDADES[baseKey].nombre)}</h3>
      <div class="table-scroll">
        <table class="precios-table">
          <thead><tr><th>#</th><th>Complejo</th><th>Total</th><th>Mejor día</th></tr></thead>
          <tbody>
            ${lista.slice(0, 3).map((x, i) => `
              <tr class="${i === 0 ? 'rank-1' : ''}">
                <td>${i + 1}</td>
                <td>
                  <strong>${escapeHTML(x.c.nombre)}</strong><br>
                  <span style="color:var(--muted-2);font-size:.72rem">
                    ${escapeHTML(x.c.nombreCadena)}${x.c.zona ? ' · ' + escapeHTML(x.c.zona) : ''}
                  </span>
                </td>
                <td class="precio">${fmt(x.score)}</td>
                <td>${x.best ? DIAS_LABEL[x.best.d] + ' · ' + fmt(x.best.v) : '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderSimulador() {
    const box = document.getElementById('sim-resultados');
    if (!box) return;

    const ciudadKey = document.getElementById('sim-ciudad')?.value || 'sfr';
    const adultos = Number(document.getElementById('sim-adultos')?.value || 0);
    const ninos = Number(document.getElementById('sim-ninos')?.value || 0);
    const palOpt = document.getElementById('sim-pal')?.value || '0';
    const nRef = Number(document.getElementById('sim-ref')?.value || 0);
    const nAgua = Number(document.getElementById('sim-agua')?.value || 0);
    const dia = filtroDia === 'promedio' ? 'viernes' : filtroDia;

    const lista = filtrarLista(CIUDADES[ciudadKey]?.complejos || []);

    const filas = lista.map(c => {
      let total = 0;
      let ok = true;

      for (let i = 0; i < adultos; i++) {
        const b = precioBoleto(c, dia, { club: usarClub });
        if (b == null) { ok = false; break; }
        total += b;
      }
      for (let i = 0; i < ninos; i++) {
        const b = precioBoleto(c, dia, { nino: true }) ?? precioBoleto(c, dia, {});
        if (b == null) { ok = false; break; }
        total += b;
      }
      if (palOpt !== '0') {
        const p = snackSize(c, /palomitas/i, palOpt) ?? snackSize(c, /palomitas/i, 'grande');
        if (p == null) ok = false; else total += p;
      }
      for (let i = 0; i < nRef; i++) {
        const r = snackSize(c, /refresco/i, 'grande');
        if (r == null) ok = false; else total += r;
      }
      for (let i = 0; i < nAgua; i++) {
        const a = snackSize(c, /agua/i, 'grande') ?? snackSize(c, /agua/i, 'chica');
        if (a == null) ok = false; else total += a;
      }
      return { c, total: ok ? total : null };
    }).filter(x => x.total != null).sort((a, b) => a.total - b.total);

    if (!filas.length) {
      box.innerHTML = `<p style="padding:16px;color:var(--muted)">No se pudo calcular (faltan snacks o boletos en esos complejos).</p>`;
      return;
    }

    box.innerHTML = `
      <div class="table-scroll">
        <table class="precios-table">
          <thead>
            <tr><th>Complejo</th><th>Total (${DIAS_LABEL[dia] || dia})</th></tr>
          </thead>
          <tbody>
            ${filas.map((x, i) => `
              <tr class="${i === 0 ? 'mejor' : ''}">
                <td>${escapeHTML(x.c.nombreCadena)} · ${escapeHTML(x.c.nombre)}</td>
                <td class="precio"><strong>${fmt(x.total)}</strong></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function llenarVersusSelects() {
    const a = document.getElementById('vs-a');
    const b = document.getElementById('vs-b');
    if (!a || !b) return;
    const opts = flatComplejos().map(c =>
      `<option value="${escapeHTML(c.id)}">${escapeHTML(c.nombreCadena)} · ${escapeHTML(c.nombre)}</option>`
    ).join('');
    a.innerHTML = opts;
    b.innerHTML = opts;
    a.value = 'san-francisco';
    b.value = 'movie-center';
  }

  function renderVersus() {
    const box = document.getElementById('vs-result');
    const idA = document.getElementById('vs-a')?.value;
    const idB = document.getElementById('vs-b')?.value;
    if (!box || !idA || !idB) return;

    const all = flatComplejos();
    const A = all.find(c => c.id === idA);
    const B = all.find(c => c.id === idB);
    if (!A || !B) return;

    const sA = scoreComplejo(A);
    const sB = scoreComplejo(B);
    const diaRef = filtroDia === 'promedio' ? 'viernes' : filtroDia;
    const bA = precioBoleto(A, diaRef, { club: usarClub });
    const bB = precioBoleto(B, diaRef, { club: usarClub });
    const pA = snackSize(A, /palomitas/i, 'grande');
    const pB = snackSize(B, /palomitas/i, 'grande');
    const rA = snackSize(A, /refresco/i, 'grande');
    const rB = snackSize(B, /refresco/i, 'grande');
    const diff = sA != null && sB != null ? Math.abs(sA - sB) : null;
    const gana = sA != null && sB != null ? (sA <= sB ? A : B) : null;

    box.innerHTML = `
      <div class="table-scroll">
        <table class="precios-table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>${escapeHTML(A.nombre)}</th>
              <th>${escapeHTML(B.nombre)}</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Boleto</td><td class="precio">${fmt(bA)}</td><td class="precio">${fmt(bB)}</td></tr>
            <tr><td>Palomitas G</td><td class="precio">${fmt(pA)}</td><td class="precio">${fmt(pB)}</td></tr>
            <tr><td>Refresco G</td><td class="precio">${fmt(rA)}</td><td class="precio">${fmt(rB)}</td></tr>
            <tr class="mejor">
              <td><strong>Total</strong></td>
              <td class="precio"><strong>${fmt(sA)}</strong></td>
              <td class="precio"><strong>${fmt(sB)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      ${gana ? `<p class="tip-box" style="margin:12px 16px">
        Gana <strong>${escapeHTML(gana.nombreCadena)} · ${escapeHTML(gana.nombre)}</strong>
        ${diff != null ? `(ahorro ${fmt(diff)})` : ''}.
      </p>` : ''}`;
  }

  function simSet(a, n, pal, ref, agua) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    set('sim-adultos', a);
    set('sim-ninos', n);
    set('sim-pal', pal);
    set('sim-ref', ref);
    set('sim-agua', agua);
  }

  function bindHerramientas() {
    const on = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', fn);
    };

    on('filtro-dia', e => { filtroDia = e.target.value; refreshTools(); });
    on('filtro-modo', e => { filtroModo = e.target.value; refreshTools(); });
    on('filtro-cat', e => { filtroCat = e.target.value; refreshTools(); });
    on('usar-club', e => { usarClub = e.target.checked; refreshTools(); });

    on('sim-ciudad', () => refreshTools());
    on('sim-adultos', () => renderSimulador());
    on('sim-ninos', () => renderSimulador());
    on('sim-pal', () => renderSimulador());
    on('sim-ref', () => renderSimulador());
    on('sim-agua', () => renderSimulador());
    on('vs-a', () => renderVersus());
    on('vs-b', () => renderVersus());

    const preset = document.getElementById('sim-preset');
    if (preset) {
      preset.addEventListener('change', () => {
        const v = preset.value;
        if (v === 'solo') simSet(1, 0, 'grande', 1, 0);
        else if (v === 'pareja') simSet(2, 0, 'jumbo', 2, 0);
        else if (v === 'familia') simSet(2, 2, 'jumbo', 3, 1);
        renderSimulador();
      });
    }
  }

  function refreshTools() {
    renderTipYTop3();
    renderSimulador();
    renderVersus();
    renderComparativa(ciudadActiva);
  }

  function actualizarNotaFecha() {
    const el = document.getElementById('precios-actualizado');
    if (!el) return;
    el.textContent = metaActualizado
      ? `Precios actualizados: ${metaActualizado}. Sujetos a cambio por sucursal y promociones.`
      : 'Precios sujetos a cambio según sucursal y promociones.';
  }

  function fmt(valor) {
    if (valor == null || valor === '') return '—';
    return `$${Number(valor)}`;
  }

  function escapeHTML(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});