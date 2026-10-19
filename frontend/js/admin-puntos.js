// RF8: pantalla del administrador. Usa las 5 operaciones del CRUD.

const form = document.getElementById('form-punto');
const cuerpoTabla = document.getElementById('cuerpo-tabla');
const titulo = document.getElementById('titulo-form');
const botonGuardar = document.getElementById('btn-guardar');

// Solo el Administrador puede estar aqui: se corta antes de pedir datos.
function verificarAcceso() {
  const usuario = Sesion.usuario();
  if (!usuario || usuario.rol !== 'Administrador') {
    window.location.href = 'login.html';
    return null;
  }
  document.getElementById('usuario-actual').textContent =
    'Sesion: ' + usuario.nombre + ' (' + usuario.rol + ')';
  return usuario;
}

function pintarTipos(tipos) {
  document.getElementById('casillas-tipos').innerHTML = tipos.map((t) =>
    '<label><input type="checkbox" name="tipos" value="' + Number(t.id_tipo) + '"> ' + escapar(t.nombre) + '</label>'
  ).join('');
}

function filaDePunto(p) {
  const clase = p.estado === 'inactivo' ? 'etiqueta inactivo' : 'etiqueta';
  return '<tr>' +
    '<td>' + Number(p.id_punto) + '</td>' +
    '<td>' + escapar(p.nombre) + '</td>' +
    '<td>' + escapar(p.direccion) + '</td>' +
    '<td>' + escapar(p.localidad) + '</td>' +
    '<td>' + escapar(p.horario || '-') + '</td>' +
    '<td>' + escapar(p.tipos_aceptados || '-') + '</td>' +
    '<td><span class="' + clase + '">' + escapar(p.estado) + '</span></td>' +
    '<td class="acciones">' +
      '<button type="button" data-editar="' + Number(p.id_punto) + '">Editar</button>' +
      '<button type="button" class="peligro" data-desactivar="' + Number(p.id_punto) + '">Desactivar</button>' +
    '</td></tr>';
}

async function cargarTabla() {
  const puntos = await Api.listarPuntos();
  cuerpoTabla.innerHTML = puntos.map(filaDePunto).join('');
}

function limpiarFormulario() {
  form.reset();
  document.getElementById('id_punto').value = '';
  titulo.textContent = 'Nuevo punto de reciclaje';
  botonGuardar.textContent = 'Crear punto';
}

async function cargarEnFormulario(id) {
  const punto = await Api.obtenerPunto(id);
  document.getElementById('id_punto').value = punto.id_punto;
  ['nombre', 'direccion', 'localidad', 'horario', 'estado'].forEach((campo) => {
    document.getElementById(campo).value = punto[campo] || '';
  });
  document.getElementById('latitud').value = punto.latitud || '';
  document.getElementById('longitud').value = punto.longitud || '';

  const aceptados = punto.tipos_aceptados.map((t) => String(t.id_tipo));
  document.querySelectorAll('input[name="tipos"]').forEach((casilla) => {
    casilla.checked = aceptados.includes(casilla.value);
  });

  titulo.textContent = 'Editar punto #' + punto.id_punto;
  botonGuardar.textContent = 'Guardar cambios';
  window.scrollTo(0, 0);
}

function datosDelFormulario() {
  const datos = Object.fromEntries(new FormData(form));
  datos.tipos = Array.from(document.querySelectorAll('input[name="tipos"]:checked'))
    .map((casilla) => Number(casilla.value));
  return datos;
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const datos = datosDelFormulario();
  const id = datos.id_punto;
  try {
    if (id) {
      await Api.actualizarPunto(id, datos);
      mostrarMensaje('aviso', 'Punto actualizado', 'ok');
    } else {
      await Api.crearPunto(datos);
      mostrarMensaje('aviso', 'Punto creado', 'ok');
    }
    limpiarFormulario();
    await cargarTabla();
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
});

cuerpoTabla.addEventListener('click', async (evento) => {
  const boton = evento.target.closest('button');
  if (!boton) return;
  try {
    if (boton.dataset.editar) {
      await cargarEnFormulario(boton.dataset.editar);
    } else if (boton.dataset.desactivar && confirm('Desactivar el punto ' + boton.dataset.desactivar + '?')) {
      await Api.desactivarPunto(boton.dataset.desactivar);
      mostrarMensaje('aviso', 'Punto desactivado (borrado logico)', 'ok');
      await cargarTabla();
    }
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
});

document.getElementById('btn-cancelar').addEventListener('click', limpiarFormulario);
document.getElementById('salir').addEventListener('click', (evento) => {
  evento.preventDefault();
  Sesion.cerrar();
});

(async function iniciar() {
  if (!verificarAcceso()) return;
  try {
    pintarTipos(await Api.tiposResiduo());
    await cargarTabla();
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
})();
