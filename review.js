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

    // Ordenar por fecha (más reciente primero)
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

    // === Metadatos ===
    document.title = `${reseña.titulo} (${reseña.anio}) – Reseña | Los Brujos del Cine`;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', reseña.resumen || `Reseña de ${reseña.titulo}`);
    }

    setMeta('og:title', `${reseña.titulo} (${reseña.anio}) – Los Brujos del Cine`);
    setMeta('og:description', reseña.resumen || '');
    setMeta('og:url', window.location.href);
    setMeta('og:image', reseña.poster || '');

    // === Anterior / Siguiente ===
    const index = resenas.findIndex(r => r.id === id);
    const anterior = index > 0 ? resenas[index - 1] : null;
    const siguiente = index < resenas.length - 1 ? resenas[index + 1] : null;

    // === Grimorio ===
    const grimorio = obtenerGrimorio(reseña.puntaje);
    const estrellasHTML = generarEstrellasHTML(reseña.puntaje);

    const paragrafos = (reseña.contenido || [])
      .map(p => `<p>${escapeHTML(p)}</p>`)
      .join('');

    const plataformas = (reseña.plataformas || [])
      .map(p => `<span class="platform-tag">${escapeHTML(p)}</span>`)
      .join('');

    const generos = (reseña.generos || []).join(' · ');
    const shareUrl = window.location.href;
    const shareText = `Reseña: ${reseña.titulo} (${reseña.anio}) — ${reseña.puntaje}/5\n${shareUrl}`;
    const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    // --- NUEVO ---
    function tiempoLectura(contenido) {
      const texto = Array.isArray(contenido) ? contenido.join(' ') : String(contenido || '');
      const palabras = texto.trim().split(/\s+/).filter(Boolean).length;
      const min = Math.max(1, Math.round(palabras / 200));
      return `${min} min de lectura`;
    }

    const lectura = tiempoLectura(reseña.contenido);

    const fechaTxt = reseña.fecha
      ? new Date(reseña.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
          year: 'numeric', month: 'long', day: 'numeric'
        })
      : '';

    const relacionadas = resenas
      .filter(r => r.id !== reseña.id)
      .filter(r => {
        const g1 = new Set(reseña.generos || []);
        const mismoGenero = (r.generos || []).some(g => g1.has(g));
        const notaParecida = Math.abs(Number(r.puntaje) - Number(reseña.puntaje)) <= 0.5;
        return mismoGenero || notaParecida;
      })
      .slice(0, 3);
    // --- fin nuevo ---

    container.innerHTML = `

    container.innerHTML = `
      <section class="review-hero">
        <div class="review-hero-inner">
          <a href="blog.html#resenas" class="back-link">
            ← Volver a reseñas
          </a>

          <div class="review-header">
            <div class="review-poster">
              <img
                src="${escapeHTML(reseña.poster)}"
                alt="Póster de ${escapeHTML(reseña.titulo)}"
                loading="eager"
                onerror="this.style.display='none'; this.parentElement.classList.add('poster-placeholder'); this.parentElement.innerHTML='<span>Sin póster</span>';"
              >
            </div>

            <div class="review-info">
              <h1>${escapeHTML(reseña.titulo)}</h1>

             <div class="review-meta">
               <span>${escapeHTML(String(reseña.anio))}</span>
               ${generos ? `<span class="dot" aria-hidden="true"></span><span>${escapeHTML(generos)}</span>` : ''}
               ${reseña.duracion ? `<span class="dot" aria-hidden="true"></span><span>${escapeHTML(reseña.duracion)}</span>` : ''}
               ${fechaTxt ? `<span class="dot" aria-hidden="true"></span><span>${escapeHTML(fechaTxt)}</span>` : ''}
               <span class="dot" aria-hidden="true"></span>
               <span>${escapeHTML(lectura)}</span>
             </div>

              <!-- GRIMORIO DE CALIFICACIONES -->
              <div class="grimorio-rating" aria-label="Calificación: ${reseña.puntaje} de 5 – ${grimorio.titulo}">
                <div class="grimorio-top">
                  <div class="grimorio-score">
                    ${escapeHTML(String(reseña.puntaje))}<small> / 5</small>
                  </div>
                  <div class="grimorio-stars" aria-hidden="true">
                    ${estrellasHTML}
                  </div>
                </div>
                <div class="grimorio-title">${escapeHTML(grimorio.titulo)}</div>
                <p class="grimorio-desc">${escapeHTML(grimorio.descripcion)}</p>
              </div>

              ${plataformas ? `<div class="review-platforms">${plataformas}</div>` : ''}

              <div class="review-actions">
                <a href="${escapeHTML(reseña.letterboxd || 'https://boxd.it/8uSCV')}"
                   target="_blank" rel="noopener noreferrer" class="btn-letterboxd">
                  Ver en Letterboxd <span aria-hidden="true">↗</span>
                </a>
                <a href="${escapeHTML(waLink)}"
                   target="_blank" rel="noopener noreferrer" class="btn-share-wa">
                  Compartir en WhatsApp
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
          <blockquote>${escapeHTML(reseña.cita)}</blockquote>
        ` : ''}

        <div class="verdict">
          <div class="verdict-header">
            <span aria-hidden="true">★</span>
            Veredicto
          </div>
          <p>${escapeHTML(reseña.veredicto || 'Sin veredicto todavía.')}</p>
        </div>
      </article>

      <aside class="donde-barato">
        <h3>¿Dónde verla más barato?</h3>
        <p>
          Compara boletos y dulcero en
          <a href="precios.html">Precios de cine</a>
          (San Francisco del Rincón y León).
        </p>
      </aside>

      ${relacionadas.length ? `
      <section class="related-reviews">
        <h3>También en el grimorio</h3>
        <div class="related-grid">
          ${relacionadas.map(r => `
            <a class="related-card" href="review.html?id=${encodeURIComponent(r.id)}">
              <img src="${escapeHTML(r.poster || '')}" alt="" loading="lazy"
                   onerror="this.style.visibility='hidden'">
              <span class="related-title">${escapeHTML(r.titulo)}</span>
              <small>${escapeHTML(String(r.puntaje))}/5</small>
            </a>
          `).join('')}
        </div>
      </section>
      ` : ''}

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

/* ========== HELPERS ========== */

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

/* ========== GRIMORIO DE CALIFICACIONES ========== */
function obtenerGrimorio(puntaje) {
  const valor = Number(puntaje) || 0;

  // Normalizamos a pasos de 0.5
  const key = Math.round(valor * 2) / 2;

  const grimorio = {
    0.5: {
      titulo: "HECHIZO FALLIDO",
      descripcion: "Se ve por morbo, no por gusto. Al final queda la culpa… y el coraje."
    },
    1.0: {
      titulo: "MAL AUGURIO",
      descripcion: "Nada funciona. Cada minuto duele y terminarla es más mérito del espectador que de la película."
    },
    1.5: {
      titulo: "BRUJERÍA OSCURA",
      descripcion: "Un desastre anunciado. No entretiene, no sorprende y solo deja arrepentimiento."
    },
    2.0: {
      titulo: "CONJURO MAL EJECUTADO",
      descripcion: "Tiene ideas, pero todo sale mal. Aburre, se siente torpe o se desinfla rápido."
    },
    2.5: {
      titulo: "NEUTRAL, PERO OLVIDABLE",
      descripcion: "Cumple lo básico y ya. No molesta, pero tampoco se queda contigo."
    },
    3.0: {
      titulo: "PALOMERA RITUAL",
      descripcion: "Funciona mientras dura. Ideal para apagar el cerebro y dejarla pasar."
    },
    3.5: {
      titulo: "BUEN EMBRUJO",
      descripcion: "Entretenida y con momentos sólidos. Le falta fuerza para trascender, pero se disfruta."
    },
    4.0: {
      titulo: "HECHIZO BIEN LOGRADO",
      descripcion: "Bien hecha, efectiva y cumplidora. Sales satisfecho y el boleto lo vale."
    },
    4.5: {
      titulo: "MAGIA MAYOR",
      descripcion: "Destaca, conecta y se queda en la memoria. Muy fácil de recomendar."
    },
    5.0: {
      titulo: "CINE LEGENDARIO",
      descripcion: "Pura magia. De esas que justifican amar el cine y querer volver a verla."
    }
  };

  return grimorio[key] || {
    titulo: "SIN CLASIFICAR",
    descripcion: "Esta película aún no tiene un hechizo asignado en el grimorio."
  };
}

/* Estrellas con media estrella real */
function generarEstrellasHTML(puntaje) {
  const valor = Number(puntaje) || 0;
  const llenas = Math.floor(valor);
  const tieneMedia = (valor - llenas) >= 0.25 && (valor - llenas) < 0.75;
  const redondeaArriba = (valor - llenas) >= 0.75;

  let html = '';

  for (let i = 1; i <= 5; i++) {
    if (i <= llenas || (i === llenas + 1 && redondeaArriba)) {
      html += '<span>★</span>';
    } else if (i === llenas + 1 && tieneMedia) {
      html += '<span class="half">★</span>';
    } else {
      html += '<span class="empty">★</span>';
    }
  }

  return html;
}

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