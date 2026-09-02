document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('estrenos-container');
  const filters = document.getElementById('estrenos-filters');
  const selectMes = document.getElementById('filtro-mes');

  let estrenos = [];
  let filtroTipo = 'todos';
  let filtroMes = 'todos';
  const POR_PAGINA = 9;
  let paginaActual = 1;
  let listaFiltrada = [];

  // Fecha de hoy (sin horas)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  try {
    const response = await fetch('estrenos.json');
    if (!response.ok) throw new Error('No se pudo cargar estrenos.json');
    estrenos = await response.json();


    // 2. Ordenar por fecha (más próximos primero)
    estrenos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // 3. Llenar el select de meses
    llenarSelectMeses();

    renderEstrenos();
  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <div class="estrenos-empty">
        No se pudieron cargar los estrenos.<br>
        Intenta de nuevo más tarde.
      </div>`;
  }

  // ===== Filtros de tipo =====
  if (filters) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      filtroTipo = btn.dataset.filter;
      paginaActual = 1;   // ← agregar
      renderEstrenos();
    });
  }

  // ===== Filtro de mes =====
  if (selectMes) {
    selectMes.addEventListener('change', () => {
      filtroMes = selectMes.value;
      paginaActual = 1;   // ← agregar
      renderEstrenos();
    });
  }

  // ===== Tipo dinámico =====
  // Si era "preventa" y ya llegó el día → se convierte en "estreno"
  function getTipoEfectivo(item) {

    return item.tipo;
  }

  // ===== Llenar opciones de mes =====
  function llenarSelectMeses() {
    if (!selectMes) return;

    const mesesUnicos = new Set();

    estrenos.forEach(item => {
      const d = new Date(item.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      mesesUnicos.add(key);
    });

    const mesesOrdenados = Array.from(mesesUnicos).sort();

    const nombresMes = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    selectMes.innerHTML = `<option value="todos">Todos los meses</option>`;

    mesesOrdenados.forEach(key => {
      const [year, month] = key.split('-');
      const nombre = `${nombresMes[parseInt(month) - 1]} ${year}`;
      selectMes.innerHTML += `<option value="${key}">${nombre}</option>`;
    });
  }

function renderEstrenos() {
  let lista = [...estrenos];

  if (filtroTipo === 'fuera') {
    // Solo las que YA NO están en cartelera
    lista = lista.filter(e =>
      e.estadoCartelera === 'fuera' || e.enCartelera === false
    );
  } else {
    // En todos los demás filtros: ocultar las que ya salieron
    lista = lista.filter(e =>
      e.estadoCartelera !== 'fuera' && e.enCartelera !== false
    );

    if (filtroTipo === 'preventa') {
      lista = lista.filter(e => getTipoEfectivo(e) === 'preventa');
    } else if (filtroTipo === 'reestreno') {
      lista = lista.filter(e => getTipoEfectivo(e) === 'reestreno');
    } else if (filtroTipo === 'estreno') {
      // Solo estrenos NUEVOS (no los que ya pasaron a "en cartelera")
      lista = lista.filter(e => {
        const tipo = getTipoEfectivo(e);
        return tipo === 'estreno' && e.estadoCartelera !== 'cartelera';
      });
    } else if (filtroTipo === 'cartelera') {
      lista = lista.filter(e => e.estadoCartelera === 'cartelera');
    }
    // filtroTipo === 'todos' → ya filtramos los "fuera", mostramos el resto
  }

  if (filtroMes !== 'todos') {
    lista = lista.filter(item => {
      const d = new Date(item.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === filtroMes;
    });
  }

  listaFiltrada = lista;
  renderPagina();
}

  function renderPagina() {
    const pagNav = document.getElementById('estrenos-pagination');
    const total = listaFiltrada.length;
    const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

    if (paginaActual > totalPaginas) paginaActual = totalPaginas;
    if (paginaActual < 1) paginaActual = 1;

    if (total === 0) {
      container.innerHTML = `
        <div class="estrenos-empty">
          No hay estrenos disponibles con estos filtros.
        </div>`;
      if (pagNav) {
        pagNav.hidden = true;
        pagNav.innerHTML = '';
      }
      return;
    }

    const inicio = (paginaActual - 1) * POR_PAGINA;
    const slice = listaFiltrada.slice(inicio, inicio + POR_PAGINA);

    container.innerHTML = `
      <div class="estrenos-grid">
        ${slice.map(crearCard).join('')}
      </div>
    `;

    renderControlesPaginacion(total, totalPaginas);
  }

  function renderControlesPaginacion(total, totalPaginas) {
    const pagNav = document.getElementById('estrenos-pagination');
    if (!pagNav) return;

    if (totalPaginas <= 1) {
      pagNav.hidden = true;
      pagNav.innerHTML = '';
      return;
    }

    pagNav.hidden = false;

    let html = '';
    html += `<button type="button" class="page-btn" data-page="prev" ${paginaActual === 1 ? 'disabled' : ''}>←</button>`;

    const windowSize = 5;
    let from = Math.max(1, paginaActual - Math.floor(windowSize / 2));
    let to = Math.min(totalPaginas, from + windowSize - 1);
    from = Math.max(1, to - windowSize + 1);

    for (let i = from; i <= to; i++) {
      html += `<button type="button" class="page-btn ${i === paginaActual ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    html += `<button type="button" class="page-btn" data-page="next" ${paginaActual === totalPaginas ? 'disabled' : ''}>→</button>`;
    html += `<div class="page-info">Página ${paginaActual} de ${totalPaginas} · ${total} estrenos</div>`;

    pagNav.innerHTML = html;

    pagNav.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.page;
        if (v === 'prev') paginaActual--;
        else if (v === 'next') paginaActual++;
        else paginaActual = Number(v);
        renderPagina();
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ===== Crear tarjeta =====
  function crearCard(item) {
    const tipo = getTipoEfectivo(item);

    const badgeClass = tipo === 'reestreno' ? 'reestreno' :
                       tipo === 'preventa' ? 'preventa' : '';

    const badgeTexto = tipo === 'reestreno' ? 'Reestreno' :
                       tipo === 'preventa' ? 'Preventa' : 'Estreno';

    const estado = etiquetaCartelera(item);
    const estadoHTML = estado
        ? `<span class="estreno-estado estreno-estado--${estado.key}">${estado.label}</span>`
        : '';

    const cinesHTML = (item.cines || [])
      .map(c => `<span class="cine-tag">${escapeHTML(c)}</span>`)
      .join('');

    const linksHTML = (item.links || [])
      .map((link, i) => {
        const clase = i === 0 ? 'btn-boletos' : 'btn-boletos secondary';
        return `
          <a href="${escapeHTML(link.url)}"
             target="_blank"
             rel="noopener noreferrer"
             class="${clase}">
            Comprar en ${escapeHTML(link.cine)}
            <span aria-hidden="true">↗</span>
          </a>
        `;
      })
      .join('');

    return `
      <article class="estreno-card">
        <div class="estreno-poster">
          <img
            src="${escapeHTML(item.poster)}"
            alt="Póster de ${escapeHTML(item.titulo)}"
            loading="lazy"
            onerror="this.src='imgs/posters/placeholder.jpg'; this.onerror=null;"
          >
         <span class="estreno-badge ${badgeClass}">${badgeTexto}</span>
         ${estadoHTML}
        </div>

        <div class="estreno-body">
          <div class="estreno-fecha">${escapeHTML(item.fechaTexto || item.fecha)}</div>
          <h2 class="estreno-titulo">${escapeHTML(item.titulo)}</h2>

          ${item.nota ? `<p style="font-size:0.82rem;color:var(--muted);margin-bottom:14px;">${escapeHTML(item.nota)}</p>` : ''}

          <div class="estreno-cines">
            ${cinesHTML}

          </div>

          <div class="estreno-links">
            ${linksHTML || '<span style="color:var(--muted);font-size:0.8rem;">Próximamente enlaces de boletos</span>'}
          </div>

          <span class="estreno-countdown">${textoContador(item.fecha)}</span>
        </div>
      </article>
    `;
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

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });

  // Cerrar al tocar un link
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
    });
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('is-open')) return;
    if (nav.contains(e.target) || toggle.contains(e.target)) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  });
});

function diasRestantes(fechaStr) {
  // fechaStr: "2026-08-29"
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaStr + 'T00:00:00');
  const diff = Math.round((f - hoy) / 86400000);
  return diff;
}

function textoContador(fechaStr) {
  const d = diasRestantes(fechaStr);
  if (d > 1) return `Faltan ${d} días`;
  if (d === 1) return 'Falta 1 día';
  if (d === 0) return 'Hoy';
  return 'Ya pasó';
}

function badgeEstreno(item) {
  const d = diasRestantes(item.fecha);
  if (d === 0) return '<span class="badge badge-hoy">Hoy se estrena</span>';
  if (d > 0) return '<span class="badge badge-preventa">Preventa</span>';
  return '<span class="badge badge-estreno">Estreno</span>';
}

function filtrarPorCadena(lista, cadena) {
  if (cadena === 'todas') return lista;
  return lista.filter(item => {
    const cines = item.cines || item.cadenas || [];
    // si es array de strings:
    if (cines.some(c => String(c).toLowerCase().includes(cadena))) return true;
    // si es array de objetos { nombre: "Cinépolis" }:
    if (cines.some(c => (c.nombre || c.cadena || '').toLowerCase().includes(cadena))) return true;
    return false;
  });
}

document.getElementById('filter-cadena')?.addEventListener('change', () => {
  renderEstrenos(); // tu función de pintado
});


function etiquetaCartelera(item) {
  if (item.tipo === 'preventa') return null;

  if (item.estadoCartelera === 'estreno') {
    return { key: 'hoy', label: 'En estreno' };
  }
  if (item.estadoCartelera === 'cartelera') {
    return { key: 'encartelera', label: 'En cartelera' };
  }
  if (item.estadoCartelera === 'fuera') {
    return { key: 'salio', label: 'Fuera de cartelera' };
  }

  // por si aún tienes enCartelera true/false en algunas
  if (item.enCartelera === true) {
    return { key: 'encartelera', label: 'En cartelera' };
  }
  if (item.enCartelera === false) {
    return { key: 'salio', label: 'Fuera de cartelera' };
  }
  return null;
}
