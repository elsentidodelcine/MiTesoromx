/* =========================
   VARIABLES GLOBALES
========================= */
var productosGlobal = [];
var productosFiltrados = [];
var carrito = JSON.parse(localStorage.getItem("carrito")) || [];

/* =========================
   CARGAR PRODUCTOS DESDE FIREBASE
========================= */
db.collection("productos")
  .where("activo", "==", true)
  .get()
  .then(function (snapshot) {
    var data = [];

    snapshot.forEach(function (doc) {
      var p = doc.data();
      data.push({
        id: doc.id,
        nombre: p.nombre,
        categoria: p.categoria,
        precio: p.precio,
        imagen: p.imagen,
        stock: p.stock
      });
    });

    productosGlobal = data;
    productosFiltrados = data;
    crearFiltros(data);
    mostrarProductos(data);
    actualizarCarrito();
  })
  .catch(function (error) {
    console.error("Error al cargar productos:", error);
  });

/* =========================
   FILTROS POR CATEGORÍA
========================= */
function crearFiltros(productos) {
  var nav = document.getElementById("filtros");
  nav.innerHTML = "";

  var categorias = ["Todos"];
  productos.forEach(function (p) {
    if (categorias.indexOf(p.categoria) === -1) {
      categorias.push(p.categoria);
    }
  });

  categorias.forEach(function (cat) {
    var btn = document.createElement("button");
    btn.textContent = cat;
    btn.onclick = function (e) {
      filtrarCategoria(cat, e);
    };
    if (cat === "Todos") btn.classList.add("active");
    nav.appendChild(btn);
  });
}

function filtrarCategoria(cat, e) {
  var botones = document.querySelectorAll("#filtros button");
  botones.forEach(function (b) {
    b.classList.remove("active");
  });
  e.target.classList.add("active");

  if (cat === "Todos") {
    productosFiltrados = productosGlobal;
  } else {
    productosFiltrados = productosGlobal.filter(function (p) {
      return p.categoria === cat;
    });
  }

  aplicarBusqueda();
}

/* =========================
   MOSTRAR PRODUCTOS
========================= */
function mostrarProductos(productos) {
  var catalogo = document.getElementById("catalogo");
  catalogo.innerHTML = "";

  productos.forEach(function (p) {
    var card = document.createElement("div");
    card.className = "producto";

    card.innerHTML =
      '<img src="' + p.imagen + '" alt="' + p.nombre + '">' +
      '<div class="info">' +
      '<h2>' + p.nombre + '</h2>' +
      '<p>' + p.categoria + '</p>' +
      '<p class="precio">$' + p.precio + ' MXN</p>' +
      '</div>';

    var btn = document.createElement("button");
    btn.className = "boton";
    btn.textContent = "Agregar al carrito";
    btn.onclick = function () {
      agregarAlCarrito(p);
    };

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

  var resultado = productosFiltrados.filter(function (p) {
    return (
      p.nombre.toLowerCase().indexOf(texto) !== -1 ||
      p.categoria.toLowerCase().indexOf(texto) !== -1
    );
  });

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

  var encontrado = null;
  carrito.forEach(function (p) {
    if (p.id === producto.id) {
      encontrado = p;
    }
  });

  if (encontrado) {
    encontrado.cantidad++;
  } else {
    carrito.push({
      id: producto.id,
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

  carrito.forEach(function (p) {
    total += p.precio * p.cantidad;
    items += p.cantidad;

    var item = document.createElement("p");
    item.textContent = p.nombre + " x" + p.cantidad;
    lista.appendChild(item);
  });

  totalTxt.textContent = "Total: $" + total + " MXN";
  count.textContent = items;

  actualizarWhatsApp(total);
}

/* =========================
   WHATSAPP
========================= */
function actualizarWhatsApp(total) {
  var mensaje = "Hola, quiero pedir:\n\n";

  carrito.forEach(function (p) {
    mensaje += "- " + p.nombre + " x" + p.cantidad + "\n";
  });

  mensaje += "\nTotal: $" + total + " MXN";

  document.getElementById("whatsBtn").href =
    "https://wa.me/524761231612?text=" + encodeURIComponent(mensaje);
}

/* =========================
   MODAL CARRITO
========================= */
document.getElementById("verCarrito").onclick = function () {
  document.getElementById("modalCarrito").style.display = "block";
};

function cerrarCarrito() {
  document.getElementById("modalCarrito").style.display = "none";
}

/* =========================
   MODO OSCURO / CLARO
========================= */
var btnTheme = document.getElementById("toggleTheme");
var tema = localStorage.getItem("tema");

if (tema === "dark") {
  document.body.classList.add("dark");
  btnTheme.textContent = "☀️";
}

btnTheme.onclick = function () {
  document.body.classList.toggle("dark");
  var oscuro = document.body.classList.contains("dark");
  btnTheme.textContent = oscuro ? "☀️" : "🌙";
  localStorage.setItem("tema", oscuro ? "dark" : "light");
};
