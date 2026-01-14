let productosGlobal = [];
let productosFiltrados = [];
let paginaActual = 1;
const porPagina = 8;

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

/* CARGAR PRODUCTOS */
fetch("productos.json")
  .then(r => r.json())
  .then(data => {
    data.forEach(p => {
      p.stock = 1;
      p.badge = "nuevo";
    });

    productosGlobal = data;
    productosFiltrados = data;

    crearFiltros(data);
    mostrarProductos(data);
    actualizarCarrito();

    document.getElementById("loader").style.display = "none";
  });


/* FILTROS */
function crearFiltros(productos) {
  const nav = document.getElementById("filtros");
  nav.innerHTML = "";

  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria))];

  categorias.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    if (cat === "Todos") btn.classList.add("active");

    btn.onclick = e => {
      document.querySelectorAll(".filtros button").forEach(b => b.classList.remove("active"));
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

const selectOrden = document.getElementById("ordenar");

selectOrden.addEventListener("change", () => {
  ordenarProductos();
  paginaActual = 1;
  render();
});

function ordenarProductos() {
  const valor = selectOrden.value;

  productosFiltrados.sort((a, b) => {
    switch (valor) {
      case "nombre-asc":
        return a.nombre.localeCompare(b.nombre);
      case "nombre-desc":
        return b.nombre.localeCompare(a.nombre);
      case "precio-asc":
        return a.precio - b.precio;
      case "precio-desc":
        return b.precio - a.precio;
      default:
        return 0;
    }
  });
}


/* RENDER GENERAL */
function render() {
  mostrarProductos();
  crearPaginacion();
}

/* MOSTRAR PRODUCTOS */
function mostrarProductos() {
  const catalogo = document.getElementById("catalogo");
  catalogo.innerHTML = "";

  const inicio = (paginaActual - 1) * porPagina;
  const visibles = productosFiltrados.slice(inicio, inicio + porPagina);

  visibles.forEach(p => {
    const card = document.createElement("div");
    card.className = "producto";

    if (p.badge) {
      card.innerHTML += `<span class="badge ${p.badge}">${p.badge}</span>`;
    }

    card.innerHTML += `
      <img src="${p.imagen}" loading="lazy">
      <div class="info">
        <h3>${p.nombre}</h3>
        <p>${p.categoria}</p>
        <p class="precio">$${p.precio} MXN</p>
        <button class="boton">Agregar al carrito</button>
      </div>
    `;

    card.querySelector("button").onclick = () => agregarAlCarrito(p);
    catalogo.appendChild(card);
  });
}

/* PAGINACIÓN */
function crearPaginacion() {
  const cont = document.getElementById("paginacion");
  cont.innerHTML = "";

  const totalPaginas = Math.ceil(productosFiltrados.length / porPagina);

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === paginaActual) btn.classList.add("active");

    btn.onclick = () => {
      paginaActual = i;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    cont.appendChild(btn);
  }
}

/* BUSCADOR */
document.getElementById("buscador").addEventListener("input", e => {
  const t = e.target.value.toLowerCase();
  productosFiltrados = productosGlobal.filter(p =>
    p.nombre.toLowerCase().includes(t) ||
    p.categoria.toLowerCase().includes(t)
  );
  paginaActual = 1;
  render();
});

/* CARRITO */
function agregarAlCarrito(producto) {
  if (producto.stock <= 0) {
    alert("Producto agotado");
    return;
  }

  producto.stock--;

  let encontrado = carrito.find(p => p.nombre === producto.nombre);
  if (encontrado) {
    encontrado.cantidad++;
  } else {
    carrito.push({
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1
    });
  }

  guardarCarrito();

  // animación visual
  const cards = document.querySelectorAll(".producto");
  cards.forEach(card => {
    if (card.querySelector("h2").textContent === producto.nombre) {
      card.classList.add("added");
      setTimeout(() => card.classList.remove("added"), 600);
    }
  });
}


function actualizarCarrito() {
  document.getElementById("count").textContent =
    carrito.reduce((a, b) => a + b.cantidad, 0);
}

/* =========================
   MODO OSCURO / CLARO (FIX)
========================= */
const btnTheme = document.getElementById("toggleTheme");
const temaGuardado = localStorage.getItem("tema");

if (temaGuardado === "dark") {
  document.body.classList.add("dark");
  btnTheme.textContent = "☀️";
}

btnTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const oscuro = document.body.classList.contains("dark");
  btnTheme.textContent = oscuro ? "☀️" : "🌙";
  localStorage.setItem("tema", oscuro ? "dark" : "light");
});
