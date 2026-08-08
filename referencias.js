/* ============================================
   MI TESORO MX – Referencias (Galería)
   ============================================ */

(function () {
  // ========== CONFIGURACIÓN ==========
  // Cambia esta lista por tus 150 fotos reales
  // Formato: "imgs/referencias/foto1.jpg"
  const FOTOS = [
    "imgs/referencias/ref1.jpg",
    "imgs/referencias/ref2.jpg",
    "imgs/referencias/ref3.jpg",
    "imgs/referencias/ref4.jpg",
    "imgs/referencias/ref5.jpg",
    "imgs/referencias/ref6.jpg",
    "imgs/referencias/ref7.jpg",
    "imgs/referencias/ref8.jpg",
    "imgs/referencias/ref9.jpg",
    "imgs/referencias/ref10.jpg",
    "imgs/referencias/ref11.jpg",
    "imgs/referencias/ref12.jpg",
    "imgs/referencias/ref13.jpg",
    "imgs/referencias/ref14.jpg",
    "imgs/referencias/ref15.jpg",
    "imgs/referencias/ref16.jpg",
    "imgs/referencias/ref17.jpg",
    "imgs/referencias/ref18.jpg",
    "imgs/referencias/ref19.jpg",
    "imgs/referencias/ref20.jpg",
    "imgs/referencias/ref21.jpg",
    "imgs/referencias/ref22.jpg",
    "imgs/referencias/ref23.jpg",
    "imgs/referencias/ref24.jpg",
    "imgs/referencias/ref25.jpg",
    "imgs/referencias/ref26.jpg",
    "imgs/referencias/ref27.jpg",
    "imgs/referencias/ref20.jpg",
    "imgs/referencias/ref20.jpg",
    "imgs/referencias/ref30.jpg",
    "imgs/referencias/ref31.jpg",
    "imgs/referencias/ref32.jpg",
    "imgs/referencias/ref33.jpg",
    "imgs/referencias/ref34.jpg",
    "imgs/referencias/ref35.jpg",
    "imgs/referencias/ref36.jpg",
    "imgs/referencias/ref37.jpg",
    "imgs/referencias/ref38.jpg",
    "imgs/referencias/ref39.jpg",
    "imgs/referencias/ref40.jpg",
    "imgs/referencias/ref41.jpg",
    "imgs/referencias/ref42.jpg",
    "imgs/referencias/ref43.jpg",
    "imgs/referencias/ref44.jpg",
    "imgs/referencias/ref45.jpg",
    "imgs/referencias/ref46.jpg",
    "imgs/referencias/ref47.jpg",
    "imgs/referencias/ref48.jpg",
    "imgs/referencias/ref49.jpg",
    "imgs/referencias/ref50.jpg",

  ];

  const POR_PAGINA = 24; // 24 fotos por página (ideal para 150)
  let paginaActual = 1;
  let indiceLightbox = 0;

  // ========== ELEMENTOS ==========
  const grid = document.getElementById("referenciasGrid");
  const paginacion = document.getElementById("refPaginacion");
  const contador = document.getElementById("refContador");
  const lightbox = document.getElementById("refLightbox");
  const lbImage = document.getElementById("refLbImage");
  const lbCounter = document.getElementById("refLbCounter");
  const lbClose = document.getElementById("refLbClose");
  const lbPrev = document.getElementById("refLbPrev");
  const lbNext = document.getElementById("refLbNext");

  // ========== RENDER ==========
  function totalPaginas() {
    return Math.ceil(FOTOS.length / POR_PAGINA);
  }

  function renderGrid() {
    const inicio = (paginaActual - 1) * POR_PAGINA;
    const fin = inicio + POR_PAGINA;
    const pagina = FOTOS.slice(inicio, fin);

    grid.innerHTML = "";

    pagina.forEach((src, i) => {
      const globalIndex = inicio + i;
      const card = document.createElement("div");
      card.className = "ref-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Ver referencia ${globalIndex + 1}`);

      const img = document.createElement("img");
      img.src = src;
      img.alt = `Referencia ${globalIndex + 1}`;
      img.loading = "lazy";
      img.decoding = "async";

      card.appendChild(img);
      card.addEventListener("click", () => openLightbox(globalIndex));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(globalIndex);
        }
      });

      grid.appendChild(card);
    });

    contador.textContent = `${FOTOS.length} referencias · Página ${paginaActual} de ${totalPaginas()}`;
    renderPaginacion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderPaginacion() {
    const total = totalPaginas();
    paginacion.innerHTML = "";

    if (total <= 1) return;

    // Anterior
    const btnPrev = document.createElement("button");
    btnPrev.textContent = "‹";
    btnPrev.disabled = paginaActual === 1;
    btnPrev.setAttribute("aria-label", "Página anterior");
    btnPrev.addEventListener("click", () => {
      if (paginaActual > 1) {
        paginaActual--;
        renderGrid();
      }
    });
    paginacion.appendChild(btnPrev);

    // Números (máximo 7 botones visibles)
    const maxVisible = 7;
    let start = Math.max(1, paginaActual - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      const btn1 = document.createElement("button");
      btn1.textContent = "1";
      btn1.addEventListener("click", () => { paginaActual = 1; renderGrid(); });
      paginacion.appendChild(btn1);
      if (start > 2) {
        const dots = document.createElement("button");
        dots.textContent = "…";
        dots.disabled = true;
        paginacion.appendChild(dots);
      }
    }

    for (let i = start; i <= end; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === paginaActual) btn.classList.add("active");
      btn.addEventListener("click", () => {
        paginaActual = i;
        renderGrid();
      });
      paginacion.appendChild(btn);
    }

    if (end < total) {
      if (end < total - 1) {
        const dots = document.createElement("button");
        dots.textContent = "…";
        dots.disabled = true;
        paginacion.appendChild(dots);
      }
      const btnLast = document.createElement("button");
      btnLast.textContent = total;
      btnLast.addEventListener("click", () => { paginaActual = total; renderGrid(); });
      paginacion.appendChild(btnLast);
    }

    // Siguiente
    const btnNext = document.createElement("button");
    btnNext.textContent = "›";
    btnNext.disabled = paginaActual === total;
    btnNext.setAttribute("aria-label", "Página siguiente");
    btnNext.addEventListener("click", () => {
      if (paginaActual < total) {
        paginaActual++;
        renderGrid();
      }
    });
    paginacion.appendChild(btnNext);
  }

  // ========== LIGHTBOX ==========
  function openLightbox(index) {
    indiceLightbox = index;
    lbImage.src = FOTOS[index];
    lbImage.alt = `Referencia ${index + 1}`;
    lbCounter.textContent = `${index + 1} / ${FOTOS.length}`;
    lightbox.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("show");
    document.body.style.overflow = "";
  }

  function navegarLightbox(dir) {
    indiceLightbox = (indiceLightbox + dir + FOTOS.length) % FOTOS.length;
    lbImage.src = FOTOS[indiceLightbox];
    lbImage.alt = `Referencia ${indiceLightbox + 1}`;
    lbCounter.textContent = `${indiceLightbox + 1} / ${FOTOS.length}`;
  }

  lbClose.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", () => navegarLightbox(-1));
  lbNext.addEventListener("click", () => navegarLightbox(1));

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("show")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") navegarLightbox(-1);
    if (e.key === "ArrowRight") navegarLightbox(1);
  });

  // ========== INICIO ==========
  if (FOTOS.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">Aún no hay referencias.</p>`;
    contador.textContent = "";
  } else {
    renderGrid();
  }
})();