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
      p.badge = "Nuevo";
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
      ${p.badge ? `<span class="badge nuevo">${p.badge}</span>` : ""}
      <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">
      <div class="info">
        <h2>${p.nombre}</h2>
        <p>${p.categoria}</p>
        <p class="precio">$${p.precio} MXN</p>
        <button class="boton" ${p.stock <= 0 ? "disabled" : ""}>
          ${p.stock <= 0 ? "Agotado" : "Agregar al carrito"}
        </button>
      </div>
    `;

    const btn = card.querySelector("button");
    if (p.stock > 0) {
      btn.onclick = () => agregarAlCarrito(p, card);
    }

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

  card.classList.add("added");
  setTimeout(() => card.classList.remove("added"), 600);

  render();
}

function actualizarCarritoUI() {
  document.getElementById("count").textContent =
    carrito.reduce((a, b) => a + b.cantidad, 0);

  const items = document.getElementById("cartItems");
  const totalTxt = document.getElementById("cartTotal");

  items.innerHTML = "";
  let total = 0;

  if (carrito.length === 0) {
    items.innerHTML = "<p>Tu carrito está vacío</p>";
    totalTxt.textContent = "Total: $0 MXN";
    return;
  }

  carrito.forEach((p, index) => {
    total += p.precio * p.cantidad;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <strong>${p.nombre}</strong>

      <div class="cart-qty">
        <button onclick="cambiarCantidad(${index}, -1)">−</button>
        <span>${p.cantidad}</span>
        <button onclick="cambiarCantidad(${index}, 1)">+</button>
      </div>

      <button class="cart-remove" onclick="eliminarProducto(${index})">🗑</button>
    `;

    items.appendChild(div);
  });

  totalTxt.textContent = `Total: $${total} MXN`;
  actualizarWhats(total);
}

function cambiarCantidad(index, cambio) {
  carrito[index].cantidad += cambio;

  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarritoUI();
}

function eliminarProducto(index) {
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarritoUI();
}

function actualizarWhats(total) {
  let msg = "Hola, quiero pedir:\n\n";
  carrito.forEach(p => {
    msg += `- ${p.nombre} x${p.cantidad}\n`;
  });
  msg += `\nTotal: $${total} MXN`;

  document.getElementById("whatsBtn").href =
    "https://wa.me/524761232612?text=" + encodeURIComponent(msg);
}

document.getElementById("vaciarCarrito").onclick = () => {
  if (!confirm("¿Vaciar carrito?")) return;

  carrito = [];
  localStorage.removeItem("carrito");

  // Recargar página para reiniciar todo correctamente
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

const btnEnvios = document.getElementById("verEnvios");
const modalEnvios = document.getElementById("modalEnvios");
const cerrarEnvios = document.getElementById("cerrarEnvios");
const enviosOverlay = document.getElementById("enviosOverlay");

btnEnvios.onclick = e => {
  e.preventDefault();
  modalEnvios.style.display = "flex";
  enviosOverlay.classList.add("show");
};

cerrarEnvios.onclick = cerrarModalEnvios;
enviosOverlay.onclick = cerrarModalEnvios;

function cerrarModalEnvios() {
  modalEnvios.style.display = "none";
  enviosOverlay.classList.remove("show");
}

const btnPagos = document.getElementById("verPagos");
const modalPagos = document.getElementById("modalPagos");
const cerrarPagos = document.getElementById("cerrarPagos");
const pagosOverlay = document.getElementById("pagosOverlay");

if (btnPagos) {
  btnPagos.onclick = e => {
    e.preventDefault();
    modalPagos.style.display = "flex";
    pagosOverlay.classList.add("show");
  };
}

cerrarPagos.onclick = cerrarModalPagos;
pagosOverlay.onclick = cerrarModalPagos;

function cerrarModalPagos() {
  modalPagos.style.display = "none";
  pagosOverlay.classList.remove("show");
}

