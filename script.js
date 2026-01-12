let productosGlobal = [];
let productosFiltrados = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

/* CARGA PRODUCTOS */
fetch("productos.json")
  .then(res => res.json())
  .then(data => {
    productosGlobal = data;
    productosFiltrados = data;
    crearFiltros(data);
    mostrarProductos(data);
    actualizarCarrito();
  });

/* FILTROS */
function crearFiltros(productos) {
  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria))];
  const nav = document.getElementById("filtros");
  nav.innerHTML = "";

  categorias.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.onclick = e => filtrar(cat, e);
    if (cat === "Todos") btn.classList.add("active");
    nav.appendChild(btn);
  });
}

function filtrar(cat, e) {
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  e.target.classList.add("active");

  productosFiltrados = cat === "Todos"
    ? productosGlobal
    : productosGlobal.filter(p => p.categoria === cat);

  aplicarBusqueda();
}

/* MOSTRAR */
function mostrarProductos(productos) {
  const catalogo = document.getElementById("catalogo");
  catalogo.innerHTML = "";

  productos.forEach(p => {
    const card = document.createElement("div");
    card.className = "producto";

    card.innerHTML = `
      <img src="${p.imagen}">
      <div class="info">
        <h3>${p.nombre}</h3>
        <p>${p.categoria}</p>
        <p class="precio">$${p.precio} MXN</p>
      </div>
    `;

    const btn = document.createElement("button");
    btn.className = "boton";
    btn.textContent = "Agregar al carrito";
    btn.onclick = () => agregarAlCarrito(p);

    card.querySelector(".info").appendChild(btn);
    catalogo.appendChild(card);
  });
}

/* BUSCADOR */
document.getElementById("buscador").addEventListener("input", aplicarBusqueda);

function aplicarBusqueda() {
  const t = buscador.value.toLowerCase();
  mostrarProductos(
    productosFiltrados.filter(p =>
      p.nombre.toLowerCase().includes(t) ||
      p.categoria.toLowerCase().includes(t)
    )
  );
}

/* CARRITO */
function agregarAlCarrito(p) {
  const e = carrito.find(i => i.nombre === p.nombre);
  e ? e.cantidad++ : carrito.push({ ...p, cantidad: 1 });
  guardar();
}

function guardar() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarrito();
}

function actualizarCarrito() {
  const lista = document.getElementById("listaCarrito");
  const totalTxt = document.getElementById("total");
  const count = document.getElementById("count");

  lista.innerHTML = "";
  let total = 0, items = 0;

  carrito.forEach(p => {
    total += p.precio * p.cantidad;
    items += p.cantidad;
    lista.innerHTML += `<p>${p.nombre} x${p.cantidad}</p>`;
  });

  totalTxt.textContent = `Total: $${total} MXN`;
  count.textContent = items;

  document.getElementById("whatsBtn").href =
    `https://wa.me/524761231612?text=${encodeURIComponent(JSON.stringify(carrito))}`;
}

document.getElementById("verCarrito").onclick = () =>
  document.getElementById("modalCarrito").style.display = "block";

function cerrarCarrito() {
  document.getElementById("modalCarrito").style.display = "none";
}

/* MODO OSCURO */
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
