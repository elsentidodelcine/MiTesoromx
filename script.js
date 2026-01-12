let productosGlobal = [];

fetch("productos.json")
  .then(res => res.json())
  .then(data => {
    productosGlobal = data;
    crearFiltros(data);
    mostrarProductos(data);
  });

function crearFiltros(productos) {
  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria))];
  const nav = document.getElementById("filtros");

  categorias.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.onclick = () => filtrar(cat);
    if (cat === "Todos") btn.classList.add("active");
    nav.appendChild(btn);
  });
}

function filtrar(categoria) {
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");

  if (categoria === "Todos") {
    mostrarProductos(productosGlobal);
  } else {
    mostrarProductos(productosGlobal.filter(p => p.categoria === categoria));
  }
}

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
        <a class="boton"
           href="https://wa.me/524761231612?text=Hola, me interesa ${p.nombre}"
           target="_blank">
           Comprar por WhatsApp
        </a>
      </div>
    `;

    catalogo.appendChild(card);
  });
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

function actualizarWhatsApp(total) {
  let mensaje = "Hola, quiero pedir:\n";

  carrito.forEach(p => {
    mensaje += `- ${p.nombre} x${p.cantidad}\n`;
  });

  mensaje += `\nTotal: $${total} MXN`;

  document.getElementById("whatsBtn").href =
    `https://wa.me/524761232612?text=${encodeURIComponent(mensaje)}`;
}

