let productosGlobal = [];
let productosFiltrados = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

let paginaActual = 1;
const productosPorPagina = 12;

/* === CARGA === */
fetch("productos.json")
  .then(r => r.json())
  .then(data => {
    productosGlobal = data;
    productosFiltrados = data;
    crearFiltros(data);
    render();
    actualizarCarrito();
  });

/* === RENDER GENERAL === */
function render() {
  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  mostrarProductos(productosFiltrados.slice(inicio, fin));
  crearPaginacion();
}

/* === PAGINACIÓN === */
function crearPaginacion() {
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
  const pag = document.getElementById("paginacion");
  pag.innerHTML = "";

  for (let i = 1; i <= totalPaginas; i++) {
    const b = document.createElement("button");
    b.textContent = i;
    if (i === paginaActual) b.classList.add("active");
    b.onclick = () => {
      paginaActual = i;
      render();
    };
    pag.appendChild(b);
  }
}

/* === MOSTRAR === */
function mostrarProductos(lista) {
  const c = document.getElementById("catalogo");
  c.innerHTML = "";

  lista.forEach(p => {
    const d = document.createElement("div");
    d.className = "producto";

    let badgeHTML = "";

    if (p.badge) {
      badgeHTML = `<span class="badge ${p.badge}">${p.badge}</span>`;
    } else if (p.stock !== undefined && p.stock <= 3) {
      badgeHTML = `<span class="badge stock">Últimas piezas</span>`;
    }

    d.innerHTML = `
      ${badgeHTML}
      <img src="${p.imagen}">
      <div class="info">
        <h2>${p.nombre}</h2>
        <p>${p.categoria}</p>
        <div class="precio">$${p.precio} MXN</div>
        <button class="boton">Agregar al carrito</button>
      </div>
    `;

    d.querySelector("button").onclick = () => agregarAlCarrito(p);
    c.appendChild(d);
  });
}


/* === BUSCADOR === */
buscador.oninput = () => {
  const t = buscador.value.toLowerCase();
  productosFiltrados = productosGlobal.filter(p =>
    p.nombre.toLowerCase().includes(t) ||
    p.categoria.toLowerCase().includes(t)
  );
  paginaActual = 1;
  render();
};

/* === FILTROS === */
function crearFiltros(p) {
  const nav = document.getElementById("filtros");
  const cats = ["Todos", ...new Set(p.map(x => x.categoria))];
  nav.innerHTML = "";
  cats.forEach(c => {
    const b = document.createElement("button");
    b.textContent = c;
    b.onclick = () => {
      productosFiltrados = c === "Todos" ? productosGlobal : productosGlobal.filter(p => p.categoria === c);
      paginaActual = 1;
      render();
    };
    nav.appendChild(b);
  });
}

/* === CARRITO === */
function agregarAlCarrito(p) {
  const e = carrito.find(i => i.nombre === p.nombre);
  e ? e.cantidad++ : carrito.push({...p, cantidad:1});
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarrito();
}

function actualizarCarrito() {
  count.textContent = carrito.reduce((a,b)=>a+b.cantidad,0);
}
