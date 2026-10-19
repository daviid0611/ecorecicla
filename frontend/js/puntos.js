// RF3: consulta publica de puntos activos con filtros por tipo y localidad.

const formFiltros = document.getElementById('form-filtros');
const lista = document.getElementById('lista-puntos');

function tarjetaDePunto(p) {
  const mapa = p.latitud && p.longitud
    ? '<p><a href="https://www.google.com/maps?q=' + Number(p.latitud) + ',' + Number(p.longitud) +
      '" target="_blank" rel="noopener">Ver en el mapa</a></p>'
    : '';
  return '<article class="tarjeta">' +
    '<h3>' + escapar(p.nombre) + '</h3>' +
    '<p>' + escapar(p.direccion) + ' - ' + escapar(p.localidad) + '</p>' +
    '<p><strong>Horario:</strong> ' + escapar(p.horario || 'No informado') + '</p>' +
    '<p><strong>Acepta:</strong> ' + escapar(p.tipos_aceptados || 'Sin tipos asignados') + '</p>' +
    mapa +
    '</article>';
}

async function cargarFiltros() {
  const [tipos, localidades] = await Promise.all([Api.tiposResiduo(), Api.localidades()]);
  document.getElementById('id_tipo').insertAdjacentHTML('beforeend',
    tipos.map((t) => '<option value="' + Number(t.id_tipo) + '">' + escapar(t.nombre) + '</option>').join(''));
  document.getElementById('localidad').insertAdjacentHTML('beforeend',
    localidades.map((l) => '<option value="' + escapar(l) + '">' + escapar(l) + '</option>').join(''));
}

async function buscar() {
  const filtros = Object.fromEntries(new FormData(formFiltros));
  const puntos = await Api.puntosPublicos(filtros);
  document.getElementById('contador').textContent = puntos.length + ' punto(s) encontrado(s)';
  lista.innerHTML = puntos.length > 0
    ? puntos.map(tarjetaDePunto).join('')
    : '<p class="mensaje error">No hay puntos activos con esos filtros.</p>';
}

formFiltros.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  try {
    await buscar();
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
});

document.getElementById('btn-limpiar').addEventListener('click', async () => {
  formFiltros.reset();
  await buscar();
});

(async function iniciar() {
  try {
    await cargarFiltros();
    await buscar();
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
})();
