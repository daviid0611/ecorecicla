// RF4: el ciudadano registra lo que reciclo. Cumple el limite de 4 pasos del
// RNF3: elegir punto, elegir tipo, escribir cantidad y guardar.

const formRegistro = document.getElementById('form-registro');
const selectPunto = document.getElementById('id_punto');
const selectTipo = document.getElementById('id_tipo');
let puntosCargados = [];

function exigirSesion() {
  const usuario = Sesion.usuario();
  if (!usuario) {
    window.location.href = 'login.html';
    return null;
  }
  document.getElementById('usuario-actual').textContent = 'Sesion: ' + usuario.nombre + ' (' + usuario.rol + ')';
  return usuario;
}

async function cargarPuntos() {
  puntosCargados = await Api.puntosPublicos({});
  selectPunto.insertAdjacentHTML('beforeend', puntosCargados.map((p) =>
    '<option value="' + Number(p.id_punto) + '">' + escapar(p.nombre + ' - ' + p.localidad) + '</option>'
  ).join(''));
}

// Los tipos se filtran segun el punto elegido. El backend rechaza igualmente
// una combinacion invalida: esto solo evita que el usuario se equivoque.
async function cargarTiposDelPunto(idPunto) {
  selectTipo.innerHTML = '<option value="">Seleccione un tipo</option>';
  if (!idPunto) return;

  const punto = puntosCargados.find((p) => String(p.id_punto) === String(idPunto));
  const aceptados = (punto && punto.tipos_aceptados) ? punto.tipos_aceptados.split(', ') : [];
  const tipos = await Api.tiposResiduo();

  selectTipo.insertAdjacentHTML('beforeend', tipos
    .filter((t) => aceptados.includes(t.nombre))
    .map((t) => '<option value="' + Number(t.id_tipo) + '">' + escapar(t.nombre) + '</option>')
    .join(''));
}

function mostrarResumen(registro) {
  document.getElementById('ultimo-registro').innerHTML =
    '<div class="tarjeta"><h3>Registro numero ' + Number(registro.id_registro) + '</h3>' +
    '<p>' + escapar(registro.cantidad_kg) + ' kg de ' + escapar(registro.tipo_residuo) +
    ' en ' + escapar(registro.punto) + '</p>' +
    '<p><strong>CO2 que evitarias:</strong> ' + escapar(registro.co2_estimado_kg) + ' kg</p>' +
    '<p><span class="etiqueta">' + escapar(registro.estado) + '</span> ' +
    'Suma al impacto solo cuando el operador lo apruebe.</p></div>';
}

selectPunto.addEventListener('change', async (evento) => {
  try {
    await cargarTiposDelPunto(evento.target.value);
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
});

formRegistro.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const datos = Object.fromEntries(new FormData(formRegistro));
  try {
    const respuesta = await Api.crearRegistro(datos);
    mostrarMensaje('aviso', respuesta.mensaje, 'ok');
    mostrarResumen(respuesta.registro);
    formRegistro.reset();
    selectTipo.innerHTML = '<option value="">Seleccione primero un punto</option>';
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
    await cargarPuntos();
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
})();
