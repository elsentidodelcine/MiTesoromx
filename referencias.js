/* ============================================
   MI TESORO MX – Referencias (Galería)
   ============================================ */

(function () {
  // Más recientes primero (refer altos al inicio)
  const FOTOS = [
    "imgs/referencias/ref178.jpg",
    "imgs/referencias/ref177.jpg",
    "imgs/referencias/ref176.jpg",
    "imgs/referencias/ref175.jpg",
    "imgs/referencias/ref174.jpg",
    "imgs/referencias/ref173.jpg",
    "imgs/referencias/ref172.jpg",
    "imgs/referencias/ref171.jpg",
    "imgs/referencias/ref170.jpg",
    "imgs/referencias/ref169.jpg",
    "imgs/referencias/ref168.jpg",
    "imgs/referencias/ref167.jpg",
    "imgs/referencias/ref166.jpg",
    "imgs/referencias/ref165.jpg",
    "imgs/referencias/ref164.jpg",
    "imgs/referencias/ref163.jpg",
    "imgs/referencias/ref162.jpg",
    "imgs/referencias/ref161.jpg",
    "imgs/referencias/ref160.jpg",
    "imgs/referencias/ref159.jpg",
    "imgs/referencias/ref158.jpg",
    "imgs/referencias/ref157.jpg",
    "imgs/referencias/ref156.jpg",
    "imgs/referencias/ref155.jpg",
    "imgs/referencias/ref154.jpg",
    "imgs/referencias/ref153.jpg",
    "imgs/referencias/ref152.jpg",
    "imgs/referencias/ref151.jpg",
    "imgs/referencias/ref150.jpg",
    "imgs/referencias/ref149.jpg",
    "imgs/referencias/ref148.jpg",
    "imgs/referencias/ref147.jpg",
    "imgs/referencias/ref146.jpg",
    "imgs/referencias/ref145.jpg",
    "imgs/referencias/ref144.jpg",
    "imgs/referencias/ref143.jpg",
    "imgs/referencias/ref142.jpg",
    "imgs/referencias/ref141.jpg",
    "imgs/referencias/ref140.jpg",
    "imgs/referencias/ref139.jpg",
    "imgs/referencias/ref138.jpg",
    "imgs/referencias/ref137.jpg",
    "imgs/referencias/ref136.jpg",
    "imgs/referencias/ref135.jpg",
    "imgs/referencias/ref134.jpg",
    "imgs/referencias/ref133.jpg",
    "imgs/referencias/ref132.jpg",
    "imgs/referencias/ref131.jpg",
    "imgs/referencias/ref130.jpg",
    "imgs/referencias/ref129.jpg",
    "imgs/referencias/ref128.jpg",
    "imgs/referencias/ref127.jpg",
    "imgs/referencias/ref126.jpg",
    "imgs/referencias/ref125.jpg",
    "imgs/referencias/ref124.jpg",
    "imgs/referencias/ref123.jpg",
    "imgs/referencias/ref122.jpg",
    "imgs/referencias/ref121.jpg",
    "imgs/referencias/ref120.jpg",
    "imgs/referencias/ref119.jpg",
    "imgs/referencias/ref118.jpg",
    "imgs/referencias/ref117.jpg",
    "imgs/referencias/ref116.jpg",
    "imgs/referencias/ref115.jpg",
    "imgs/referencias/ref114.jpg",
    "imgs/referencias/ref113.jpg",
    "imgs/referencias/ref112.jpg",
    "imgs/referencias/ref111.jpg",
    "imgs/referencias/ref110.jpg",
    "imgs/referencias/ref109.jpg",
    "imgs/referencias/ref108.jpg",
    "imgs/referencias/ref107.jpg",
    "imgs/referencias/ref106.jpg",
    "imgs/referencias/ref105.jpg",
    "imgs/referencias/ref104.jpg",
    "imgs/referencias/ref103.jpg",
    "imgs/referencias/ref102.jpg",
    "imgs/referencias/ref101.jpg",
    "imgs/referencias/ref100.jpg",
    "imgs/referencias/refer44.jpg",
    "imgs/referencias/refer43.jpg",
    "imgs/referencias/refer42.jpg",
    "imgs/referencias/refer41.jpg",
    "imgs/referencias/refer40.jpg",
    "imgs/referencias/refer39.jpg",
    "imgs/referencias/refer38.jpg",
    "imgs/referencias/refer37.jpg",
    "imgs/referencias/refer36.jpg",
    "imgs/referencias/ref50.jpg",
    "imgs/referencias/ref49.jpg",
    "imgs/referencias/ref48.jpg",
    "imgs/referencias/ref47.jpg",
    "imgs/referencias/ref46.jpg",
    "imgs/referencias/ref45.jpg",
    "imgs/referencias/ref44.jpg",
    "imgs/referencias/ref43.jpg",
    "imgs/referencias/ref42.jpg",
    "imgs/referencias/ref41.jpg",
    "imgs/referencias/ref40.jpg",
    "imgs/referencias/ref39.jpg",
    "imgs/referencias/ref38.jpg",
    "imgs/referencias/ref37.jpg",
    "imgs/referencias/ref36.jpg",
    "imgs/referencias/ref35.jpg",
    "imgs/referencias/ref34.jpg",
    "imgs/referencias/ref33.jpg",
    "imgs/referencias/ref32.jpg",
    "imgs/referencias/ref31.jpg",
    "imgs/referencias/ref30.jpg",
    "imgs/referencias/ref29.jpg",
    "imgs/referencias/ref28.jpg",
    "imgs/referencias/ref27.jpg",
    "imgs/referencias/ref26.jpg",
    "imgs/referencias/ref25.jpg",
    "imgs/referencias/ref23.jpg",
    "imgs/referencias/ref22.jpg",
    "imgs/referencias/ref21.jpg",
    "imgs/referencias/ref20.jpg",
    "imgs/referencias/ref19.jpg",
    "imgs/referencias/ref18.jpg",
    "imgs/referencias/ref17.jpg",
    "imgs/referencias/ref16.jpg",
    "imgs/referencias/ref15.jpg",
    "imgs/referencias/ref14.jpg",
    "imgs/referencias/ref13.jpg",
    "imgs/referencias/ref12.jpg",
    "imgs/referencias/ref11.jpg",
    "imgs/referencias/ref10.jpg",
    "imgs/referencias/ref9.jpg",
    "imgs/referencias/ref8.jpg",
    "imgs/referencias/ref7.jpg",
    "imgs/referencias/ref6.jpg",
    "imgs/referencias/ref5.jpg",
    "imgs/referencias/ref4.jpg",
    "imgs/referencias/ref3.jpg",
    "imgs/referencias/ref2.jpg",
    "imgs/referencias/ref1.jpg"
  ];

  const POR_PAGINA = 24;
  const PEDIDOS_TOTAL = 163; // número del contador animado
  let paginaActual = 1;
  let indiceLightbox = 0;

  const grid = document.getElementById("referenciasGrid");
  const paginacion = document.getElementById("refPaginacion");
  const contador = document.getElementById("refContador");
  const lightbox = document.getElementById("refLightbox");
  const lbImage = document.getElementById("refLbImage");
  const lbCounter = document.getElementById("refLbCounter");
  const lbClose = document.getElementById("refLbClose");
  const lbPrev = document.getElementById("refLbPrev");
  const lbNext = document.getElementById("refLbNext");
  const lbShare = document.getElementById("refLbShare");
  const contadorPedidos = document.getElementById("contadorPedidos");

  function totalPaginas() {
    return Math.ceil(FOTOS.length / POR_PAGINA) || 1;
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
      img.alt = `Referencia ${globalIndex + 1} – pedido real Mi Tesoro MX`;
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

    if (contador) {
      contador.textContent = `${FOTOS.length} referencias · Página ${paginaActual} de ${totalPaginas()}`;
    }
    renderPaginacion();

    // Scroll suave solo al cambiar de página (no en la primera carga)
    if (paginaActual > 1 || document.body.dataset.refInit === "1") {
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    document.body.dataset.refInit = "1";
  }

  function renderPaginacion() {
    const total = totalPaginas();
    if (!paginacion) return;
    paginacion.innerHTML = "";
    if (total <= 1) return;

    const btnPrev = document.createElement("button");
    btnPrev.type = "button";
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

    const maxVisible = 7;
    let start = Math.max(1, paginaActual - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      const btn1 = document.createElement("button");
      btn1.type = "button";
      btn1.textContent = "1";
      btn1.addEventListener("click", () => { paginaActual = 1; renderGrid(); });
      paginacion.appendChild(btn1);
      if (start > 2) {
        const dots = document.createElement("button");
        dots.type = "button";
        dots.textContent = "…";
        dots.disabled = true;
        paginacion.appendChild(dots);
      }
    }

    for (let i = start; i <= end; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = i;
      if (i === paginaActual) btn.classList.add("active");
      btn.addEventListener("click", () => { paginaActual = i; renderGrid(); });
      paginacion.appendChild(btn);
    }

    if (end < total) {
      if (end < total - 1) {
        const dots = document.createElement("button");
        dots.type = "button";
        dots.textContent = "…";
        dots.disabled = true;
        paginacion.appendChild(dots);
      }
      const btnLast = document.createElement("button");
      btnLast.type = "button";
      btnLast.textContent = total;
      btnLast.addEventListener("click", () => { paginaActual = total; renderGrid(); });
      paginacion.appendChild(btnLast);
    }

    const btnNext = document.createElement("button");
    btnNext.type = "button";
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
    lbImage.alt = `Referencia ${index + 1} – pedido real Mi Tesoro MX`;
    if (lbCounter) lbCounter.textContent = `${index + 1} / ${FOTOS.length}`;
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
    lbImage.alt = `Referencia ${indiceLightbox + 1} – pedido real Mi Tesoro MX`;
    if (lbCounter) lbCounter.textContent = `${indiceLightbox + 1} / ${FOTOS.length}`;
  }

  async function compartirReferencia() {
    const url = window.location.href.split("#")[0];
    const texto = `Mira esta referencia real de Mi Tesoro MX (${indiceLightbox + 1}/${FOTOS.length})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Referencia | Mi Tesoro MX", text: texto, url });
      } else {
        await navigator.clipboard.writeText(`${texto}\n${url}`);
        if (lbShare) {
          const prev = lbShare.textContent;
          lbShare.textContent = "¡Copiado!";
          setTimeout(() => { lbShare.textContent = prev; }, 1800);
        }
      }
    } catch (e) {
      // usuario canceló o no hay soporte
    }
  }

  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lbPrev) lbPrev.addEventListener("click", () => navegarLightbox(-1));
  if (lbNext) lbNext.addEventListener("click", () => navegarLightbox(1));
  if (lbShare) lbShare.addEventListener("click", compartirReferencia);

  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (!lightbox || !lightbox.classList.contains("show")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") navegarLightbox(-1);
    if (e.key === "ArrowRight") navegarLightbox(1);
  });

  // ========== CONTADOR ANIMADO ==========
  function animarContador(el, final, duracion = 1400) {
    if (!el) return;
    const inicio = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - inicio) / duracion);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = "+" + Math.round(final * ease);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function observarContador() {
    if (!contadorPedidos) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        animarContador(contadorPedidos, PEDIDOS_TOTAL);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(contadorPedidos);
  }

  // ========== INICIO ==========
  if (!FOTOS.length) {
    if (grid) {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">Aún no hay referencias.</p>`;
    }
    if (contador) contador.textContent = "";
  } else {
    renderGrid();
  }
  observarContador();
})();