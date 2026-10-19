// RF5: historial propio con filtros de fecha, tipo y estado.

const formFiltros = document.getElementById('form-filtros');
const cuerpoTabla = document.getElementById('cuerpo-tabla');

function exigirSesion() {
  const usuario = Sesion.usuario();
  if (!usuario) {
    window.location.href = 'login.html';
    return null;
  }
  document.getElementById('usuario-actual').textContent = 'Sesion: ' + usuario.nombre + ' (' + usuario.rol + ')';
  return usuario;
}

// Fecha legible sin depender de librerias externas.
function fechaCorta(valor) {
  return new Date(valor).toLocaleString('es-CO');
}

function filaDeRegistro(r) {
  const clase = r.estado === 'aprobado' ? 'etiqueta' : 'etiqueta inactivo';
  const nota = r.observacion_validacion || r.observaciones || '-';
  return '<tr>' +
    '<td>' + escapar(fechaCorta(r.fecha_registro)) + '</td>' +
    '<td>' + escapar(r.punto) + '</td>' +
    '<td>' + escapar(r.tipo_residuo) + '</td>' +
    '<td>' + escapar(r.cantidad_kg) + '</td>' +
    '<td>' + escapar(r.co2_estimado_kg) + '</td>' +
    '<td><span class="' + clase + '">' + escapar(r.estado) + '</span></td>' +
    '<td>' + escapar(nota) + '</td>' +
    '</tr>';
}

// El CO2 mostrado en el resumen solo cuenta lo aprobado, igual que las vistas.
function pintarResumen(resumen) {
  document.getElementById('resumen').innerHTML =
    '<article class="tarjeta"><h3>' + Number(resumen.total_registros) + '</h3><p>Registros encontrados</p></article>' +
    '<article class="tarjeta"><h3>' + Number(resumen.total_kg_aprobados) + ' kg</h3><p>Reciclado aprobado</p></article>' +
    '<article class="tarjeta"><h3>' + Number(resumen.co2_evitado_kg) + ' kg</h3><p>CO2 evitado</p></article>';
}

async function buscar() {
  const filtros = Object.fromEntries(new FormData(formFiltros));
  const datos = await Api.misRegistros(filtros);
  pintarResumen(datos.resumen);
  cuerpoTabla.innerHTML = datos.registros.length > 0
    ? datos.registros.map(filaDeRegistro).join('')
    : '<tr><td colspan="7">No hay registros con esos filtros.</td></tr>';
}

async function cargarTipos() {
  const tipos = await Api.tiposResiduo();
  document.getElementById('id_tipo').insertAdjacentHTML('beforeend',
    tipos.map((t) => '<option value="' + Number(t.id_tipo) + '">' + escapar(t.nombre) + '</option>').join(''));
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

document.getElementById('salir').addEventListener('click', (evento) => {
  evento.preventDefault();
  Sesion.cerrar();
});

(async function iniciar() {
  if (!exigirSesion()) return;
  try {
    await cargarTipos();
    await buscar();
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
})();
