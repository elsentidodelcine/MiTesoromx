document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('review-container');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    container.innerHTML = `
      <div class="error-state">
        No se especificó ninguna reseña.<br>
        <a href="index.html">Volver al inicio</a>
      </div>`;
    return;
  }

  try {
    const response = await fetch('resenas.json');
    if (!response.ok) throw new Error('No se pudo cargar el JSON');

    let resenas = await response.json();

    // Ordenar por fecha (más reciente primero) para que anterior/siguiente tenga sentido
    resenas = resenas.sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
      const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
      return fechaB - fechaA;
    });

    const reseña = resenas.find(r => r.id === id);

    if (!reseña) {
      container.innerHTML = `
        <div class="error-state">
          Reseña no encontrada.<br>
          <a href="index.html">Volver al inicio</a>
        </div>`;
      return;
    }

    // === Actualizar metadatos ===
    document.title = `${reseña.titulo} (${reseña.anio}) – Reseña | Los Brujos del Cine`;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', reseña.resumen || `Reseña de ${reseña.titulo}`);
    }

    // Open Graph
    setMeta('og:title', `${reseña.titulo} (${reseña.anio}) – Los Brujos del Cine`);
    setMeta('og:description', reseña.resumen || '');
    setMeta('og:url', window.location.href);
    setMeta('og:image', reseña.poster || '');

    // === Anterior / Siguiente ===
    const index = resenas.findIndex(r => r.id === id);
    const anterior = index > 0 ? resenas[index - 1] : null;
    const siguiente = index < resenas.length - 1 ? resenas[index + 1] : null;

    const estrellas = generarEstrellas(reseña.puntaje);

    const paragrafos = (reseña.contenido || [])
      .map(p => `<p>${escapeHTML(p)}</p>`)
      .join('');

    const plataformas = (reseña.plataformas || [])
      .map(p => `<span class="platform-tag">${escapeHTML(p)}</span>`)
      .join('');

    const generos = (reseña.generos || []).join(' · ');

    container.innerHTML = `
      <section class="review-hero">
        <div class="review-hero-inner">
          <a href="index.html#resenas" class="back-link">← Volver a reseñas</a>

          <div class="review-header">
            <div class="review-poster">
              <img
                src="${escapeHTML(reseña.poster)}"
                alt="Póster de ${escapeHTML(reseña.titulo)}"
                loading="eager"
                onerror="this.style.display='none'; this.parentElement.classList.add('poster-placeholder');"
              >
            </div>

            <div class="review-info">
              <h1>${escapeHTML(reseña.titulo)}</h1>

              <div class="review-meta">
                <span class="review-rating" aria-label="${reseña.puntaje} de 5 estrellas">${estrellas}</span>
                <span class="dot" aria-hidden="true"></span>
                <span>${escapeHTML(String(reseña.anio))}</span>
                ${generos ? `<span class="dot" aria-hidden="true"></span><span>${escapeHTML(generos)}</span>` : ''}
                ${reseña.duracion ? `<span class="dot" aria-hidden="true"></span><span>${escapeHTML(reseña.duracion)}</span>` : ''}
              </div>

              ${plataformas ? `<div class="review-platforms">${plataformas}</div>` : ''}

              <div class="review-actions">
                <a href="${escapeHTML(reseña.letterboxd || 'https://boxd.it/8uSCV')}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="btn-letterboxd">
                  Ver en Letterboxd <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <article class="review-body">
        <p class="lead">${escapeHTML(reseña.lead || reseña.resumen || '')}</p>

        ${paragrafos}

        ${reseña.cita ? `
          <blockquote>“${escapeHTML(reseña.cita)}”</blockquote>
        ` : ''}

        <div class="verdict">
          <div class="verdict-header">
            <span aria-hidden="true">★</span> Veredicto
          </div>
          <p>${escapeHTML(reseña.veredicto || 'Sin veredicto todavía.')}</p>
        </div>
      </article>

      <nav class="review-nav" aria-label="Otras reseñas">
        ${anterior ? `
          <a href="review.html?id=${encodeURIComponent(anterior.id)}">
            <span class="label">← Anterior</span>
            <span class="title">${escapeHTML(anterior.titulo)}</span>
          </a>
        ` : '<div></div>'}

        ${siguiente ? `
          <a href="review.html?id=${encodeURIComponent(siguiente.id)}">
            <span class="label">Siguiente →</span>
            <span class="title">${escapeHTML(siguiente.titulo)}</span>
          </a>
        ` : ''}
      </nav>
    `;

  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <div class="error-state">
        Error al cargar la reseña.<br>
        <a href="index.html">Volver al inicio</a>
      </div>`;
  }
});

function setMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content || '');
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

function generarEstrellas(puntaje) {
  const valor = Number(puntaje) || 0;
  const llenas = Math.floor(valor);
  const decimal = valor - llenas;
  let html = '';

  for (let i = 1; i <= 5; i++) {
    if (i <= llenas) {
      html += '★';
    } else if (i === llenas + 1 && decimal >= 0.25) {
      html += '★'; // media (puedes usar ☆ o clase si quieres distinguir)
    } else {
      html += '☆';
    }
  }
  return html;
}