// RF6 (reporte por periodo) y RF7 (estadisticas ambientales).

const formReporte = document.getElementById('form-reporte');

function exigirSesion() {
  const usuario = Sesion.usuario();
  if (!usuario) {
    window.location.href = 'login.html';
    return null;
  }
  document.getElementById('usuario-actual').textContent = 'Sesion: ' + usuario.nombre + ' (' + usuario.rol + ')';
  return usuario;
}

function tarjetaResumen(valor, texto) {
  return '<article class="tarjeta"><h3>' + escapar(valor) + '</h3><p>' + escapar(texto) + '</p></article>';
}

function filasPorTipo(filas) {
  if (filas.length === 0) return '<tr><td colspan="3">Sin datos aprobados en el periodo.</td></tr>';
  return filas.map((f) =>
    '<tr><td>' + escapar(f.tipo_residuo) + '</td><td>' + escapar(f.total_kg) + '</td><td>' +
    escapar(f.co2_evitado_kg) + '</td></tr>').join('');
}

async function generarReporte(datos) {
  const reporte = datos.alcance === 'global'
    ? await Api.reporteGlobal(datos)
    : await Api.reportePersonal(datos);

  document.getElementById('totales-reporte').innerHTML =
    tarjetaResumen(reporte.totales.total_kg + ' kg', 'Total reciclado del periodo') +
    tarjetaResumen(reporte.totales.co2_evitado_kg + ' kg', 'CO2 evitado del periodo');

  document.getElementById('detalle-reporte').innerHTML = filasPorTipo(reporte.detalle_por_tipo);
  mostrarMensaje('aviso', 'Reporte generado del ' + reporte.periodo.desde + ' al ' + reporte.periodo.hasta, 'ok');
}

async function cargarEstadisticas() {
  const datos = await Api.estadisticas();

  document.getElementById('totales-globales').innerHTML =
    tarjetaResumen(datos.totales.total_kg + ' kg', 'Reciclaje aprobado acumulado') +
    tarjetaResumen(datos.totales.co2_evitado_kg + ' kg', 'CO2 evitado acumulado');

  document.getElementById('tabla-mes').innerHTML = datos.por_mes.length > 0
    ? datos.por_mes.map((f) =>
        '<tr><td>' + escapar(f.mes) + '</td><td>' + escapar(f.tipo_residuo) + '</td><td>' +
        escapar(f.total_kg) + '</td><td>' + escapar(f.co2_evitado_kg) + '</td></tr>').join('')
    : '<tr><td colspan="4">Aun no hay registros aprobados.</td></tr>';

  document.getElementById('tabla-ranking').innerHTML = datos.ranking_puntos.length > 0
    ? datos.ranking_puntos.map((f, indice) =>
        '<tr><td>' + (indice + 1) + '</td><td>' + escapar(f.punto) + '</td><td>' + escapar(f.localidad) +
        '</td><td>' + escapar(f.total_kg) + '</td><td>' + escapar(f.co2_evitado_kg) + '</td></tr>').join('')
    : '<tr><td colspan="5">Aun no hay registros aprobados.</td></tr>';
}

formReporte.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  try {
    await generarReporte(Object.fromEntries(new FormData(formReporte)));
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
});

document.getElementById('salir').addEventListener('click', (evento) => {
  evento.preventDefault();
  Sesion.cerrar();
});

(async function iniciar() {
  if (!exigirSesion()) return;
  try {
    await cargarEstadisticas();
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
})();
