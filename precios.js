document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('precios-container');
  const tabs = document.getElementById('cine-tabs');

  let cines = [];
  let cineActivo = 'cinepolis';

  try {
    const response = await fetch('precios.json');
    if (!response.ok) throw new Error('No se pudo cargar precios.json');
    cines = await response.json();

    renderTodo();
  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <div class="error-state">
        No se pudieron cargar los precios.<br>
        Revisa que exista el archivo <strong>precios.json</strong>.
      </div>`;
  }

  if (tabs) {
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.cine-tab');
      if (!btn) return;

      tabs.querySelectorAll('.cine-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      cineActivo = btn.dataset.cine;
      mostrarSeccion(cineActivo);
    });
  }

  function renderTodo() {
    container.innerHTML = cines.map((cine, i) => {
      const active = cine.id === cineActivo ? 'active' : '';
      return `
        <section class="cine-section ${active}" id="section-${escapeHTML(cine.id)}" data-cine="${escapeHTML(cine.id)}">
          <div class="cine-header">
            <h2>${escapeHTML(cine.nombre)}</h2>
            <span class="ubicacion">${escapeHTML(cine.ubicacion || '')}</span>
          </div>

          ${tablaBoletos(cine)}
          ${tablaSnacks(cine)}
        </section>
      `;
    }).join('');
  }

  function mostrarSeccion(id) {
    document.querySelectorAll('.cine-section').forEach(sec => {
      sec.classList.toggle('active', sec.dataset.cine === id);
    });
  }

  function tablaBoletos(cine) {
    const b = cine.boletos || {};
    const dias = [
      ['Lun', b.lunes],
      ['Mar', b.martes],
      ['Mié', b.miercoles],
      ['Jue', b.jueves],
      ['Vie', b.viernes],
      ['Sáb', b.sabado],
      ['Dom', b.domingo]
    ];

    return `
      <div class="table-block">
        <h3><span>★</span> ${escapeHTML(b.label || 'Boletos')}</h3>
        <div class="table-scroll">
          <table class="precios-table">
            <thead>
              <tr>
                <th>Concepto</th>
                ${dias.map(([d]) => `<th>${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Boleto 2D</td>
                ${dias.map(([, p]) => `<td class="precio">${fmt(p)}</td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function tablaSnacks(cine) {
    const snacks = cine.snacks || [];

    const filas = snacks.map(s => `
      <tr>
        <td>${escapeHTML(s.nombre)}</td>
        <td class="${s.chica == null ? 'na' : 'precio'}">${fmt(s.chica)}</td>
        <td class="${s.mediana == null ? 'na' : 'precio'}">${fmt(s.mediana)}</td>
        <td class="${s.grande == null ? 'na' : 'precio'}">${fmt(s.grande)}</td>
      </tr>
    `).join('');

    return `
      <div class="table-block">
        <h3><span>★</span> Dulcero / Snacks</h3>
        <div class="table-scroll">
          <table class="precios-table snacks-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Chica</th>
                <th>Mediana</th>
                <th>Grande</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function fmt(valor) {
    if (valor == null || valor === '') return '—';
    return `$${Number(valor)}`;
  }

  function escapeHTML(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});