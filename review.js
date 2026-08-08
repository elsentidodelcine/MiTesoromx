document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('review-container');
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        container.innerHTML = `<div class="error-state">No se especificó ninguna reseña.</div>`;
        return;
    }

    try {
        const response = await fetch('resenas.json');
        if (!response.ok) throw new Error('No se pudo cargar el JSON');

        const resenas = await response.json();
        const reseña = resenas.find(r => r.id === id);

        if (!reseña) {
            container.innerHTML = `<div class="error-state">Reseña no encontrada.</div>`;
            return;
        }

        // Actualizar título de la página
        document.title = `${reseña.titulo} (${reseña.anio}) – Reseña | Los Brujos del Cine`;

        // Encontrar anterior y siguiente
        const index = resenas.findIndex(r => r.id === id);
        const anterior = resenas[index - 1];
        const siguiente = resenas[index + 1];

        // Generar estrellas
        const estrellas = generarEstrellas(reseña.puntaje);

        // Generar párrafos del contenido
        const paragrafos = (reseña.contenido || [])
            .map(p => `<p>${p}</p>`)
            .join('');

        // Generar plataformas
        const plataformas = (reseña.plataformas || [])
            .map(p => `<span class="platform-tag">${p}</span>`)
            .join('');

        container.innerHTML = `
            <section class="review-hero">
                <div class="review-hero-inner">
                    <a href="index.html#reseñas" class="back-link">← Volver a reseñas</a>

                    <div class="review-header">
                        <div class="review-poster">
                            <img src="${reseña.poster}" alt="Póster de ${reseña.titulo}"
                                 onerror="this.src='https://via.placeholder.com/400x600/111/666?text=${encodeURIComponent(reseña.titulo)}'">
                        </div>

                        <div class="review-info">
                            <h1>${reseña.titulo}</h1>

                            <div class="review-meta">
                                <span class="review-rating">${estrellas}</span>
                                <span class="dot"></span>
                                <span>${reseña.anio}</span>
                                <span class="dot"></span>
                                <span>${reseña.generos.join(' · ')}</span>
                                ${reseña.duracion ? `<span class="dot"></span><span>${reseña.duracion}</span>` : ''}
                            </div>

                            <div class="review-platforms">
                                ${plataformas}
                            </div>

                            <div class="review-actions">
                                <a href="${reseña.letterboxd || 'https://boxd.it/8uSCV'}"
                                   target="_blank" rel="noopener noreferrer"
                                   class="btn-letterboxd">
                                    Ver en Letterboxd <span>↗</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <article class="review-body">
                <p class="lead">${reseña.lead || reseña.resumen}</p>

                ${paragrafos}

                ${reseña.cita ? `
                    <blockquote>“${reseña.cita}”</blockquote>
                ` : ''}

                <div class="verdict">
                    <div class="verdict-header">
                        <span>★</span> Veredicto
                    </div>
                    <p>${reseña.veredicto || 'Sin veredicto todavía.'}</p>
                </div>
            </article>

            <nav class="review-nav" aria-label="Otras reseñas">
                ${anterior ? `
                    <a href="review.html?id=${anterior.id}">
                        <span class="label">← Anterior</span>
                        <span class="title">${anterior.titulo}</span>
                    </a>
                ` : '<div></div>'}

                ${siguiente ? `
                    <a href="review.html?id=${siguiente.id}">
                        <span class="label">Siguiente →</span>
                        <span class="title">${siguiente.titulo}</span>
                    </a>
                ` : ''}
            </nav>
        `;

    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="error-state">Error al cargar la reseña.</div>`;
    }
});

function generarEstrellas(puntaje) {
    const llenas = Math.floor(puntaje);
    const tieneMedia = puntaje % 1 >= 0.25;
    let html = '';

    for (let i = 1; i <= 5; i++) {
        if (i <= llenas) {
            html += '★';
        } else if (i === llenas + 1 && tieneMedia) {
            html += '★'; // puedes cambiar esto por media estrella si quieres
        } else {
            html += '☆';
        }
    }
    return html;
}