// RF9: el administrador crea, edita y elimina tipos de residuo.

const form = document.getElementById('form-tipo');
const cuerpoTabla = document.getElementById('cuerpo-tabla');
const titulo = document.getElementById('titulo-form');
const botonGuardar = document.getElementById('btn-guardar');

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

// Un tipo en uso no se puede borrar: se deshabilita el boton en vez de
// dejar que el usuario descubra el 409 a golpes.
function botonEliminar(t) {
  const enUso = Number(t.registros) > 0 || Number(t.puntos) > 0;
  if (enUso) {
    return '<button type="button" class="peligro" disabled title="Esta en uso">Eliminar</button>';
  }
  return '<button type="button" class="peligro" data-eliminar="' + Number(t.id_tipo) + '">Eliminar</button>';
}

function filaDeTipo(t) {
  return '<tr>' +
    '<td>' + Number(t.id_tipo) + '</td>' +
    '<td>' + escapar(t.nombre) + '</td>' +
    '<td>' + escapar(t.descripcion || '-') + '</td>' +
    '<td>' + escapar(t.factor_co2_kg) + '</td>' +
    '<td>' + Number(t.registros) + '</td>' +
    '<td>' + Number(t.puntos) + '</td>' +
    '<td class="acciones">' +
      '<button type="button" data-editar="' + Number(t.id_tipo) + '">Editar</button>' +
      botonEliminar(t) +
    '</td></tr>';
}

async function cargarTabla() {
  const tipos = await Api.listarTipos();
  cuerpoTabla.innerHTML = tipos.map(filaDeTipo).join('');
}

function limpiarFormulario() {
  form.reset();
  document.getElementById('id_tipo').value = '';
  titulo.textContent = 'Nuevo tipo de residuo';
  botonGuardar.textContent = 'Crear tipo';
}

async function cargarEnFormulario(id) {
  const tipo = await Api.obtenerTipo(id);
  document.getElementById('id_tipo').value = tipo.id_tipo;
  document.getElementById('nombre').value = tipo.nombre;
  document.getElementById('descripcion').value = tipo.descripcion || '';
  document.getElementById('factor_co2_kg').value = tipo.factor_co2_kg;

  titulo.textContent = 'Editar tipo #' + tipo.id_tipo;
  botonGuardar.textContent = 'Guardar cambios';
  window.scrollTo(0, 0);
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const datos = Object.fromEntries(new FormData(form));
  try {
    if (datos.id_tipo) {
      const respuesta = await Api.actualizarTipo(datos.id_tipo, datos);
      mostrarMensaje('aviso', respuesta.mensaje, 'ok');
    } else {
      await Api.crearTipo(datos);
      mostrarMensaje('aviso', 'Tipo de residuo creado', 'ok');
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
    } else if (boton.dataset.eliminar && confirm('Eliminar el tipo ' + boton.dataset.eliminar + '?')) {
      await Api.eliminarTipo(boton.dataset.eliminar);
      mostrarMensaje('aviso', 'Tipo eliminado', 'ok');
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
    await cargarTabla();
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
})();
