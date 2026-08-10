document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('estrenos-container');
  const filters = document.getElementById('estrenos-filters');
  const selectMes = document.getElementById('filtro-mes');

  let estrenos = [];
  let filtroTipo = 'todos';
  let filtroMes = 'todos';

  // Fecha de hoy (sin horas)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  try {
    const response = await fetch('estrenos.json');
    if (!response.ok) throw new Error('No se pudo cargar estrenos.json');
    estrenos = await response.json();

    // 1. Filtrar solo los que aún no han pasado (hoy y futuros)
    estrenos = estrenos.filter(item => {
      const fechaItem = new Date(item.fecha);
      fechaItem.setHours(0, 0, 0, 0);
      return fechaItem >= hoy;
    });

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
      renderEstrenos();
    });
  }

  // ===== Filtro de mes =====
  if (selectMes) {
    selectMes.addEventListener('change', () => {
      filtroMes = selectMes.value;
      renderEstrenos();
    });
  }

  // ===== Tipo dinámico =====
  // Si era "preventa" y ya llegó el día → se convierte en "estreno"
  function getTipoEfectivo(item) {
    const fechaItem = new Date(item.fecha);
    fechaItem.setHours(0, 0, 0, 0);

    if (item.tipo === 'preventa' && fechaItem <= hoy) {
      return 'estreno';
    }
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

  // ===== Render principal =====
  function renderEstrenos() {
    let lista = [...estrenos];

    // Filtro por tipo (usando tipo efectivo)
    if (filtroTipo !== 'todos') {
      lista = lista.filter(e => getTipoEfectivo(e) === filtroTipo);
    }

    // Filtro por mes
    if (filtroMes !== 'todos') {
      lista = lista.filter(item => {
        const d = new Date(item.fecha);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === filtroMes;
      });
    }

    if (lista.length === 0) {
      container.innerHTML = `
        <div class="estrenos-empty">
          No hay estrenos disponibles con estos filtros.
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="estrenos-grid">
        ${lista.map(crearCard).join('')}
      </div>
    `;
  }

  // ===== Crear tarjeta =====
  function crearCard(item) {
    const tipo = getTipoEfectivo(item);

    const badgeClass = tipo === 'reestreno' ? 'reestreno' :
                       tipo === 'preventa' ? 'preventa' : '';

    const badgeTexto = tipo === 'reestreno' ? 'Reestreno' :
                       tipo === 'preventa' ? 'Preventa' : 'Estreno';

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