/* =========================
   VARIABLES GLOBALES
========================= */
let productosGlobal = [];
let productosFiltrados = [];
let paginaActual = 1;
const productosPorPagina = 12;

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

/* =========================
   CARGA DE PRODUCTOS
========================= */
fetch("productos.json")
  .then(r => r.json())
  .then(data => {
    data.forEach(p => {
      p.stock = 1;

      // 🔥 NUEVO: escasez real
      p.badge = "Última pieza";
    });

    productosGlobal = data;
    productosFiltrados = data;

    crearFiltros(productosGlobal);
    render();
    actualizarCarritoUI();

    document.getElementById("loader").style.display = "none";
  })
  .catch(err => {
    console.error("Error cargando productos:", err);
  });

/* =========================
   FILTROS POR CATEGORÍA
========================= */
function crearFiltros(productos) {
  const nav = document.getElementById("filtros");
  nav.innerHTML = "";

  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria))];

  categorias.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    if (cat === "Todos") btn.classList.add("active");

    btn.onclick = e => {
      document.querySelectorAll("#filtros button")
        .forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");

      productosFiltrados = cat === "Todos"
        ? productosGlobal
        : productosGlobal.filter(p => p.categoria === cat);

      paginaActual = 1;
      render();
    };

    nav.appendChild(btn);
  });
}

/* =========================
   ORDENAR
========================= */
const selectOrden = document.getElementById("ordenar");

selectOrden.addEventListener("change", () => {
  ordenarProductos();
  paginaActual = 1;
  render();
});

function ordenarProductos() {
  const v = selectOrden.value;

  productosFiltrados.sort((a, b) => {
    switch (v) {
      case "nombre-asc": return a.nombre.localeCompare(b.nombre);
      case "nombre-desc": return b.nombre.localeCompare(a.nombre);
      case "precio-asc": return a.precio - b.precio;
      case "precio-desc": return b.precio - a.precio;
      default: return 0;
    }
  });
}

/* =========================
   BUSCADOR
========================= */
document.getElementById("buscador").addEventListener("input", e => {
  const texto = e.target.value.toLowerCase();

  productosFiltrados = productosGlobal.filter(p =>
    p.nombre.toLowerCase().includes(texto) ||
    p.categoria.toLowerCase().includes(texto)
  );

  paginaActual = 1;
  render();
});

/* =========================
   RENDER GENERAL
========================= */
function render() {
  mostrarProductos();
  crearPaginacion();
}

/* =========================
   MOSTRAR PRODUCTOS
========================= */
function mostrarProductos() {
  const catalogo = document.getElementById("catalogo");
  catalogo.innerHTML = "";

  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const pagina = productosFiltrados.slice(inicio, fin);

  pagina.forEach(p => {
    const card = document.createElement("div");
    card.className = "producto";

    card.innerHTML = `
  ${p.badge ? `<span class="badge unico">ÚNICO</span>` : ""}
  <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">

  <div class="info">
    <h2>${p.nombre}</h2>
   

    <p class="precio">$${p.precio} MXN</p>

    <button class="boton" ${p.stock <= 0 ? "disabled" : ""}>
      ${p.stock <= 0 ? "Vendido" : "Agregar al carrito"}
    </button>
  </div>
`;


    card.querySelector("button").onclick = () => agregarAlCarrito(p, card);

    catalogo.appendChild(card);
  });
}

/* =========================
   PAGINACIÓN
========================= */
function crearPaginacion() {
  const cont = document.getElementById("paginacion");
  cont.innerHTML = "";

  const total = Math.ceil(productosFiltrados.length / productosPorPagina);

  const prev = document.createElement("button");
  prev.textContent = "←";
  prev.disabled = paginaActual === 1;
  prev.onclick = () => {
    paginaActual--;
    render();
  };
  cont.appendChild(prev);

  for (let i = 1; i <= total; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === paginaActual) btn.classList.add("active");

    btn.onclick = () => {
      paginaActual = i;
      render();
    };

    cont.appendChild(btn);
  }

  const next = document.createElement("button");
  next.textContent = "→";
  next.disabled = paginaActual === total;
  next.onclick = () => {
    paginaActual++;
    render();
  };
  cont.appendChild(next);
}

/* =========================
   CARRITO
========================= */
function agregarAlCarrito(producto, card) {
  if (producto.stock <= 0) return;

  producto.stock--;

  const encontrado = carrito.find(p => p.nombre === producto.nombre);

  if (encontrado) {
    encontrado.cantidad++;
  } else {
    carrito.push({
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1
    });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarritoUI();

  // Animación botón
  const btn = card.querySelector(".boton");
  const textoOriginal = btn.textContent;
  btn.textContent = "✓ Agregado";
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = textoOriginal;
    btn.disabled = false;
  }, 1200);

  // Toast
  mostrarToast(producto.nombre);

  render();
}


function actualizarCarritoUI() {
  document.getElementById("count").textContent = carrito.length;

  const items = document.getElementById("cartItems");
  const totalTxt = document.getElementById("cartTotal");

  items.innerHTML = "";
  let total = 0;

  if (carrito.length === 0) {
  items.innerHTML = `
    <div style="text-align:center; padding:40px 10px;">
      <div style="font-size:40px;">🛒</div>
      <p><strong>Aún no eliges tu tesoro</strong></p>
      <p style="font-size:.85rem; opacity:.7">
        Todas las piezas son únicas
      </p>
    </div>
  `;
  totalTxt.textContent = "Total: $0 MXN";
  return;
}


  carrito.forEach(p => {
    total += p.precio;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `<strong>${p.nombre}</strong>`;
    items.appendChild(div);
  });

  totalTxt.textContent = `Total: $${total} MXN`;
  actualizarWhats(total);
}

/* =========================
   WHATSAPP (CONVERSIÓN)
========================= */
function actualizarWhats(total) {
  let msg =
`Hola 👋
Quiero apartar las siguientes piezas de *Mi Tesoro MX*:

`;

  carrito.forEach(p => {
    msg += `• ${p.nombre}\n`;
  });

  msg += `
Total: $${total} MXN

Quedo pendiente para confirmar disponibilidad 🙌`;

  document.getElementById("whatsBtn").href =
    "https://wa.me/524761232612?text=" + encodeURIComponent(msg);
}

/* =========================
   VACIAR CARRITO
========================= */
document.getElementById("vaciarCarrito").onclick = () => {
  if (!confirm("¿Vaciar carrito?")) return;
  carrito = [];
  localStorage.removeItem("carrito");
  location.reload();
};

/* =========================
   DRAWER CARRITO
========================= */
const drawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("cartOverlay");

document.getElementById("verCarrito").onclick = () => {
  drawer.classList.add("open");
  overlay.classList.add("show");
  iniciarTemporizador();
};


document.getElementById("cerrarDrawer").onclick = cerrarDrawer;
overlay.onclick = cerrarDrawer;

function cerrarDrawer() {
  drawer.classList.remove("open");
  overlay.classList.remove("show");
}

/* =========================
   MODO OSCURO / CLARO
========================= */
const btnTheme = document.getElementById("toggleTheme");
const tema = localStorage.getItem("tema");

if (tema === "dark") {
  document.body.classList.add("dark");
  btnTheme.textContent = "☀️";
}

btnTheme.onclick = () => {
  document.body.classList.toggle("dark");
  const oscuro = document.body.classList.contains("dark");
  btnTheme.textContent = oscuro ? "☀️" : "🌙";
  localStorage.setItem("tema", oscuro ? "dark" : "light");
};

/* =========================
   CONTADOR DE VISITAS
========================= */
(function contadorVisitas() {
  let visitas = localStorage.getItem("visitasPagina");

  if (!visitas) {
    visitas = 1;
  } else {
    visitas = parseInt(visitas) + 1;
  }

  localStorage.setItem("visitasPagina", visitas);

  const el = document.getElementById("visitasCount");
  if (el) {
    el.textContent = visitas;
  }
})();

function iniciarTemporizador() {
  let limite = localStorage.getItem("limiteReserva");

  if (!limite) {
    limite = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("limiteReserva", limite);
  }

  const timer = document.getElementById("cartTimer");
  if (!timer) return;

  const intervalo = setInterval(() => {
    const restante = limite - Date.now();

    if (restante <= 0) {
      clearInterval(intervalo);
      timer.textContent = "Reserva expirada";
      return;
    }

    const h = Math.floor(restante / 3600000);
    const m = Math.floor((restante % 3600000) / 60000);

    timer.textContent = `⏳ Reserva válida: ${h}h ${m}m`;
  }, 1000);
}

// FAQ toggle
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = btn.nextElementSibling;
    answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
  });
});
const toast = document.getElementById("cartToast");
const toastText = document.getElementById("toastText");

function mostrarToast(nombreProducto) {
  toastText.textContent = `"${nombreProducto}" se agregó al carrito`;
  toast.style.display = "block";

  clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.style.display = "none";
  }, 3500);
}

document.getElementById("toastCerrar").onclick = () => {
  toast.style.display = "none";
};

document.getElementById("toastVerCarrito").onclick = () => {
  toast.style.display = "none";
  drawer.classList.add("open");
  overlay.classList.add("show");
};
