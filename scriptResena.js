document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('resenas.json');
    if (!response.ok) throw new Error('No se pudo cargar resenas.json');

    let resenas = await response.json();

    // Ordenar por fecha (más reciente primero)
    resenas = resenas.sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
      const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
      return fechaB - fechaA;
    });

    // Fallback: si no hay destacada, usamos la primera
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

    // === Hero ===
    const heroCount = document.getElementById('hero-count');
    const heroLabel = document.getElementById('hero-label');

    if (heroCount) {
      heroCount.textContent = total.toString().padStart(2, '0');
    }
    if (heroLabel) {
      heroLabel.textContent = total === 1 ? 'Reseña publicada' : 'Reseñas publicadas';
    }

    // === RESEÑA DESTACADA ===
    const featuredContainer = document.getElementById('featured-review-container');

    if (destacada && featuredContainer) {
      const enlace = `review.html?id=${encodeURIComponent(destacada.id)}`;
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
              onerror="this.style.display='none'; this.parentElement.classList.add('poster-placeholder');"
            >
            <div class="poster-fallback">
              <span>${escapeHTML(destacada.posterFallback?.linea1 || destacada.titulo)}</span>
              <strong>${escapeHTML(destacada.posterFallback?.linea2 || '')}</strong>
              <small>IMAGEN DEL PÓSTER</small>
            </div>
            <span class="review-tag">${escapeHTML(destacada.etiqueta || 'RESEÑA')}</span>
            <div class="featured-score">
              <span aria-hidden="true">★</span>
              <strong>${escapeHTML(String(destacada.puntaje))}</strong>
              <small>/ 5</small>
            </div>
          </div>

          <div class="featured-content">
            <div class="movie-meta">
              <span>${escapeHTML(String(destacada.anio))}</span>
              ${generosHTML}
            </div>

            <h2>${escapeHTML(destacada.titulo)}</h2>
            <p class="featured-lead">${escapeHTML(destacada.resumen)}</p>

            <div class="review-bottom">
              <div class="rating-display">
                <span class="stars" aria-label="${destacada.puntaje} de 5 estrellas">${generarEstrellas(destacada.puntaje)}</span>
                <span>${escapeHTML(String(destacada.puntaje))} / 5</span>
              </div>
              <a href="${enlace}" class="read-button">
                Leer reseña <span aria-hidden="true">→</span>
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
                  onerror="this.style.display='none'; this.parentElement.classList.add('poster-placeholder');"
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
                <h3><a href="${enlace}">${escapeHTML(r.titulo)}</a></h3>
                <p>${escapeHTML(r.resumen)}</p>
                <div class="card-footer">
                  <span class="score-mini">★ ${escapeHTML(String(r.puntaje))}</span>
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

// Escapar HTML para evitar XSS
function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Estrellas visuales corregidas
function generarEstrellas(puntaje) {
  const valor = Number(puntaje) || 0;
  const llenas = Math.floor(valor);
  const decimal = valor - llenas;
  let html = '';

  for (let i = 1; i <= 5; i++) {
    if (i <= llenas) {
      html += '★';
    } else if (i === llenas + 1 && decimal >= 0.25) {
      // Media estrella (puedes cambiar por ★ a medias si quieres)
      html += '<span class="star-half">★</span>';
    } else {
      html += '<b>★</b>';
    }
  }
  return html;
}

// Número a texto
function numeroATexto(n) {
  const numeros = {
    1: 'Una', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco',
    6: 'Seis', 7: 'Siete', 8: 'Ocho', 9: 'Nueve', 10: 'Diez',
    11: 'Once', 12: 'Doce', 13: 'Trece', 14: 'Catorce', 15: 'Quince'
  };
  return numeros[n] || n.toString();
}