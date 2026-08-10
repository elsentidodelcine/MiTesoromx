document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('estrenos-container');
  const filters = document.getElementById('estrenos-filters');

  let estrenos = [];
  let filtroActual = 'todos';

  try {
    const response = await fetch('estrenos.json');
    if (!response.ok) throw new Error('No se pudo cargar estrenos.json');
    estrenos = await response.json();

    // Ordenar por fecha (más próximos primero)
    estrenos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    renderEstrenos();
  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <div class="estrenos-empty">
        No se pudieron cargar los estrenos.<br>
        Intenta de nuevo más tarde.
      </div>`;
  }

  // Filtros
  if (filters) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      filtroActual = btn.dataset.filter;
      renderEstrenos();
    });
  }

  function renderEstrenos() {
    let lista = estrenos;

    if (filtroActual !== 'todos') {
      lista = estrenos.filter(e => e.tipo === filtroActual);
    }

    if (lista.length === 0) {
      container.innerHTML = `
        <div class="estrenos-empty">
          No hay ${filtroActual === 'todos' ? 'estrenos' : filtroActual + 's'} disponibles por el momento.
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="estrenos-grid">
        ${lista.map(crearCard).join('')}
      </div>
    `;
  }

  function crearCard(item) {
    const badgeClass = item.tipo === 'reestreno' ? 'reestreno' :
                       item.tipo === 'preventa' ? 'preventa' : '';

    const badgeTexto = item.tipo === 'reestreno' ? 'Reestreno' :
                       item.tipo === 'preventa' ? 'Preventa' : 'Estreno';

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