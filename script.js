
fetch('productos.json')
  .then(res => res.json())
  .then(productos => {
    const catalogo = document.getElementById('catalogo');

    productos.forEach(p => {
      const card = document.createElement('div');
      card.className = 'producto';

      card.innerHTML = `
        <img src="${p.imagen}">
        <h2>${p.nombre}</h2>
        <p>${p.categoria}</p>
        <p><strong>$${p.precio} MXN</strong></p>
        <a class="boton"
           href="https://wa.me/521XXXXXXXXXX?text=Hola, me interesa ${p.nombre}"
           target="_blank">
           Comprar
        </a>
      `;

      catalogo.appendChild(card);
    });
  });
