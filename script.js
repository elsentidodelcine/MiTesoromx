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
let ordenActual = "default";
let franquiciaActual = "todas";
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

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
    const catalogoEl = document.getElementById("catalogo");
    if (catalogoEl) {
      catalogoEl.classList.remove("catalogo-skeleton");
      catalogoEl.removeAttribute("aria-busy");
    }
    render();
    actualizarCarritoUI();
    actualizarContadorCarrito();

    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
  })
  .catch((err) => {
    console.error("Error cargando productos:", err);
    const catalogoEl = document.getElementById("catalogo");
    if (catalogoEl) {
      catalogoEl.classList.remove("catalogo-skeleton");
      catalogoEl.innerHTML =
        '<p style="grid-column:1/-1;text-align:center;padding:40px;opacity:.8">Error al cargar el catálogo. Recarga la página.</p>';
    }
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
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
  } else if (filtroExtra === "agotados") {
    // Solo productos sin stock (no próximamente)
    lista = lista.filter((p) => p.stock <= 0 && p.precio != 9 && p.precio != 3);
  } else {
    // "todos" y cualquier otro → ocultar agotados
    lista = lista.filter((p) => p.stock > 0 || p.precio == 9 || p.precio == 3);
  }

    // Filtro por franquicia
    if (franquiciaActual && franquiciaActual !== "todas") {
      lista = lista.filter((p) => detectarFranquicia(p.nombre) === franquiciaActual);
    }



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

  // Ordenar
  lista = ordenarLista(lista);

  productosFiltrados = lista;
  paginaActual = 1;
  actualizarInfoBusqueda();
  actualizarContadorProductos();
  render();
}

function actualizarContadorProductos() {
  const el = document.getElementById("contadorProductos");
  if (!el) return;

  const total = productosFiltrados.length;
  const inicio = (paginaActual - 1) * productosPorPagina + 1;
  const fin = Math.min(paginaActual * productosPorPagina, total);

  if (total === 0) {
    el.textContent = "";
    return;
  }

  el.textContent =
    total === 1
      ? "1 producto"
      : `Mostrando ${inicio}–${fin} de ${total} productos`;
}

function ordenarLista(lista) {
  const arr = [...lista];
  switch (ordenActual) {
    case "precio-asc":
      return arr.sort((a, b) => Number(a.precio) - Number(b.precio));
    case "precio-desc":
      return arr.sort((a, b) => Number(b.precio) - Number(a.precio));
    case "nombre-asc":
      return arr.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
    case "nombre-desc":
      return arr.sort((a, b) => (b.nombre || "").localeCompare(a.nombre || "", "es"));
    case "stock-asc":
      // Últimas piezas primero (stock bajo, pero > 0 arriba; agotados al final)
      return arr.sort((a, b) => {
        const sa = a.stock > 0 ? a.stock : 9999;
        const sb = b.stock > 0 ? b.stock : 9999;
        return sa - sb;
      });
    default:
      return arr;
  }
}

/* Select ordenar */
(() => {
  const sel = document.getElementById("ordenar");
  if (!sel) return;
  sel.addEventListener("change", () => {
    ordenActual = sel.value || "default";
    aplicarFiltros();
    scrollToCatalogo();
  });
})();

/* Filtros extra (Disponibles / Preventa / Oferta / Última) */
(() => {
  const cont = document.getElementById("filtrosExtra");
  if (!cont) return;
  cont.querySelectorAll(".filtro-extra").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Quitar active y aria-pressed de todos
      cont.querySelectorAll(".filtro-extra").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });

      // Poner active y aria-pressed al que se clickeó
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");

      filtroExtra = btn.dataset.filtro || "todos";
      aplicarFiltros();
      scrollToCatalogo();
    });
  });
})();

/* Filtros por franquicia */
(() => {
  const cont = document.getElementById("filtrosFranquicia");
  if (!cont) return;

  cont.querySelectorAll(".filtro-extra").forEach((btn) => {
    btn.addEventListener("click", () => {
      cont.querySelectorAll(".filtro-extra").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");

      franquiciaActual = btn.dataset.franquicia || "todas";
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
  actualizarContadorProductos();
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
      ? `
        <div class="sin-resultados">
          <p class="sin-resultados-title">Sin resultados para “${escapeHtml(textoBusqueda)}”</p>
          <p class="sin-resultados-sub">Prueba con otro nombre, franquicia o quita algunos filtros.</p>
          <button type="button" class="btn-limpiar-filtros" id="btnLimpiarFiltros">
            Limpiar búsqueda y filtros
          </button>
        </div>
      `
      : `
        <div class="sin-resultados">
          <p class="sin-resultados-title">No hay productos en esta selección</p>
          <p class="sin-resultados-sub">Prueba con otra franquicia o filtro.</p>
          <button type="button" class="btn-limpiar-filtros" id="btnLimpiarFiltros">
            Ver todos los productos
          </button>
        </div>
      `;

    catalogo.innerHTML = msg;

    document.getElementById("btnLimpiarFiltros")?.addEventListener("click", () => {
      // Reset búsqueda
      const buscador = document.getElementById("buscador");
      if (buscador) buscador.value = "";
      textoBusqueda = "";

      // Reset filtros extra
      filtroExtra = "todos";
      document.querySelectorAll("#filtrosExtra .filtro-extra").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      const btnTodos = document.querySelector('#filtrosExtra [data-filtro="todos"]');
      if (btnTodos) {
        btnTodos.classList.add("active");
        btnTodos.setAttribute("aria-pressed", "true");
      }

      // Reset franquicia
      franquiciaActual = "todas";
      document.querySelectorAll("#filtrosFranquicia .filtro-extra").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      const btnFranq = document.querySelector('#filtrosFranquicia [data-franquicia="todas"]');
      if (btnFranq) {
        btnFranq.classList.add("active");
        btnFranq.setAttribute("aria-pressed", "true");
      }

      aplicarFiltros();
    });
    return;
  }

  pagina.forEach((p) => {
    const card = document.createElement("article");
    card.className = "producto";
    card.dataset.nombre = p.nombre;

    // Rutas de imagen:
    // - En el catálogo (rápido): siempre thumbs/
    // - Al hacer clic (completa): siempre imgs/
    // Acepta que en el JSON pongas "imgs/..." o "thumbs/..."
    const rutas = resolverRutasImagen(p.imagen);
    const thumb = rutas.thumb;
    const fullImg = rutas.full;
    const badgeClass = p.badge
      ? p.badge
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "")
      : "";

    let precioHTML = "";
    let accionHTML = "";
    const viendo = Math.floor(Math.random() * 5) + 2; // entre 2 y 6
    const esFavorito = wishlist.includes(p.nombre);

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
          data-full="${fullImg}"
          onerror="this.onerror=null;this.src='${fullImg || "imgs/placeholder.png"}'"
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
            ${
              p.stock === 1 && p.precio != 9 && p.precio != 3
                ? `<p class="ultima-pieza">${
                    p.badge && p.badge.toLowerCase().includes("preventa")
                      ? "🛒 Pide tu preventa ahora"
                      : "🔥 Última pieza"
                  }</p>`
                : ""
            }
            ${
              p.stock > 0 && p.precio != 9 && p.precio != 3
                ? `<p class="viendo-ahora">👀 ${viendo} persona${viendo === 1 ? "" : "s"} viendo esto</p>`
                : ""
            }
            <button type="button" class="btn-wishlist ${esFavorito ? "activo" : ""}"
              data-nombre="${escapeHtml(p.nombre)}" aria-label="Agregar a favoritos">
              ${esFavorito ? "❤️" : "🤍"}
            </button>
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

document.getElementById("btnSeguirComprando")?.addEventListener("click", () => {
  if (typeof closeDrawerWithFocus === "function") {
    closeDrawerWithFocus();
  } else if (typeof cerrarDrawer === "function") {
    cerrarDrawer();
  } else {
    drawer?.classList.remove("open");
    overlay?.classList.remove("show");
  }
  scrollToCatalogo();
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-wishlist");
  if (!btn) return;

  const nombre = btn.dataset.nombre;
  const idx = wishlist.indexOf(nombre);

  if (idx >= 0) {
    wishlist.splice(idx, 1);
    btn.classList.remove("activo");
    btn.textContent = "🤍";
  } else {
    wishlist.push(nombre);
    btn.classList.add("activo");
    btn.textContent = "❤️";
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
});

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
  actualizarContadorCarrito(true); // pulso en el botón del header

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
   totalEl.innerHTML = `
     <div class="cart-empty">
       <p class="cart-empty-title">Tu carrito está vacío</p>
       <p class="cart-empty-sub">Explora el catálogo y agrega tus coleccionables favoritos.</p>
       <button type="button" id="btnVerCatalogoDesdeCarrito" class="btn-ver-catalogo">
         Ver catálogo
       </button>
     </div>
   `;

   document.getElementById("btnVerCatalogoDesdeCarrito")?.addEventListener("click", () => {
     if (typeof closeDrawerWithFocus === "function") {
       closeDrawerWithFocus();
     } else {
       drawer?.classList.remove("open");
       overlay?.classList.remove("show");
     }
     scrollToCatalogo();
   });

   actualizarWhats(0);
   actualizarEnvioGratisBar(0);
   actualizarEstadoVaciar();

   // Ocultar "Seguir comprando"
   const btnSeguir = document.getElementById("btnSeguirComprando");
   if (btnSeguir) btnSeguir.style.display = "none";

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
  let msg = `Hola 👋\nSoy cliente de *Mi Tesoro MX* y quiero confirmar este pedido:\n\n`;

  msg += `*Productos:*\n`;
  carrito.forEach((p) => {
    const sub = Number(p.precio) * p.cantidad;
    msg += `• ${p.nombre}\n  Cantidad: ${p.cantidad}  |  $${Number(p.precio).toLocaleString("es-MX")} c/u\n`;
  });

  msg += `\n*Total:* $${Number(total).toLocaleString("es-MX")} MXN\n`;
  msg += `*Tipo de pago:* (Apartado 30% / Pago total)\n`;
  msg += `*Código Postal:* \n`;
  msg += `*Ciudad / Estado:* \n\n`;
  msg += `Quedo atento(a) para confirmar disponibilidad y forma de envío.\n¡Gracias! 🎬`;

  const whatsBtn = document.getElementById("whatsBtn");
  if (whatsBtn) {
    whatsBtn.href = `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(msg)}`;
  }
}

function actualizarContadorCarrito(conPulso = false) {
  const totalItems = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  const contador = document.getElementById("cartCount");
  const cartBtn = document.getElementById("verCarrito");
  if (contador) contador.textContent = totalItems;
  if (conPulso && cartBtn) {
    cartBtn.classList.remove("cart-pulse");
    // reflow para reiniciar animación
    void cartBtn.offsetWidth;
    cartBtn.classList.add("cart-pulse");
    setTimeout(() => cartBtn.classList.remove("cart-pulse"), 700);
  }
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

/* ---------- IMÁGENES: thumbs (rápido) vs imgs (completa) ---------- */
function resolverRutasImagen(ruta) {
  if (!ruta) return { thumb: "", full: "" };

  let full = ruta;
  let thumb = ruta;

  // Si viene de thumbs/ → la completa está en imgs/
  if (/thumbs\//i.test(ruta)) {
    full = ruta.replace(/thumbs\//i, "imgs/");
    thumb = ruta;
  } else if (/imgs\//i.test(ruta)) {
    // Si viene de imgs/ → el thumb está en thumbs/
    full = ruta;
    thumb = ruta.replace(/imgs\//i, "thumbs/");
  } else {
    // Sin carpeta: asumimos que el archivo está en ambas con el mismo nombre
    full = "imgs/" + ruta.replace(/^\/+/, "");
    thumb = "thumbs/" + ruta.replace(/^\/+/, "");
  }

  return { thumb, full };
}

function toFullImageUrl(src) {
  return resolverRutasImagen(src).full || src || "";
}

function openImageModal(src) {
  if (!modalImage || !imageModal) return;

  const fullSrc = toFullImageUrl(src);
  modalImage.src = fullSrc;
  modalImage.alt = "Imagen completa del producto";

  // Si no existe imgs/..., no caigas al thumb recortado si podemos evitarlo:
  // solo usa el src original como último recurso
  modalImage.onerror = () => {
    modalImage.onerror = null;
    // Intentar sin cambiar carpeta por si la ruta ya era válida
    if (src && modalImage.src !== src) {
      modalImage.src = src;
    }
  };

  imageModal.classList.add("show");
  imageModal.style.display = "flex";
  document.body.style.overflow = "hidden";
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

/* ---------- VOLVER ARRIBA ---------- */
(() => {
  const btn = document.getElementById("btnVolverArriba");
  if (!btn) return;

  const toggle = () => {
    if (window.scrollY > 400) {
      btn.hidden = false;
      btn.classList.add("visible");
    } else {
      btn.classList.remove("visible");
      // pequeño delay para que la animación termine antes de hidden
      setTimeout(() => {
        if (window.scrollY <= 400) btn.hidden = true;
      }, 200);
    }
  };

  window.addEventListener("scroll", toggle, { passive: true });
  toggle();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

/* ---------- RECORDATORIO DE CARRITO ---------- */
(() => {
  // Solo si hay items guardados al cargar la página
  if (!carrito || carrito.length === 0) return;

  const totalItems = carrito.reduce((acc, p) => acc + (p.cantidad || 1), 0);
  if (totalItems <= 0) return;

  // Evitar molestar en cada refresh de la misma sesión
  const key = "carritoRecordatorioShown";
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");

  // Esperar a que el loader se oculte
  setTimeout(() => {
    if (!toast || !toastText) return;
    if (toastTitle) toastTitle.textContent = "🛒 Carrito guardado";
    toastText.textContent =
      totalItems === 1
        ? "Tienes 1 producto en tu carrito"
        : `Tienes ${totalItems} productos en tu carrito`;
    toast.style.display = "block";
    toast.classList.add("show");

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove("show");
      toast.style.display = "none";
    }, 5000);
  }, 1200);
})();

/* =========================================================
   CARRUSEL DE PREVENTAS
   Solo marca active: true en las que quieras mostrar.
   ========================================================= */
const PREVENTAS_ACTIVAS = [
  {
    id: "paw-dino",
    active: true,
    emoji: "🦴",
    titulo: "Preventa PAW Patrol: The Dino Movie",
    texto: "** Próximamente **",
    link: "preventas.html",
    linkTexto: "Ver términos de preventa",
    tema: "paw",
  },
  {
    id: "harry-potter",
    active: true,
    emoji: "⚡",
    titulo: "Preventa Harry Potter",
    texto: "Coleccionables mágicos en preventa. ¡No te quedes sin el tuyo!",
    link: "preventas.html",
    linkTexto: "Ver términos de preventa",
    tema: "harry",
  },
  {
    id: "avengers-doomsday",
    active: true,
    emoji: "🦸",
    titulo: "Preventa Avengers: Doomsday",
    texto: "** Próximamente **",
    link: "preventas.html",
    linkTexto: "Ver términos de preventa",
    tema: "marvel",
  },
  {
    id: "ghost-banda",
    active: true,
    emoji: "💀",
    titulo: "Preventa Ghost – The Band",
    texto: "** Próximamente **",
    link: "preventas.html",
    linkTexto: "Ver términos de preventa",
    tema: "ghost",
  },
  {
    id: "mercado-libre",
    active: true,
    emoji: "🛒",
    titulo: "¡Ya estamos en Mercado Libre!",
    texto: "Compra con la seguridad y protección de Mercado Libre.<br><br><strong>⚠️ Los precios en Mercado Libre son más elevados</strong> por las comisiones de la plataforma. En esta página encuentras los mejores precios.",
    link: "https://listado.mercadolibre.com.mx/_CustId_225063561",
    linkTexto: "Ver tienda en Mercado Libre",
    tema: "mercadolibre",
  },
];

function initCarouselPreventas() {
  const track = document.getElementById("carouselTrack");
  const dotsContainer = document.getElementById("carouselDots");
  const btnPrev = document.getElementById("carouselPrev");
  const btnNext = document.getElementById("carouselNext");
  const wrapper = document.querySelector(".carousel-preventas");

  if (!track || !dotsContainer || !wrapper) return;

  const slidesData = PREVENTAS_ACTIVAS.filter((p) => p.active);
  if (slidesData.length === 0) {
    wrapper.hidden = true;
    return;
  }

  wrapper.hidden = false;
  let current = 0;
  let autoplayTimer = null;
  const AUTOPLAY_MS = 5500;

  // Crear slides
  track.innerHTML = slidesData
    .map(
      (p) => `
    <div class="carousel-slide carousel-slide--${p.tema || "generic"}" role="group" aria-label="${escapeHtml(p.titulo)}">
      <div class="banner-content">
        <h2>${p.emoji || "🎬"} ${escapeHtml(p.titulo)}</h2>
        <p>${p.texto || ""}</p>
        <a
          href="${p.link || "preventas.html"}"
          class="banner-btn"
          ${p.link?.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}
        >
          ${escapeHtml(p.linkTexto || "Ver preventa")}
        </a>
      </div>
    </div>
  `
    )
    .join("");

  // Crear dots
  dotsContainer.innerHTML = slidesData
    .map(
      (_, i) =>
        `<button type="button" class="carousel-dot${i === 0 ? " active" : ""}" data-index="${i}" aria-label="Ir a preventa ${i + 1}" role="tab"></button>`
    )
    .join("");

  const dots = () => [...dotsContainer.querySelectorAll(".carousel-dot")];

  function goTo(index) {
    current = (index + slidesData.length) % slidesData.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots().forEach((d, i) => d.classList.toggle("active", i === current));
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    if (slidesData.length <= 1) return;
    autoplayTimer = setInterval(next, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  // Eventos
  btnNext?.addEventListener("click", () => {
    next();
    startAutoplay();
  });
  btnPrev?.addEventListener("click", () => {
    prev();
    startAutoplay();
  });

  dotsContainer.addEventListener("click", (e) => {
    const dot = e.target.closest(".carousel-dot");
    if (!dot) return;
    goTo(Number(dot.dataset.index));
    startAutoplay();
  });

  // Swipe táctil
  let startX = 0;
  let isDragging = false;

  track.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      stopAutoplay();
    },
    { passive: true }
  );

  track.addEventListener(
    "touchend",
    (e) => {
      if (!isDragging) return;
      isDragging = false;
      const diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 50) {
        diff < 0 ? next() : prev();
      }
      startAutoplay();
    },
    { passive: true }
  );

  // Pausar al pasar el mouse (desktop)
  wrapper.addEventListener("mouseenter", stopAutoplay);
  wrapper.addEventListener("mouseleave", startAutoplay);

  // Iniciar
  goTo(0);
  startAutoplay();
}

// Llamar al iniciar
initCarouselPreventas();

function renderBannerPreventa() {
  const el = document.getElementById("bannerPreventa");
  if (!el) return;

  const activas = PREVENTAS_ACTIVAS.filter((p) => p.active);
  if (activas.length === 0) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }

  // Si hay varias activas, rota cada 6s
  let idx = 0;
  const pintar = () => {
    const p = activas[idx % activas.length];
    el.hidden = false;
    el.className = `banner-preventa banner-preventa--${p.tema || "generic"}`;
    el.setAttribute("aria-label", p.titulo);
    el.innerHTML = `
      <div class="banner-content">
        <h2>${p.emoji || "🎬"} ${escapeHtml(p.titulo)}</h2>
        <p>${p.texto || ""}</p>
        <a
          href="${p.link || "preventas.html"}"
          class="banner-btn banner-btn-preventa"
          ${p.link?.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}
        >
          ${escapeHtml(p.linkTexto || "Ver preventa")}
        </a>
      </div>
    `;
    idx++;
  };

  pintar();
  if (activas.length > 1) {
    setInterval(pintar, 6000);
  }
}

renderBannerPreventa();

/* =========================================================
   HORARIO WHATSAPP (zona Centro de México)
   Lun–Sáb 10:00–20:00 · Dom 11:00–18:00
   ========================================================= */
function obtenerEstadoWhatsApp() {
  try {
    const ahora = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
    );
    const dia = ahora.getDay(); // 0=dom ... 6=sab
    const minutos = ahora.getHours() * 60 + ahora.getMinutes();

    let inicio, fin;
    if (dia === 0) {
      // domingo
      inicio = 11 * 60;
      fin = 18 * 60;
    } else {
      // lun–sáb
      inicio = 10 * 60;
      fin = 20 * 60;
    }

    const abierto = minutos >= inicio && minutos < fin;
    return {
      abierto,
      etiqueta: abierto ? "En línea" : "Fuera de horario",
      detalle: abierto
        ? "Respondemos hoy"
        : dia === 0 && minutos >= fin
          ? "Te respondemos mañana a las 10:00"
          : minutos < inicio
            ? dia === 0
              ? "Abrimos hoy a las 11:00"
              : "Abrimos hoy a las 10:00"
            : "Te respondemos mañana a las 10:00",
    };
  } catch (e) {
    return { abierto: true, etiqueta: "", detalle: "" };
  }
}

function actualizarEstadoWhatsApp() {
  const status = document.getElementById("waStatus");
  const floatBtn = document.getElementById("whatsappFloat");
  const wrap = document.getElementById("waFloatWrap");
  if (!status || !floatBtn) return;

  const est = obtenerEstadoWhatsApp();
  status.hidden = false;
  status.textContent = est.abierto ? "● En línea" : "○ Fuera de horario";
  status.className = "wa-status " + (est.abierto ? "online" : "offline");
  status.title = est.detalle;
  wrap?.classList.toggle("wa-offline", !est.abierto);

  // Mensaje prellenado según horario
  const msg = est.abierto
      ? "Hola, quiero información sobre un producto de *Mi Tesoro MX*."
      : `Hola, escribo fuera de horario (${est.detalle}). Me interesa un producto de *Mi Tesoro MX*.`;
  floatBtn.href = `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(msg)}`;
  floatBtn.setAttribute("aria-label", `WhatsApp – ${est.etiqueta}. ${est.detalle}`);
}

actualizarEstadoWhatsApp();
setInterval(actualizarEstadoWhatsApp, 60 * 1000);

/* =========================================================
   LISTA DE ESPERA (Avisarme)
   Guarda en localStorage los productos que el cliente pidió avisar.
   Tú los ves cuando te escriben por WA; además puedes consultar
   en consola: verListaEspera()
   ========================================================= */
const LISTA_ESPERA_KEY = "listaEsperaMiTesoro";

function obtenerListaEspera() {
  try {
    return JSON.parse(localStorage.getItem(LISTA_ESPERA_KEY)) || [];
  } catch {
    return [];
  }
}

function guardarEnListaEspera(nombreProducto) {
  const lista = obtenerListaEspera();
  const existe = lista.find((x) => x.nombre === nombreProducto);
  if (existe) {
    existe.veces = (existe.veces || 1) + 1;
    existe.ultima = new Date().toISOString();
  } else {
    lista.push({
      nombre: nombreProducto,
      veces: 1,
      primera: new Date().toISOString(),
      ultima: new Date().toISOString(),
    });
  }
  localStorage.setItem(LISTA_ESPERA_KEY, JSON.stringify(lista));
}

// Helper para ti: abre la consola del navegador y escribe verListaEspera()
window.verListaEspera = function () {
  const lista = obtenerListaEspera();
  console.table(lista);
  return lista;
};

// Enlazar clicks de "Avisarme" (delegación, por si se re-renderiza el catálogo)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-avisarme");
  if (!btn) return;
  const card = btn.closest(".producto");
  const nombre = card?.dataset?.nombre || card?.querySelector("h2")?.textContent;
  if (nombre) {
    guardarEnListaEspera(nombre.trim());
    // Feedback rápido
    if (toast && toastText) {
      if (toastTitle) toastTitle.textContent = "Lista de espera";
      toastText.textContent = `Te avisaremos por WhatsApp cuando haya stock de "${nombre.trim()}"`;
      toast.style.display = "block";
      toast.classList.add("show");
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => {
        toast.classList.remove("show");
        toast.style.display = "none";
      }, 3500);
    }
  }
});


/* ---------- FOCUS TRAP + ESCAPE ---------- */
function trapFocus(container) {
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return () => {};

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleKey(e) {
    if (e.key !== "Tab") return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener("keydown", handleKey);
  first.focus();

  return () => container.removeEventListener("keydown", handleKey);
}

let releaseFocusTrap = null;
let lastFocusedElement = null;

function openDrawer() {
  lastFocusedElement = document.activeElement;
  drawer.classList.add("open");
  overlay.classList.add("show");
  releaseFocusTrap = trapFocus(drawer);
}

function closeDrawerWithFocus() {
  drawer.classList.remove("open");
  overlay.classList.remove("show");
  if (releaseFocusTrap) releaseFocusTrap();
  releaseFocusTrap = null;
  lastFocusedElement?.focus();
}

// Reemplaza los listeners del carrito
document.getElementById("verCarrito")?.addEventListener("click", openDrawer);
document.getElementById("cerrarDrawer")?.addEventListener("click", closeDrawerWithFocus);
overlay?.addEventListener("click", closeDrawerWithFocus);

// Escape cierra drawer y modales
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  if (drawer?.classList.contains("open")) {
    closeDrawerWithFocus();
  }
  if (confirmOverlay?.classList.contains("show")) {
    confirmOverlay.classList.remove("show");
  }
  if (imageModal?.classList.contains("show")) {
    closeImageModalFn();
  }
});

function detectarFranquicia(nombre) {
  const n = (nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (/spider|marvel|avenger|iron man|captain|thor|hulk|deadpool|x-men|wolverine|venom|doctor strange|black panther|guardian/.test(n)) {
    return "marvel";
  }
  if (/star wars|darth|vader|yoda|mandalorian|grogu|jedi|sith|baby yoda|stormtrooper|bb-8|r2-d2/.test(n)) {
    return "starwars";
  }
  if (/\bdc\b|batman|superman|wonder woman|joker|flash|aquaman|harley|justice league/.test(n)) {
    return "dc";
  }
  return "otros";
}



