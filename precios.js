document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('precios-container');
  const tabs = document.getElementById('cine-tabs');
  const selectComplejo = document.getElementById('filtro-complejo');
  const complejoWrap = document.getElementById('complejo-filter-wrap');
  const ciudadTabs = document.getElementById('ciudad-tabs');

  let data = [];
  let cadenaActiva = 'cinepolis';
  let complejoActivo = null;
  let ciudadActiva = 'sfr';

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
    data = await response.json();

    // Individual
    cargarComplejos();
    render();

    // Comparativa (esto es el "punto 5")
    renderComparativa(ciudadActiva);
  } catch (error) {
    console.error(error);
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          No se pudieron cargar los precios.<br>
          Revisa que exista el archivo <strong>precios.json</strong>.
        </div>`;
    }
  }

  // ===== Tabs de cadena =====
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

  // ===== Select de complejo =====
  if (selectComplejo) {
    selectComplejo.addEventListener('change', () => {
      complejoActivo = selectComplejo.value;
      render();
    });
  }

  // ===== Tabs de ciudad (comparativa) =====
  if (ciudadTabs) {
    ciudadTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.ciudad-tab');
      if (!btn) return;

      ciudadTabs.querySelectorAll('.ciudad-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      ciudadActiva = btn.dataset.ciudad;
      renderComparativa(ciudadActiva);
    });
  }

  // ===== Helpers cadena/complejo =====
  function getCadena() {
    return data.find(c => c.cadena === cadenaActiva);
  }

  function getComplejo() {
    const cadena = getCadena();
    if (!cadena) return null;
    return (cadena.complejos || []).find(c => c.id === complejoActivo) || cadena.complejos[0];
  }

  function cargarComplejos() {
    const cadena = getCadena();
    if (!cadena || !selectComplejo) return;

    const complejos = cadena.complejos || [];

    if (complejos.length <= 1) {
      complejoWrap?.classList.add('hidden');
    } else {
      complejoWrap?.classList.remove('hidden');
    }

    selectComplejo.innerHTML = complejos
      .map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.nombre)}</option>`)
      .join('');

    complejoActivo = complejos[0]?.id || null;
    selectComplejo.value = complejoActivo;
  }

  function render() {
    const cadena = getCadena();
    const complejo = getComplejo();

    if (!cadena || !complejo) {
      container.innerHTML = `<div class="error-state">No hay datos para este complejo.</div>`;
      return;
    }

    container.innerHTML = `
      <section class="cine-section active">
        <div class="cine-header">
          <h2>${escapeHTML(cadena.nombreCadena)} — ${escapeHTML(complejo.nombre)}</h2>
          <span class="ubicacion">Precios de referencia</span>
        </div>
        ${tablaBoletos(complejo)}
        ${tablaSnacks(complejo)}
        ${bloqueCompraTipica(complejo)}
      </section>
    `;
  }

  // ===== Tablas individuales =====
  function tablaBoletos(complejo) {
    let boletos = complejo.boletos || [];
    if (!Array.isArray(boletos)) boletos = [boletos];

    const diasKeys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const diasLabel = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const filas = boletos.map(b => `
      <tr>
        <td>${escapeHTML(b.label || 'Boleto')}</td>
        ${diasKeys.map(dia => {
          const p = b[dia];
          return `<td class="${p == null ? 'na' : 'precio'}">${fmt(p)}</td>`;
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

  function bloqueCompraTipica(complejo) {
    let boletos = complejo.boletos || [];
    if (!Array.isArray(boletos)) boletos = [boletos];
    const boletoBase = boletos.find(b => /2d/i.test(b.label || '')) || boletos[0] || {};

    const snacks = complejo.snacks || [];
    const palomitas = snacks.find(s => /palomitas/i.test(s.nombre || ''));
    const refresco = snacks.find(s => /refresco/i.test(s.nombre || ''));

    const precioPalomitas = palomitas?.grande ?? null;
    const precioRefresco = refresco?.grande ?? null;

    const diasKeys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const diasLabel = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const totales = diasKeys.map(dia => {
      const b = boletoBase[dia];
      if (b == null || precioPalomitas == null || precioRefresco == null) return null;
      return Number(b) + Number(precioPalomitas) + Number(precioRefresco);
    });

    const celdas = totales.map(t =>
      `<td class="${t == null ? 'na' : 'precio'}">${t == null ? '—' : '$' + t}</td>`
    ).join('');

    const detalle = [
      boletoBase.label || 'Boleto',
      precioPalomitas != null ? `Palomitas grande ($${precioPalomitas})` : null,
      precioRefresco != null ? `Refresco grande ($${precioRefresco})` : null
    ].filter(Boolean).join(' + ');

    return `
      <div class="table-block compra-tipica">
        <h3><span>★</span> Compra típica (1 persona)</h3>
        <p class="compra-tipica-detalle">${escapeHTML(detalle)}</p>
        <div class="table-scroll">
          <table class="precios-table">
            <thead>
              <tr>
                <th>Total estimado</th>
                ${diasLabel.map(d => `<th>${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Boleto + Palomitas G + Refresco G</td>
                ${celdas}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ===== Comparativa =====
  function flatComplejos() {
    const list = [];
    data.forEach(cadena => {
      (cadena.complejos || []).forEach(c => {
        list.push({
          ...c,
          cadena: cadena.cadena,
          nombreCadena: cadena.nombreCadena
        });
      });
    });
    return list;
  }

  function getBoleto2D(complejo) {
    let boletos = complejo.boletos || [];
    if (!Array.isArray(boletos)) boletos = [boletos];

    return boletos.find(b => /2d/i.test(b.label || '') && /general/i.test(b.label || ''))
      || boletos.find(b => /2d/i.test(b.label || ''))
      || boletos[0]
      || null;
  }

  function getSnackGrande(complejo, nombreRegex) {
    const snacks = complejo.snacks || [];
    const item = snacks.find(s => nombreRegex.test(s.nombre || ''));
    return item?.grande ?? null;
  }

  function totalDia(complejo, dia) {
    const boleto = getBoleto2D(complejo);
    const b = boleto?.[dia];
    const pal = getSnackGrande(complejo, /palomitas/i);
    const ref = getSnackGrande(complejo, /refresco/i);
    if (b == null || pal == null || ref == null) return null;
    return Number(b) + Number(pal) + Number(ref);
  }

  function promedioSemana(complejo) {
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const vals = dias.map(d => totalDia(complejo, d)).filter(v => v != null);
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  function renderComparativa(ciudadKey) {
    const box = document.getElementById('comparativa-container');
    if (!box) return;

    const ciudad = CIUDADES[ciudadKey];
    if (!ciudad) {
      box.innerHTML = `<div class="error-state">Ciudad no configurada.</div>`;
      return;
    }

    const todos = flatComplejos();
    const lista = todos.filter(c => ciudad.complejos.includes(c.id));

    if (!lista.length) {
      box.innerHTML = `<div class="error-state">No hay complejos para esta ciudad.</div>`;
      return;
    }

    // Modo: mejor por cadena
    if (ciudad.modo === 'cadenas') {
      const porCadena = {};
      lista.forEach(c => {
        const prom = promedioSemana(c);
        if (prom == null) return;
        if (!porCadena[c.cadena] || prom < porCadena[c.cadena].prom) {
          porCadena[c.cadena] = { complejo: c, prom };
        }
      });

      const filas = Object.values(porCadena).sort((a, b) => a.prom - b.prom);
      if (!filas.length) {
        box.innerHTML = `<div class="error-state">No hay datos suficientes para comparar cadenas.</div>`;
        return;
      }

      const mejor = filas[0];

      box.innerHTML = `
        <div class="comp-winner">
          En León, la cadena más barata (promedio semanal) es
          <strong>${escapeHTML(mejor.complejo.nombreCadena)}</strong>
          con <strong>$${mejor.prom}</strong>
          en ${escapeHTML(mejor.complejo.nombre)}.
        </div>
        <div class="table-block">
          <h3><span>★</span> Mejor complejo por cadena</h3>
          <div class="table-scroll">
            <table class="precios-table comp-table">
              <thead>
                <tr>
                  <th>Cadena</th>
                  <th>Mejor complejo</th>
                  <th>Promedio / día</th>
                </tr>
              </thead>
              <tbody>
                ${filas.map((f, i) => `
                  <tr class="${i === 0 ? 'mejor' : ''}">
                    <td>${escapeHTML(f.complejo.nombreCadena)}</td>
                    <td>${escapeHTML(f.complejo.nombre)}</td>
                    <td class="precio">$${f.prom}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
      return;
    }

    // Comparativa normal
    const diasKeys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const diasLabel = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const ranked = lista
      .map(c => ({ c, prom: promedioSemana(c) }))
      .filter(x => x.prom != null)
      .sort((a, b) => a.prom - b.prom);

    const ganador = ranked[0];

    const filas = lista.map(c => {
      const boleto = getBoleto2D(c);
      const pal = getSnackGrande(c, /palomitas/i);
      const ref = getSnackGrande(c, /refresco/i);
      const prom = promedioSemana(c);
      const esMejor = ganador && c.id === ganador.c.id;

      return `
        <tr class="${esMejor ? 'mejor' : ''}">
          <td>
            <strong>${escapeHTML(c.nombre)}</strong><br>
            <span style="color:var(--muted-2);font-size:.72rem;">${escapeHTML(c.nombreCadena)}</span>
          </td>
          <td class="precio">${fmt(boleto?.viernes)}</td>
          <td class="precio">${fmt(pal)}</td>
          <td class="precio">${fmt(ref)}</td>
          ${diasKeys.map(d => {
            const t = totalDia(c, d);
            return `<td class="${t == null ? 'na' : 'precio'}">${t == null ? '—' : '$' + t}</td>`;
          }).join('')}
          <td class="precio"><strong>${prom == null ? '—' : '$' + prom}</strong></td>
        </tr>
      `;
    }).join('');

    box.innerHTML = `
      ${ganador ? `
        <div class="comp-winner">
          En <strong>${escapeHTML(ciudad.nombre)}</strong> conviene más
          <strong>${escapeHTML(ganador.c.nombreCadena)} · ${escapeHTML(ganador.c.nombre)}</strong>
          con un promedio de <strong>$${ganador.prom}</strong>
          (boleto 2D + palomitas G + refresco G).
        </div>
      ` : ''}

      <div class="table-block">
        <h3><span>★</span> Comparativa de gasto adulto</h3>
        <div class="table-scroll">
          <table class="precios-table comp-table">
            <thead>
              <tr>
                <th>Complejo</th>
                <th>Boleto 2D*</th>
                <th>Palomitas G</th>
                <th>Refresco G</th>
                ${diasLabel.map(d => `<th>${d}</th>`).join('')}
                <th>Prom.</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        <p style="padding:12px 18px;color:var(--muted);font-size:.78rem;margin:0;">
          * Precio de referencia del viernes para el boleto 2D. El total diario usa el boleto de cada día.
        </p>
      </div>
    `;
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