document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('resenas.json');
        if (!response.ok) throw new Error('No se pudo cargar resenas.json');

        let resenas = await response.json();

        // Ordenar por fecha (más reciente primero) si tienes el campo "fecha"
        // resenas = resenas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        const destacada = resenas.find(r => r.destacada);
        const secundarias = resenas.filter(r => !r.destacada);
        const total = resenas.length;

        // === Actualizar subtítulo ===
        const subtitle = document.getElementById('reviews-subtitle');
        if (subtitle) {
            if (total === 1) {
                subtitle.innerHTML = `Una película.<br>Una opinión sin vueltas.`;
            } else if (total === 2) {
                subtitle.innerHTML = `Dos películas. Dos mundos.<br>Una opinión sin vueltas.`;
            } else {
                subtitle.innerHTML = `${numeroATexto(total)} películas. ${numeroATexto(total)} mundos.<br>Una opinión sin vueltas.`;
            }
        }

        // === Actualizar Hero ===
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
            const enlace = `review.html?id=${destacada.id}`;

            featuredContainer.innerHTML = `
                <article class="featured-review">
                    <div class="featured-image">
                        <div class="image-overlay"></div>
                        <img
                            src="${destacada.poster}"
                            alt="Póster de ${destacada.titulo}"
                            loading="eager"
                            onerror="this.style.display='none'; this.parentElement.classList.add('poster-placeholder');"
                        >
                        <div class="poster-fallback">
                            <span>${destacada.posterFallback?.linea1 || destacada.titulo}</span>
                            <strong>${destacada.posterFallback?.linea2 || ''}</strong>
                            <small>IMAGEN DEL PÓSTER</small>
                        </div>
                        <span class="review-tag">${destacada.etiqueta || 'RESEÑA'}</span>
                        <div class="featured-score">
                            <span>★</span>
                            <strong>${destacada.puntaje}</strong>
                            <small>/ 5</small>
                        </div>
                    </div>

                    <div class="featured-content">
                        <div class="movie-meta">
                            <span>${destacada.anio}</span>
                            ${destacada.generos.map(g => `<i></i><span>${g}</span>`).join('')}
                        </div>

                        <h2>${destacada.titulo}</h2>
                        <p class="featured-lead">${destacada.resumen}</p>

                        <div class="review-bottom">
                            <div class="rating-display">
                                <span class="stars">${generarEstrellas(destacada.puntaje)}</span>
                                <span>${destacada.puntaje} / 5</span>
                            </div>
                            <a href="${enlace}" class="read-button">
                                Leer reseña <span>→</span>
                            </a>
                        </div>
                    </div>
                </article>
            `;
        }

        // === TARJETAS SECUNDARIAS ===
        const grid = document.getElementById('reviews-grid');
        if (grid) {
            grid.innerHTML = secundarias.map(r => {
                const enlace = `review.html?id=${r.id}`;

                return `
                    <article class="review-card">
                        <a href="${enlace}" class="card-image">
                            <img
                                src="${r.poster}"
                                alt="Póster de ${r.titulo}"
                                loading="lazy"
                                onerror="this.style.display='none'; this.parentElement.classList.add('poster-placeholder');"
                            >
                            <div class="poster-fallback">
                                <span>${r.posterFallback?.linea1 || r.titulo}</span>
                                <strong>${r.posterFallback?.linea2 || ''}</strong>
                                <small>IMAGEN DEL PÓSTER</small>
                            </div>
                            <span class="card-label">${r.etiqueta || 'RESEÑA'}</span>
                            <span class="card-score">★ ${r.puntaje}</span>
                        </a>

                        <div class="card-content">
                            <div class="movie-meta">
                                <span>${r.anio}</span>
                                ${r.generos.map(g => `<i></i><span>${g}</span>`).join('')}
                            </div>
                            <h3><a href="${enlace}">${r.titulo}</a></h3>
                            <p>${r.resumen}</p>
                            <div class="card-footer">
                                <span class="score-mini">★ ${r.puntaje}</span>
                                <a href="${enlace}">Leer reseña →</a>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
        }

    } catch (error) {
        console.error('Error cargando reseñas:', error);
        const subtitle = document.getElementById('reviews-subtitle');
        if (subtitle) {
            subtitle.textContent = 'No se pudieron cargar las reseñas.';
        }
    }
});

// Genera estrellas visuales
function generarEstrellas(puntaje) {
    const llenas = Math.floor(puntaje);
    const tieneMedia = puntaje % 1 >= 0.25;
    let html = '';

    for (let i = 1; i <= 5; i++) {
        if (i <= llenas) {
            html += '★';
        } else if (i === llenas + 1 && tieneMedia) {
            html += '<b>★</b>';
        } else {
            html += '<b>★</b>';
        }
    }
    return html;
}

// Convierte número a texto
function numeroATexto(n) {
    const numeros = {
        1: 'Una', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco',
        6: 'Seis', 7: 'Siete', 8: 'Ocho', 9: 'Nueve', 10: 'Diez'
    };
    return numeros[n] || n;
}