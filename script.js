/* =========================
   VARIABLES GLOBALES
========================= */
var productosGlobal = [];
var productosFiltrados = [];
var carrito = JSON.parse(localStorage.getItem("carrito")) || [];

/* =========================
   CARGAR PRODUCTOS DESDE JSON
========================= */
fetch("productos.json")
  .then(response => response.json())
  .then(data => {
    data.forEach(p => {
      if (p.stock === undefined) p.stock = 10;
    });

    productosGlobal = data;
    productosFiltrados = [...data];

    crearFiltros(productosGlobal);
    mostrarProductos(productosFiltrados);
    actualizarCarrito();
  })
  .catch(error => {
    console.error("Error al cargar productos:", error);
  });

/* =========================
   FILTROS POR CATEGORÍA
========================= */
function crearFiltros(productos) {
  var nav = document.getElementById("filtros");
  nav.innerHTML = "";

  var categorias = ["Todos"];
  productos.forEach(p => {
    if (!categorias.includes(p.categoria)) {
      categorias.push(p.categoria);
    }
  });

  categorias.forEach(cat => {
    var btn = document.createElement("button");
    btn.textContent = cat;
    btn.dataset.categoria = cat;

    if (cat === "Todos") btn.classList.add("active");

    btn.addEventListener("click", function () {
      document
        .querySelectorAll("#filtros button")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      filtrarCategoria(cat);
    });

    nav.appendChild(btn);
  });
}

function filtrarCategoria(cat) {
  productosFiltrados = cat === "Todos"
    ? [...productosGlobal]
    : productosGlobal.filter(p => p.categoria === cat);

  aplicarBusqueda();
}

/* =========================
   MOSTRAR PRODUCTOS
========================= */
function mostrarProductos(productos) {
  var catalogo = document.getElementById("catalogo");
  catalogo.innerHTML = "";

  productos.forEach(p => {
    var card = document.createElement("div");
    card.className = "producto";

    card.innerHTML = `
      <img src="${p.imagen}" alt="${p.nombre}">
      <div class="info">
        <h2>${p.nombre}</h2>
        <p class="categoria">${p.categoria}</p>
        <p class="precio">$${p.precio} MXN</p>
      </div>
    `;

    var btn = document.createElement("button");
    btn.className = "boton";
    btn.textContent = "Agregar al carrito";
    btn.onclick = () => agregarAlCarrito(p);

    card.querySelector(".info").appendChild(btn);
    catalogo.appendChild(card);
  });
}

/* =========================
   BUSCADOR
========================= */
var buscador = document.getElementById("buscador");
buscador.addEventListener("input", aplicarBusqueda);

function aplicarBusqueda() {
  var texto = buscador.value.toLowerCase();

  var resultado = productosFiltrados.filter(p =>
    p.nombre.toLowerCase().includes(texto) ||
    p.categoria.toLowerCase().includes(texto)
  );

  mostrarProductos(resultado);
}

/* =========================
   CARRITO
========================= */
function agregarAlCarrito(producto) {
  if (producto.stock <= 0) {
    alert("Producto agotado");
    return;
  }

  producto.stock--;

  var encontrado = carrito.find(p => p.nombre === producto.nombre);

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
}

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarrito();
}

function actualizarCarrito() {
  var lista = document.getElementById("listaCarrito");
  var totalTxt = document.getElementById("total");
  var count = document.getElementById("count");

  lista.innerHTML = "";
  var total = 0;
  var items = 0;

  carrito.forEach(p => {
    total += p.precio * p.cantidad;
    items += p.cantidad;

    var item = document.createElement("p");
    item.textContent = `${p.nombre} x${p.cantidad}`;
    lista.appendChild(item);
  });

  totalTxt.textContent = `Total: $${total} MXN`;
  count.textContent = items;

  actualizarWhatsApp(total);
}

/* =========================
   WHATSAPP
========================= */
function actualizarWhatsApp(total) {
  var mensaje = "Hola, quiero pedir:\n\n";

  carrito.forEach(p => {
    mensaje += `- ${p.nombre} x${p.cantidad}\n`;
  });

  mensaje += `\nTotal: $${total} MXN`;

  document.getElementById("whatsBtn").href =
    "https://wa.me/524761232612?text=" + encodeURIComponent(mensaje);
}

/* =========================
   MODAL CARRITO
========================= */
document.getElementById("verCarrito").onclick = () => {
  document.getElementById("modalCarrito").style.display = "block";
};

function cerrarCarrito() {
  document.getElementById("modalCarrito").style.display = "none";
}

document.getElementById("vaciarCarrito").onclick = () => {
  if (confirm("¿Vaciar carrito?")) {
    carrito = [];
    guardarCarrito();
  }
};

/* =========================
   MODO OSCURO / CLARO
========================= */
var btnTheme = document.getElementById("toggleTheme");
var tema = localStorage.getItem("tema");

if (tema === "dark") {
  document.body.classList.add("dark");
  btnTheme.textContent = "☀️";
}

btnTheme.onclick = () => {
  document.body.classList.toggle("dark");
  var oscuro = document.body.classList.contains("dark");
  btnTheme.textContent = oscuro ? "☀️" : "🌙";
  localStorage.setItem("tema", oscuro ? "dark" : "light");
};
