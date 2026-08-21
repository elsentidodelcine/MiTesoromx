document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('resenas.json');
    if (!response.ok) throw new Error('No se pudo cargar resenas.json');

    let resenas = await response.json();

    let todasResenas = resenas; // guarda la lista completa
    llenarGeneros(todasResenas);

    function pintar() {
      const filtradas = aplicarFiltros(todasResenas);
      // aquí usas filtradas para destacada + grid
      // en cada card agrega:
      // <div class="reading-time">${tiempoLectura(r.contenido)}</div>
    }

    ['review-search', 'filter-genero', 'filter-puntaje', 'filter-orden'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', pintar);
      document.getElementById(id)?.addEventListener('change', pintar);
    });

    pintar();

    // Ordenar por fecha (más reciente primero)
    resenas = resenas.sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
      const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
      return fechaB - fechaA;
    });

    const destacada = resenas.find(r => r.destacada) || resenas[0];
    const secundarias = resenas.filter(r => r !== destacada);
    const total = resenas.length;

    // === Subtítulo ===
    const subtitle = document.getElementById('reviews-subtitle');
    if (subtitle) {
      if (total === 0) {
        subtitle.textContent = 'Aún no hay reseñas publicadas.';
      } else if (total === 1) {
        subtitle.innerHTML = `Una película.<br>Una opinión sin vueltas.`;
      } else if (total === 2) {
        subtitle.innerHTML = `Dos películas. Dos mundos.<br>Una opinión sin vueltas.`;
      } else {
        subtitle.innerHTML = `${numeroATexto(total)} películas. ${numeroATexto(total)} mundos.<br>Una opinión sin vueltas.`;
      }
    }

    // === Hero stats ===
    const heroCount = document.getElementById('hero-count');
    const heroLabel = document.getElementById('hero-label');
    if (heroCount) heroCount.textContent = total.toString().padStart(2, '0');
    if (heroLabel) {
      heroLabel.textContent = total === 1 ? 'Reseña publicada' : 'Reseñas publicadas';
    }

    // === RESEÑA DESTACADA ===
    const featuredContainer = document.getElementById('featured-review-container');
    if (destacada && featuredContainer) {
      const enlace = `review.html?id=${encodeURIComponent(destacada.id)}`;
      const grimorio = obtenerGrimorio(destacada.puntaje);
      const estrellas = generarEstrellasHTML(destacada.puntaje);

      const generosHTML = (destacada.generos || [])
        .map(g => `<span class="meta-dot" aria-hidden="true"></span><span>${escapeHTML(g)}</span>`)
        .join('');

      featuredContainer.innerHTML = `
        <article class="featured-review">
          <div class="featured-image">
            <div class="image-overlay"></div>
            <img
              src="${escapeHTML(destacada.poster)}"
              alt="Póster de ${escapeHTML(destacada.titulo)}"
              loading="eager"
              onerror="this.onerror=null; this.style.display='none'; this.closest('.featured-image')?.classList.add('poster-placeholder');"
            >
            <div class="poster-fallback">
              <span>${escapeHTML(destacada.posterFallback?.linea1 || destacada.titulo)}</span>
              <strong>${escapeHTML(destacada.posterFallback?.linea2 || '')}</strong>
              <small>IMAGEN DEL PÓSTER</small>
            </div>
            <span class="review-tag">${escapeHTML(destacada.etiqueta || 'RESEÑA')}</span>

            <div class="featured-score">
              <div class="score-number">
                ${escapeHTML(String(destacada.puntaje))}<small>/5</small>
              </div>
              <div class="score-stars" aria-hidden="true">${estrellas}</div>
            </div>
          </div>

          <div class="featured-content">
            <div class="movie-meta">
              <span>${escapeHTML(String(destacada.anio))}</span>
              ${generosHTML}
            </div>

            <h2>
              <a href="${enlace}">${escapeHTML(destacada.titulo)}</a>
            </h2>

            <div class="grimorio-badge">
              <span class="grimorio-badge-title">${escapeHTML(grimorio.titulo)}</span>
              <span class="grimorio-badge-desc">${escapeHTML(grimorio.descripcion)}</span>
            </div>

            <p class="featured-lead">${escapeHTML(destacada.resumen)}</p>

            <div class="review-bottom">
              <div class="rating-display">
                <span class="stars" aria-label="${destacada.puntaje} de 5 estrellas">${estrellas}</span>
                <span class="rating-number">${escapeHTML(String(destacada.puntaje))} / 5</span>
              </div>
              <a href="${enlace}" class="read-button">
                Leer reseña
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </article>
      `;
    }

    // === TARJETAS SECUNDARIAS ===
    const grid = document.getElementById('reviews-grid');
    if (grid) {
      if (secundarias.length === 0) {
        grid.innerHTML = '';
      } else {
        grid.innerHTML = secundarias.map(r => {
          const enlace = `review.html?id=${encodeURIComponent(r.id)}`;
          const grimorio = obtenerGrimorio(r.puntaje);
          const estrellas = generarEstrellasHTML(r.puntaje);

          const generosHTML = (r.generos || [])
            .map(g => `<span class="meta-dot" aria-hidden="true"></span><span>${escapeHTML(g)}</span>`)
            .join('');

          return `
            <article class="review-card">
              <a href="${enlace}" class="card-image" aria-label="Leer reseña de ${escapeHTML(r.titulo)}">
                <img
                  src="${escapeHTML(r.poster)}"
                  alt="Póster de ${escapeHTML(r.titulo)}"
                  loading="lazy"
                  onerror="this.onerror=null; this.style.display='none'; this.closest('.card-image')?.classList.add('poster-placeholder');"
                >
                <div class="poster-fallback">
                  <span>${escapeHTML(r.posterFallback?.linea1 || r.titulo)}</span>
                  <strong>${escapeHTML(r.posterFallback?.linea2 || '')}</strong>
                  <small>IMAGEN DEL PÓSTER</small>
                </div>
                <span class="card-label">${escapeHTML(r.etiqueta || 'RESEÑA')}</span>
                <span class="card-score">★ ${escapeHTML(String(r.puntaje))}</span>
              </a>

              <div class="card-content">
                <div class="movie-meta">
                  <span>${escapeHTML(String(r.anio))}</span>
                  ${generosHTML}
                </div>

                <h3>
                  <a href="${enlace}">${escapeHTML(r.titulo)}</a>
                </h3>

                <div class="card-grimorio">
                  <span class="card-grimorio-title">${escapeHTML(grimorio.titulo)}</span>
                </div>

                <p>${escapeHTML(r.resumen)}</p>

                <div class="card-footer">
                  <div class="card-rating">
                    <span class="stars" aria-hidden="true">${estrellas}</span>
                    <span>${escapeHTML(String(r.puntaje))}</span>
                  </div>
                  <a href="${enlace}">Leer reseña →</a>
                </div>
              </div>
            </article>
          `;
        }).join('');
      }
    }

  } catch (error) {
    console.error('Error cargando reseñas:', error);
    const subtitle = document.getElementById('reviews-subtitle');
    if (subtitle) {
      subtitle.textContent = 'No se pudieron cargar las reseñas.';
    }
  }
});

/* ========== HELPERS ========== */

function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function numeroATexto(n) {
  const numeros = {
    1: 'Una', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco',
    6: 'Seis', 7: 'Siete', 8: 'Ocho', 9: 'Nueve', 10: 'Diez',
    11: 'Once', 12: 'Doce', 13: 'Trece', 14: 'Catorce', 15: 'Quince'
  };
  return numeros[n] || n.toString();
}

/* ========== GRIMORIO DE CALIFICACIONES ========== */
function obtenerGrimorio(puntaje) {
  const valor = Number(puntaje) || 0;
  const key = Math.round(valor * 2) / 2; // normaliza a pasos de 0.5

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
  const decimal = valor - llenas;

  let html = '';

  for (let i = 1; i <= 5; i++) {
    if (i <= llenas) {
      html += '<span class="star-full">★</span>';
    } else if (i === llenas + 1 && decimal >= 0.25 && decimal < 0.75) {
      html += '<span class="star-half">★</span>';
    } else if (i === llenas + 1 && decimal >= 0.75) {
      html += '<span class="star-full">★</span>';
    } else {
      html += '<span class="star-empty">★</span>';
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

// Helpers
function tiempoLectura(contenido) {
  const texto = Array.isArray(contenido) ? contenido.join(' ') : String(contenido || '');
  const palabras = texto.trim().split(/\s+/).filter(Boolean).length;
  const min = Math.max(1, Math.round(palabras / 200));
  return `${min} min de lectura`;
}

function llenarGeneros(resenas) {
  const sel = document.getElementById('filter-genero');
  if (!sel) return;
  const set = new Set();
  resenas.forEach(r => (r.generos || []).forEach(g => set.add(g)));
  [...set].sort().forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    sel.appendChild(opt);
  });
}

function aplicarFiltros(resenas) {
  const q = (document.getElementById('review-search')?.value || '').trim().toLowerCase();
  const gen = document.getElementById('filter-genero')?.value || 'todos';
  const minP = document.getElementById('filter-puntaje')?.value || 'todos';
  const orden = document.getElementById('filter-orden')?.value || 'fecha';

  let list = resenas.filter(r => {
    const okQ = !q || (r.titulo || '').toLowerCase().includes(q);
    const okG = gen === 'todos' || (r.generos || []).includes(gen);
    const okP = minP === 'todos' || Number(r.puntaje) >= Number(minP);
    return okQ && okG && okP;
  });

  list = list.slice().sort((a, b) => {
    if (orden === 'puntaje') return Number(b.puntaje) - Number(a.puntaje);
    if (orden === 'titulo') return (a.titulo || '').localeCompare(b.titulo || '', 'es');
    const fa = a.fecha ? new Date(a.fecha) : new Date(0);
    const fb = b.fecha ? new Date(b.fecha) : new Date(0);
    return fb - fa;
  });

  return list;
}


(function () {
  const KEY = 'lbdc-theme';
  const root = document.documentElement;
  const btn = () => document.getElementById('theme-toggle');

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch (_) {}
    const b = btn();
    if (b) {
      b.setAttribute(
        'aria-label',
        theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'
      );
    }
  }

  // Preferencia guardada o sistema
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (_) {}
  if (saved === 'light' || saved === 'dark') {
    apply(saved);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    apply('light');
  } else {
    apply('dark');
  }

  document.addEventListener('DOMContentLoaded', () => {
    btn()?.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      apply(next);
    });
  });
})();