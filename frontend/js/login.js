// RF1 y RF2 desde el navegador: registro de ciudadano e inicio de sesion.

// Tras el login se envia a cada rol a la pantalla que puede usar.
function destinoSegunRol(rol) {
  const destinos = {
    Administrador: 'admin-puntos.html',
    Operador: 'validar.html',
    Ciudadano: 'registrar.html'
  };
  return destinos[rol] || 'index.html';
}

document.getElementById('form-login').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const datos = Object.fromEntries(new FormData(evento.target));
  try {
    const respuesta = await Api.login(datos);
    Sesion.guardar(respuesta.token, respuesta.usuario);
    mostrarMensaje('aviso', 'Bienvenido ' + respuesta.usuario.nombre, 'ok');
    setTimeout(() => { window.location.href = destinoSegunRol(respuesta.usuario.rol); }, 600);
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
});

document.getElementById('form-registro').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const datos = Object.fromEntries(new FormData(evento.target));
  try {
    await Api.registro(datos);
    mostrarMensaje('aviso', 'Cuenta creada. Ya puedes iniciar sesion.', 'ok');
    evento.target.reset();
  } catch (error) {
    mostrarMensaje('aviso', error.message, 'error');
  }
});
