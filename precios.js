document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('precios-container');
  const tabs = document.getElementById('cine-tabs');
  const selectComplejo = document.getElementById('filtro-complejo');
  const complejoWrap = document.getElementById('complejo-filter-wrap');

  let data = [];
  let cadenaActiva = 'cinepolis';
  let complejoActivo = null;

  try {
    const response = await fetch('precios.json');
    if (!response.ok) throw new Error('No se pudo cargar precios.json');
    data = await response.json();

    cargarComplejos();
    render();
  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <div class="error-state">
        No se pudieron cargar los precios.<br>
        Revisa que exista el archivo <strong>precios.json</strong>.
      </div>`;
  }

  // Tabs de cadena
  if (tabs) {
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.cine-tab');
      if (!btn) return;

      tabs.querySelectorAll('.cine-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      cadenaActiva = btn.dataset.cadena;
      cargarComplejos();
      render();
    });
  }

  // Select de complejo
  if (selectComplejo) {
    selectComplejo.addEventListener('change', () => {
      complejoActivo = selectComplejo.value;
      render();
    });
  }

  function getCadena() {
    return data.find(c => c.cadena === cadenaActiva);
  }

  function getComplejo() {
    const cadena = getCadena();
    if (!cadena) return null;
    return (cadena.complejos || []).find(c => c.id === complejoActivo) || cadena.complejos[0];
  }

  function cargarComplejos() {
    const cadena = getCadena();
    if (!cadena || !selectComplejo) return;

    const complejos = cadena.complejos || [];

    // Si solo hay 1 complejo (Movie Center), puedes ocultar el select
    if (complejos.length <= 1) {
      complejoWrap?.classList.add('hidden');
    } else {
      complejoWrap?.classList.remove('hidden');
    }

    selectComplejo.innerHTML = complejos
      .map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.nombre)}</option>`)
      .join('');

    complejoActivo = complejos[0]?.id || null;
    selectComplejo.value = complejoActivo;
  }

  function render() {
    const cadena = getCadena();
    const complejo = getComplejo();

    if (!cadena || !complejo) {
      container.innerHTML = `<div class="error-state">No hay datos para este complejo.</div>`;
      return;
    }

    container.innerHTML = `
      <section class="cine-section active">
        <div class="cine-header">
          <h2>${escapeHTML(cadena.nombreCadena)} — ${escapeHTML(complejo.nombre)}</h2>
          <span class="ubicacion">Precios de referencia</span>
        </div>
        ${tablaBoletos(complejo)}
        ${tablaSnacks(complejo)}
      </section>
    `;
  }

  function tablaBoletos(complejo) {
    // Compatibilidad: si viene como objeto viejo, lo convertimos a arreglo
    let boletos = complejo.boletos || [];
    if (!Array.isArray(boletos)) {
      boletos = [boletos];
    }

    const diasKeys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const diasLabel = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const filas = boletos.map(b => `
      <tr>
        <td>${escapeHTML(b.label || 'Boleto')}</td>
        ${diasKeys.map(dia => {
          const p = b[dia];
          return `<td class="${p == null ? 'na' : 'precio'}">${fmt(p)}</td>`;
        }).join('')}
      </tr>
    `).join('');

    return `
      <div class="table-block">
        <h3><span>★</span> Boletos</h3>
        <div class="table-scroll">
          <table class="precios-table">
            <thead>
              <tr>
                <th>Tipo</th>
                ${diasLabel.map(d => `<th>${d}</th>`).join('')}
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

  function tablaSnacks(complejo) {
    const snacks = complejo.snacks || [];

    const filas = snacks.map(s => `
      <tr>
        <td>${escapeHTML(s.nombre)}</td>
        <td class="${s.chica == null ? 'na' : 'precio'}">${fmt(s.chica)}</td>
        <td class="${s.mediana == null ? 'na' : 'precio'}">${fmt(s.mediana)}</td>
        <td class="${s.grande == null ? 'na' : 'precio'}">${fmt(s.grande)}</td>
        <td class="${s.jumbo == null ? 'na' : 'precio'}">${fmt(s.jumbo)}</td>
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
                <th>Jumbo</th>
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