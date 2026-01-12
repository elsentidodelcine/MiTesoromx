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
