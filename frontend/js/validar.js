// RF10: el operador aprueba o rechaza los registros de SU punto.
// El punto no se envia desde aqui: el backend lo toma del token.

const cuerpoTabla = document.getElementById('cuerpo-tabla');
const selectEstado = document.getElementById('estado');

function verificarAcceso() {
  const usuario = Sesion.usuario();
  if (!usuario || usuario.rol !== 'Operador') {
    window.location.href = 'login.html';
    return null;
  }
  document.getElementById('usuario-actual').textContent = 'Sesion: ' + usuario.nombre + ' (Operador)';
  return usuario;
}

function acciones(r) {
  if (r.estado !== 'pendiente') return '<span class="etiqueta">' + escapar(r.estado) + '</span>';
  return '<button type="button" data-aprobar="' + Number(r.id_registro) + '">Aprobar</button>' +
         '<button type="button" class="peligro" data-rechazar="' + Number(r.id_registro) + '">Rechazar</button>';
}

function filaDeRegistro(r) {
  return '<tr>' +
    '<td>' + Number(r.id_registro) + '</td>' +
    '<td>' + escapar(new Date(r.fecha_registro).toLocaleString('es-CO')) + '</td>' +
    '<td>' + escapar(r.ciudadano) + '</td>' +
    '<td>' + escapar(r.tipo_residuo) + '</td>' +
    '<td>' + escapar(r.cantidad_kg) + '</td>' +
    '<td>' + escapar(r.observaciones || '-') + '</td>' +
    '<td class="acciones">' + acciones(r) + '</td>' +
    '</tr>';
}

async function cargarTabla() {
  const registros = await Api.registrosDeMiPunto(selectEstado.value);
  cuerpoTabla.innerHTML = registros.length > 0
    ? registros.map(filaDeRegistro).join('')
    : '<tr><td colspan="7">No hay registros en ese estado.</td></tr>';
}

// Un rechazo siempre pide observacion: HU10 exige justificarlo.
async function validar(id, estado) {
  const observacion = estado === 'rechazado'
    ? prompt('Motivo del rechazo:')
    : prompt('Observacion (opcional):') || null;

  if (estado === 'rechazado' && !observacion) {
    mostrarMensaje('aviso', 'Debe indicar el motivo del rechazo', 'error');
    return;
  }

  await Api.validarRegistro(id, { estado, observacion });
  mostrarMensaje('aviso', 'Registro ' + id + ' ' + estado, 'ok');
  await cargarTabla();
}

cuerpoTabla.addEventListener('click', async (evento) => {
  const boton = evento.target.closest('button');
  if (!boton) return;
  try {
    if (boton.dataset.aprobar) await validar(boton.dataset.aprobar, 'aprobado');
    if (boton.dataset.rechazar) await validar(boton.dataset.rechazar, 'rechazado');
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
});

selectEstado.addEventListener('change', cargarTabla);
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
