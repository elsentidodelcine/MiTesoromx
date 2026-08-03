/* ============================================
   MI TESORO MX – Script (Clean Professional)
   ============================================ */

let productosGlobal = [];
let productosFiltrados = [];
let paginaActual = 1;
const productosPorPagina = 12;
let categoriaActual = "Todos";
let textoBusqueda = "";
let filtroExtra = "todos"; // todos | disponibles | preventa | oferta | ultima

const ENVIO_GRATIS_MIN = 550; // MXN — Correos de México, productos participantes
const WA_NUMERO = "524761002824";

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

/* ---------- DOM ---------- */
const toast = document.getElementById("cartToast");
const toastText = document.getElementById("toastText");
const toastTitle = document.getElementById("toastTitle");
const toastCerrar = document.getElementById("toastCerrar");
const toastVerCarrito = document.getElementById("toastVerCarrito");
const btnVaciarCarrito = document.getElementById("vaciarCarrito");
const confirmOverlay = document.getElementById("confirmOverlay");
const confirmVaciar = document.getElementById("confirmVaciar");
const cancelVaciar = document.getElementById("cancelVaciar");
const drawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("cartOverlay");
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeImageModal = document.getElementById("closeImageModal");

/* ---------- CARGA PRODUCTOS ---------- */
fetch("productos.json")
  .then((r) => r.json())
  .then((data) => {
    data.forEach((p) => {
      p.stock = Number(p.stock) || 0;
      p.stockInicial = p.stock;
      if (!p.badge) {
        if (p.stock === 1) p.badge = "Última pieza";
        if (p.stock === 0) p.badge = "AGOTADO";
      }
    });

    productosGlobal = data;
    productosFiltrados = data;

    crearFiltros(productosGlobal);
    render();
    actualizarCarritoUI();
    actualizarContadorCarrito();

    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
  })
  .catch((err) => {
    console.error("Error cargando productos:", err);
    const loader = document.getElementById("loader");
    if (loader) {
      loader.innerHTML = "<p>Error al cargar el catálogo. Recarga la página.</p>";
    }
  });

/* ---------- FILTROS + BÚSQUEDA ---------- */
function crearFiltros(productos) {
  const nav = document.getElementById("filtros");
  if (!nav) return;
  nav.innerHTML = "";

  const categorias = ["Todos", ...new Set(productos.map((p) => p.categoria))];

  categorias.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = cat;
    if (cat === categoriaActual) btn.classList.add("active");

    btn.onclick = (e) => {
      document.querySelectorAll("#filtros button").forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      categoriaActual = cat;
      aplicarFiltros();
    };

    nav.appendChild(btn);
  });
}

function badgeTexto(p) {
  return (p.badge || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function aplicarFiltros() {
  let lista = [...productosGlobal];

  // Filtro por categoría
  if (categoriaActual && categoriaActual !== "Todos") {
    lista = lista.filter((p) => p.categoria === categoriaActual);
  }

   // 9 = Precio proximamente
  // Filtros extra
  if (filtroExtra === "disponibles") {
    lista = lista.filter((p) => p.stock > 0 && p.precio != 9 && p.precio != 3);
  } else if (filtroExtra === "preventa") {
    lista = lista.filter((p) => badgeTexto(p).includes("preventa"));
  } else if (filtroExtra === "oferta") {
    lista = lista.filter((p) => badgeTexto(p).includes("oferta"));
  } else if (filtroExtra === "ultima") {
    lista = lista.filter((p) => badgeTexto(p).includes("ultimo"));
  } else if (filtroExtra === "exclusivo") {
        lista = lista.filter((p) => badgeTexto(p).includes("exclusivo"));
  } else if (filtroExtra === "nuevo") {
        lista = lista.filter((p) => badgeTexto(p).includes("nuevo"));
  }


  /*else if (filtroExtra === "ultima") {
    lista = lista.filter(
      (p) =>
        p.stock === 1 ||
        badgeTexto(p).includes("ultima") ||
        badgeTexto(p).includes("último") ||
        badgeTexto(p).includes("ultimo")
    );
  }*/

  // Filtro por búsqueda
  if (textoBusqueda) {
    const q = textoBusqueda.toLowerCase().trim();
    lista = lista.filter(
      (p) =>
        (p.nombre && p.nombre.toLowerCase().includes(q)) ||
        (p.categoria && p.categoria.toLowerCase().includes(q)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
    );
  }

  productosFiltrados = lista;
  paginaActual = 1;
  actualizarInfoBusqueda();
  render();
}

/* Filtros extra (Disponibles / Preventa / Oferta / Última) */
(() => {
  const cont = document.getElementById("filtrosExtra");
  if (!cont) return;
  cont.querySelectorAll(".filtro-extra").forEach((btn) => {
    btn.addEventListener("click", () => {
      cont.querySelectorAll(".filtro-extra").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filtroExtra = btn.dataset.filtro || "todos";
      aplicarFiltros();
      scrollToCatalogo();
    });
  });
})();

function actualizarInfoBusqueda() {
  const info = document.getElementById("searchResultsInfo");
  const clearBtn = document.getElementById("limpiarBusqueda");
  if (!info) return;

  if (textoBusqueda) {
    info.hidden = false;
    const n = productosFiltrados.length;
    info.textContent =
      n === 0
        ? `Sin resultados para "${textoBusqueda}"`
        : n === 1
          ? `1 producto encontrado para "${textoBusqueda}"`
          : `${n} productos encontrados para "${textoBusqueda}"`;
  } else {
    info.hidden = true;
    info.textContent = "";
  }

  if (clearBtn) {
    clearBtn.hidden = !textoBusqueda;
  }
}

/* Inicializar buscador */
(() => {
  const buscador = document.getElementById("buscador");
  const clearBtn = document.getElementById("limpiarBusqueda");
  if (!buscador) return;

  let debounceTimer;
  buscador.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      textoBusqueda = buscador.value;
      aplicarFiltros();
    }, 200);
  });

  // Enter → ir al catálogo
  buscador.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      textoBusqueda = buscador.value;
      aplicarFiltros();
      scrollToCatalogo();
    }
  });

  clearBtn?.addEventListener("click", () => {
    buscador.value = "";
    textoBusqueda = "";
    aplicarFiltros();
    buscador.focus();
  });
})();

/* ---------- RENDER ---------- */
function render() {
  mostrarProductos();
  crearPaginacion();
}

function mostrarProductos() {
  const catalogo = document.getElementById("catalogo");
  if (!catalogo) return;
  catalogo.innerHTML = "";

  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const pagina = productosFiltrados.slice(inicio, fin);

  if (pagina.length === 0) {
    const msg = textoBusqueda
      ? `No se encontraron productos para "<strong>${escapeHtml(textoBusqueda)}</strong>". Prueba con otro nombre.`
      : "No hay productos en esta categoría.";
    catalogo.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;opacity:.75">${msg}</p>`;
    return;
  }

  pagina.forEach((p) => {
    const card = document.createElement("article");
    card.className = "producto";
    card.dataset.nombre = p.nombre;

    const thumb = p.imagen ? p.imagen.replace("imgs/", "thumbs/") : "";
    const badgeClass = p.badge
      ? p.badge
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "")
      : "";

    let precioHTML = "";
    let accionHTML = "";

    if (p.precio == 9) {
      precioHTML = `<p class="precio proximamente-precio">💰 Precio por confirmar</p>`;
      accionHTML = `<button class="boton proximamente" disabled>Próximamente</button>`;
    } else if (p.precio == 3) {
      precioHTML = `<p class="precio proximamente-precio">⏳ En espera de restock</p>`;
      accionHTML = `<button class="boton proximamente" disabled>Próximamente</button>`;
    } else {
      precioHTML = `<p class="precio">$${Number(p.precio).toLocaleString("es-MX")} MXN</p>`;
      if (p.stock > 0) {
        const enCarrito = carrito.find((c) => c.nombre === p.nombre);
        if (enCarrito) {
          accionHTML = `<button class="boton apartado" disabled>En carrito</button>`;
        } else {
          accionHTML = `<button class="boton" type="button">Agregar al carrito</button>`;
        }
      } else {
        const msgAviso = encodeURIComponent(
          `Hola, me gustaría que me avisen cuando vuelva a haber stock de:\n*${p.nombre}*\n\nGracias.`
        );
        accionHTML = `
          <span class="sin-stock">AGOTADO</span>
          <a class="btn-avisarme" href="https://wa.me/${WA_NUMERO}?text=${msgAviso}" target="_blank" rel="noopener">
            🔔 Avisarme por WhatsApp
          </a>`;
      }
    }

    card.innerHTML = `
      ${p.badge ? `<span class="badge ${badgeClass}">${p.badge}</span>` : ""}
      <div class="img-wrapper">
        <img
          src="${thumb}"
          alt="${escapeHtml(p.nombre)}"
          class="producto-img"
          loading="lazy"
          decoding="async"
          width="300"
          height="300"
          data-full="${p.imagen || ""}"
          onerror="this.src='imgs/placeholder.png'"
        >
      </div>
      <div class="info">
        <h2>${escapeHtml(p.nombre)}</h2>
        ${
          p.badge && p.badge.toLowerCase().includes("oferta") && p.descripcion
            ? `<p class="descripcion-oferta">${escapeHtml(p.descripcion)}</p>`
            : ""
        }
        ${precioHTML}
        ${accionHTML}
      </div>
    `;

    const btn = card.querySelector(".boton:not(.proximamente):not(.apartado)");
    if (btn) {
      btn.onclick = () => agregarAlCarrito(p, card);
    }

    const img = card.querySelector(".producto-img");
    if (img) {
      img.addEventListener("click", () => {
        // Prioridad: data-full (imgs/) → si no, convertir el thumb a full
        const full = img.dataset.full || img.src;
        openImageModal(full);
      });
    }

    catalogo.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------- PAGINACIÓN ---------- */
function crearPaginacion() {
  const cont = document.getElementById("paginacion");
  if (!cont) return;
  cont.innerHTML = "";

  const total = Math.ceil(productosFiltrados.length / productosPorPagina) || 1;
  if (total <= 1) return;

  const prev = document.createElement("button");
  prev.type = "button";
  prev.textContent = "←";
  prev.disabled = paginaActual === 1;
  prev.onclick = () => {
    paginaActual--;
    render();
    scrollToCatalogo();
  };
  cont.appendChild(prev);

  // Limitar botones visibles en móvil
  let start = Math.max(1, paginaActual - 2);
  let end = Math.min(total, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);

  for (let i = start; i <= end; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = i;
    if (i === paginaActual) btn.classList.add("active");
    btn.onclick = () => {
      paginaActual = i;
      render();
      scrollToCatalogo();
    };
    cont.appendChild(btn);
  }

  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "→";
  next.disabled = paginaActual === total;
  next.onclick = () => {
    paginaActual++;
    render();
    scrollToCatalogo();
  };
  cont.appendChild(next);
}

function scrollToCatalogo() {
  const catalogo = document.getElementById("catalogo");
  if (!catalogo) return;
  const offset = 80;
  const top = catalogo.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

/* ---------- CARRITO ---------- */
function agregarAlCarrito(producto, card) {
  if (producto.stock <= 0) return;

  const encontrado = carrito.find((p) => p.nombre === producto.nombre);

  if (encontrado) {
    if (encontrado.cantidad >= producto.stockInicial) return;
    encontrado.cantidad++;
  } else {
    carrito.push({
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      cantidad: 1,
    });
  }

  // Reducir stock disponible visual
  producto.stock--;

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarritoUI();
  actualizarContadorCarrito();

  // Animación
  if (card) {
    card.classList.add("added");
    setTimeout(() => card.classList.remove("added"), 500);

    const btn = card.querySelector(".boton");
    if (btn) {
      btn.textContent = "En carrito";
      btn.classList.add("apartado");
      btn.disabled = true;
    }
  }

  mostrarToast(producto.nombre);
}

function actualizarCarritoUI() {
  const contenedor = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  if (!contenedor || !totalEl) return;

  contenedor.innerHTML = "";
  let total = 0;

  if (carrito.length === 0) {
    totalEl.textContent = "Tu carrito está vacío";
    actualizarWhats(0);
    actualizarEnvioGratisBar(0);
    actualizarEstadoVaciar();
    return;
  }

  carrito.forEach((p, index) => {
    const subtotal = p.precio * p.cantidad;
    total += subtotal;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img
        src="${p.imagen || ""}"
        class="cart-img"
        alt="${escapeHtml(p.nombre)}"
        onerror="this.src='imgs/placeholder.png'"
      >
      <div class="cart-info">
        <p class="cart-name">${escapeHtml(p.nombre)}</p>
        <p class="cart-price">$${Number(p.precio).toLocaleString("es-MX")} MXN</p>
        <div class="cart-qty-row">
          <button class="cart-qty-btn" data-action="minus" data-index="${index}" type="button" aria-label="Restar">−</button>
          <span class="cart-qty-num">${p.cantidad}</span>
          <button class="cart-qty-btn" data-action="plus" data-index="${index}" type="button" aria-label="Sumar">+</button>
        </div>
      </div>
      <button class="cart-remove" data-index="${index}" type="button" aria-label="Eliminar">✕</button>
    `;
    contenedor.appendChild(div);
  });

  totalEl.textContent = `Total: $${total.toLocaleString("es-MX")} MXN`;
  actualizarWhats(total);
  actualizarEnvioGratisBar(total);

  // Eventos cantidad
  contenedor.querySelectorAll(".cart-qty-btn").forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.index);
      const action = btn.dataset.action;
      cambiarCantidad(idx, action);
    };
  });

  // Eventos eliminar
  contenedor.querySelectorAll(".cart-remove").forEach((btn) => {
    btn.onclick = (e) => {
      const index = Number(e.currentTarget.dataset.index);
      const item = e.currentTarget.closest(".cart-item");
      eliminarProducto(index, item);
    };
  });

  actualizarEstadoVaciar();
}

function cambiarCantidad(index, action) {
  const item = carrito[index];
  if (!item) return;

  const productoOriginal = productosGlobal.find((p) => p.nombre === item.nombre);

  if (action === "plus") {
    if (productoOriginal && item.cantidad >= productoOriginal.stockInicial) return;
    item.cantidad++;
    if (productoOriginal) productoOriginal.stock = Math.max(0, productoOriginal.stock - 1);
  } else if (action === "minus") {
    if (item.cantidad <= 1) {
      const el = document.querySelectorAll(".cart-item")[index];
      eliminarProducto(index, el);
      return;
    }
    item.cantidad--;
    if (productoOriginal) productoOriginal.stock++;
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarritoUI();
  actualizarContadorCarrito();
  // Re-render catalog buttons state
  actualizarBotonesCatalogo();
}

function eliminarProducto(index, elemento) {
  const productoEliminado = carrito[index];
  if (!productoEliminado) return;

  if (elemento) {
    elemento.classList.add("remove");
  }

  setTimeout(() => {
    // Devolver stock
    const productoOriginal = productosGlobal.find(
      (p) => p.nombre === productoEliminado.nombre
    );
    if (productoOriginal) {
      productoOriginal.stock += productoEliminado.cantidad;
      if (productoOriginal.stock > productoOriginal.stockInicial) {
        productoOriginal.stock = productoOriginal.stockInicial;
      }
    }

    carrito.splice(index, 1);
    localStorage.setItem("carrito", JSON.stringify(carrito));

    actualizarCarritoUI();
    actualizarContadorCarrito();
    actualizarBotonesCatalogo();
  }, 280);
}

function actualizarBotonesCatalogo() {
  document.querySelectorAll(".producto").forEach((card) => {
    const nombre = card.dataset.nombre;
    const btn = card.querySelector(".boton");
    if (!btn || btn.classList.contains("proximamente")) return;

    const enCarrito = carrito.find((c) => c.nombre === nombre);
    const producto = productosGlobal.find((p) => p.nombre === nombre);

    if (enCarrito) {
      btn.textContent = "En carrito";
      btn.classList.add("apartado");
      btn.disabled = true;
    } else if (producto && producto.stock > 0) {
      btn.textContent = "Agregar al carrito";
      btn.classList.remove("apartado");
      btn.disabled = false;
      btn.onclick = () => agregarAlCarrito(producto, card);
    } else if (producto && producto.stock <= 0) {
      // Reemplazar por agotado si hace falta
      const info = card.querySelector(".info");
      if (info && !info.querySelector(".sin-stock")) {
        btn.remove();
        const span = document.createElement("span");
        span.className = "sin-stock";
        span.textContent = "AGOTADO";
        info.appendChild(span);
      }
    }
  });
}

function actualizarWhats(total) {
  let msg = `Hola 👋\nQuiero comprar las siguientes piezas de *Mi Tesoro MX*:\n\n*Productos:*\n`;

  carrito.forEach((p) => {
    msg += `• ${p.nombre} x${p.cantidad}\n`;
  });

  msg += `\n*Total:* $${Number(total).toLocaleString("es-MX")} MXN\n*Tipo de Pago:* (Apartado / Pago Total)\n\n*Código Postal:* \n\nQuedo atento(a) para confirmar disponibilidad.\n¡Gracias!`;

  const whatsBtn = document.getElementById("whatsBtn");
  if (whatsBtn) {
    whatsBtn.href =
      "https://wa.me/524761002824?text=" + encodeURIComponent(msg);
  }
}

function actualizarContadorCarrito() {
  const totalItems = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  const contador = document.getElementById("cartCount");
  if (contador) contador.textContent = totalItems;
}

function actualizarEstadoVaciar() {
  if (btnVaciarCarrito) {
    btnVaciarCarrito.disabled = carrito.length === 0;
  }
}

/* Barra envío gratis ($550 Correos, productos participantes) */
function actualizarEnvioGratisBar(total) {
  const bar = document.getElementById("envioGratisBar");
  const text = document.getElementById("envioGratisText");
  const fill = document.getElementById("envioGratisFill");
  if (!bar || !text || !fill) return;

  if (!total || total <= 0) {
    bar.hidden = true;
    return;
  }

  bar.hidden = false;
  const pct = Math.min(100, Math.round((total / ENVIO_GRATIS_MIN) * 100));
  fill.style.width = pct + "%";

  if (total >= ENVIO_GRATIS_MIN) {
    text.innerHTML = `🎉 ¡Posible <strong>envío gratis</strong> por Correos! (productos participantes)`;
    fill.classList.add("completo");
  } else {
    const falta = ENVIO_GRATIS_MIN - total;
    text.innerHTML = `Te faltan <strong>$${falta.toLocaleString("es-MX")} MXN</strong> para envío gratis por Correos*`;
    fill.classList.remove("completo");
  }
}

/* ---------- DRAWER ---------- */
document.getElementById("verCarrito")?.addEventListener("click", () => {
  drawer.classList.add("open");
  overlay.classList.add("show");
});

document.getElementById("cerrarDrawer")?.addEventListener("click", cerrarDrawer);
overlay?.addEventListener("click", cerrarDrawer);

function cerrarDrawer() {
  drawer.classList.remove("open");
  overlay.classList.remove("show");
}

/* ---------- VACIAR CARRITO (con confirmación) ---------- */
btnVaciarCarrito?.addEventListener("click", () => {
  if (carrito.length === 0) return;
  confirmOverlay?.classList.add("show");
});

cancelVaciar?.addEventListener("click", () => {
  confirmOverlay?.classList.remove("show");
});

confirmVaciar?.addEventListener("click", () => {
  // Restaurar stock
  carrito.forEach((item) => {
    const prod = productosGlobal.find((p) => p.nombre === item.nombre);
    if (prod) {
      prod.stock += item.cantidad;
      if (prod.stock > prod.stockInicial) prod.stock = prod.stockInicial;
    }
  });

  carrito = [];
  localStorage.removeItem("carrito");

  actualizarCarritoUI();
  actualizarContadorCarrito();
  actualizarEstadoVaciar();
  actualizarBotonesCatalogo();

  confirmOverlay?.classList.remove("show");

  if (toastTitle) toastTitle.textContent = "Carrito vacío";
  if (toastText) toastText.textContent = "Se eliminaron todos los productos";
  if (toast) {
    toast.classList.add("show");
    toast.style.display = "block";
    setTimeout(() => {
      toast.classList.remove("show");
      toast.style.display = "none";
    }, 2500);
  }
});

/* ---------- TOAST ---------- */
function mostrarToast(nombreProducto) {
  if (!toast || !toastText) return;
  if (toastTitle) toastTitle.textContent = "Agregado al carrito";
  toastText.textContent = `"${nombreProducto}" se agregó al carrito`;
  toast.style.display = "block";
  toast.classList.add("show");

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
    toast.style.display = "none";
  }, 3500);
}

toastCerrar?.addEventListener("click", () => {
  toast.style.display = "none";
  toast.classList.remove("show");
});

toastVerCarrito?.addEventListener("click", () => {
  toast.style.display = "none";
  toast.classList.remove("show");
  drawer.classList.add("open");
  overlay.classList.add("show");
});

/* ---------- TEMA ---------- */
const btnTheme = document.getElementById("toggleTheme");
const temaGuardado = localStorage.getItem("tema");

if (temaGuardado === "dark") {
  document.body.classList.add("dark");
  if (btnTheme) btnTheme.textContent = "☀️";
}

btnTheme?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const oscuro = document.body.classList.contains("dark");
  btnTheme.textContent = oscuro ? "☀️" : "🌙";
  localStorage.setItem("tema", oscuro ? "dark" : "light");
});

/* ---------- MODAL IMAGEN (versión completa, sin recorte) ---------- */
function toFullImageUrl(src) {
  if (!src) return "";
  // Nunca abrir el thumbnail: siempre la versión de imgs/
  let full = src;
  full = full.replace(/\/thumbs\//g, "/imgs/");
  full = full.replace(/thumbs\//g, "imgs/");
  return full;
}

function openImageModal(src) {
  if (!modalImage || !imageModal) return;

  const fullSrc = toFullImageUrl(src);
  modalImage.src = fullSrc;
  modalImage.alt = "Imagen completa del producto";

  // Por si la full falla, intentar el src original
  modalImage.onerror = () => {
    if (modalImage.src !== src && src) {
      modalImage.onerror = null;
      modalImage.src = src;
    }
  };

  imageModal.classList.add("show");
  imageModal.style.display = "flex";
  document.body.style.overflow = "hidden"; // evita scroll del fondo
}

function closeImageModalFn() {
  if (!imageModal) return;
  imageModal.classList.remove("show");
  imageModal.style.display = "none";
  document.body.style.overflow = "";
  if (modalImage) modalImage.src = "";
}

closeImageModal?.addEventListener("click", closeImageModalFn);

imageModal?.addEventListener("click", (e) => {
  // Cerrar solo si se hace clic en el fondo (no en la imagen)
  if (e.target === imageModal) {
    closeImageModalFn();
  }
});

// Cerrar con tecla Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && imageModal?.classList.contains("show")) {
    closeImageModalFn();
  }
});

/* ---------- MENÚ HAMBURGUESA ---------- */
(() => {
  const menuToggle = document.getElementById("menuToggle");
  const headerMenu = document.querySelector(".header-center");
  if (!menuToggle || !headerMenu) return;

  menuToggle.addEventListener("click", () => {
    const abierto = headerMenu.classList.toggle("open");
    menuToggle.textContent = abierto ? "✕" : "☰";
    menuToggle.setAttribute("aria-expanded", abierto);
  });

  headerMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      headerMenu.classList.remove("open");
      menuToggle.textContent = "☰";
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
})();

/* ---------- FILTROS TOGGLE (móvil) ---------- */
const toggleFiltros = document.getElementById("toggleFiltros");
const filtrosEl = document.querySelector(".filtros");

if (toggleFiltros && filtrosEl) {
  toggleFiltros.addEventListener("click", () => {
    filtrosEl.classList.toggle("expandido");
    toggleFiltros.textContent = filtrosEl.classList.contains("expandido")
      ? "Ocultar categorías ▴"
      : "Más categorías ▾";
  });
}

/* ---------- OPINIONES TOGGLE ---------- */
const toggleOpiniones = document.getElementById("toggleOpiniones");
const testimoniosEl = document.querySelector(".testimonios");

if (toggleOpiniones && testimoniosEl) {
  toggleOpiniones.addEventListener("click", () => {
    testimoniosEl.classList.toggle("expandido");
    toggleOpiniones.textContent = testimoniosEl.classList.contains("expandido")
      ? "Ocultar opiniones ▴"
      : "Ver más opiniones ▾";
  });
}

/* ---------- SWIPE ELIMINAR (móvil) ---------- */
let startX = 0;

document.addEventListener("touchstart", (e) => {
  const item = e.target.closest(".cart-item");
  if (!item) return;
  startX = e.touches[0].clientX;
}, { passive: true });

document.addEventListener("touchmove", (e) => {
  const item = e.target.closest(".cart-item");
  if (!item) return;
  const diff = e.touches[0].clientX - startX;
  if (diff < 0) {
    item.style.transform = `translateX(${diff}px)`;
  }
}, { passive: true });

document.addEventListener("touchend", (e) => {
  const item = e.target.closest(".cart-item");
  if (!item) return;
  const transform = item.style.transform;
  const moved = transform ? parseInt(transform.replace(/[^\-0-9]/g, ""), 10) : 0;

  if (moved < -80) {
    item.classList.add("removed");
    setTimeout(() => {
      item.querySelector(".cart-remove")?.click();
    }, 200);
  } else {
    item.style.transform = "";
  }
});
