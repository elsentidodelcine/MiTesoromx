/* =========================
   VARIABLES GLOBALES
========================= */
let productosGlobal = [];
let productosFiltrados = [];
let carrito = [];

/* =========================
   CARGA DE PRODUCTOS
========================= */
fetch("productos.json")
  .then(res => res.json())
  .then(data => {
    productosGlobal = data;
    productosFiltrados = data;
    crearFiltros(data);
    mostrarProductos(productosFiltrados);
  });

/* =========================
   FILTROS POR CATEGORÍA
========================= */
function crearFiltros(productos) {
  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria))];
  const nav = document.getElementById("filtros");
  nav.innerHTML = "";

  categorias.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.onclick = (e) => filtrar(cat, e);
    if (cat === "Todos") btn.classList.add("active");
    nav.appendChild(btn);
  });
}

function filtrar(categoria, e) {
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  e.target.classList.add("active");

  productosFiltrados =
    categoria === "Todos"
      ? productosGlobal
      : productosGlobal.filter(p => p.categoria === categoria);

  aplicarBusqueda();
}

/* =========================
   MOSTRAR PRODUCTOS
========================= */
function mostrarProductos(productos) {
  const catalogo = document.getElementById("catalogo");
  catalogo.innerHTML = "";

  productos.forEach(p => {
    const card = document.createElement("div");
    card.className = "producto";

    card.innerHTML = `
      <img src="${p.imagen}">
      <div class="info">
        <h2>${p.nombre}</h2>
        <p>${p.categoria}</p>
        <p class="precio">$${p.precio} MXN</p>
        <button class="boton" onclick='agregarAlCarrito(${JSON.stringify(p)})'>
          Agregar al carrito
        </button>
      </div>
    `;

    catalogo.appendChild(card);
  });
}

/* =========================
   BUSCADOR AVANZADO
========================= */
const inputBuscador = document.getElementById("buscador");

inputBuscador.addEventListener("input", aplicarBusqueda);

function aplicarBusqueda() {
  const texto = inputBuscador.value.toLowerCase().trim();

  if (texto === "") {
    mostrarProductos(productosFiltrados);
    return;
  }

  const resultado = productosFiltrados.filter(p =>
    p.nombre.toLowerCase().includes(texto) ||
    p.categoria.toLowerCase().includes(texto)
  );

  mostrarProductos(resultado);
}

/* =========================
   CARRITO CON LOCALSTORAGE
========================= */
const modal = document.getElementById("modalCarrito");
const listaCarrito = document.getElementById("listaCarrito");
const totalTexto = document.getElementById("total");
const contador = document.getElementById("count");

carrito = JSON.parse(localStorage.getItem("carrito")) || [];
actualizarCarrito();

document.getElementById("verCarrito").onclick = () => {
  modal.style.display = "block";
};

function cerrarCarrito() {
  modal.style.display = "none";
}

function agregarAlCarrito(producto) {
  const existente = carrito.find(p => p.nombre === producto.nombre);

  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  guardarCarrito();
}

function quitarDelCarrito(nombre) {
  carrito = carrito.filter(p => p.nombre !== nombre);
  guardarCarrito();
}

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarrito();
}

function actualizarCarrito() {
  listaCarrito.innerHTML = "";
  let total = 0;
  let items = 0;

  carrito.forEach(p => {
    total += p.precio * p.cantidad;
    items += p.cantidad;

    listaCarrito.innerHTML += `
      <p>
        ${p.nombre} x${p.cantidad}
        <button onclick="quitarDelCarrito('${p.nombre}')">❌</button>
      </p>
    `;
  });

  totalTexto.textContent = `Total: $${total} MXN`;
  contador.textContent = items;

  actualizarWhatsApp(total);
}

/* =========================
   WHATSAPP CON RESUMEN
========================= */
function actualizarWhatsApp(total) {
  let mensaje = "Hola, quiero pedir:\n";

  carrito.forEach(p => {
    mensaje += `- ${p.nombre} x${p.cantidad}\n`;
  });

  mensaje += `\nTotal: $${total} MXN`;

  document.getElementById("whatsBtn").href =
    `https://wa.me/524761231612?text=${encodeURIComponent(mensaje)}`;
}

/* =========================
   CERRAR MODAL AL CLICK FUERA
========================= */
window.onclick = e => {
  if (e.target === modal) cerrarCarrito();
};
