/**
 * Capa unica de acceso a la API. Centraliza el token y el manejo de
 * errores para no repetir fetch en cada pagina.
 */
const API = '/api';

const Sesion = {
  guardar(token, usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  },
  token() { return localStorage.getItem('token'); },
  usuario() {
    const dato = localStorage.getItem('usuario');
    return dato ? JSON.parse(dato) : null;
  },
  cerrar() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
  }
};

// Arma la cadena de consulta ignorando los filtros vacios.
function consulta(filtros) {
  const parametros = new URLSearchParams();
  Object.entries(filtros || {}).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') parametros.append(clave, valor);
  });
  const texto = parametros.toString();
  return texto ? '?' + texto : '';
}

async function peticion(ruta, opciones = {}) {
  const cabeceras = { 'Content-Type': 'application/json', ...(opciones.headers || {}) };
  const token = Sesion.token();
  if (token) cabeceras.Authorization = 'Bearer ' + token;

  const respuesta = await fetch(API + ruta, { ...opciones, headers: cabeceras });
  const cuerpo = respuesta.status === 204 ? null : await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    // El backend responde { error, detalles }: se arma un mensaje legible.
    const detalle = cuerpo && cuerpo.detalles ? ': ' + cuerpo.detalles.join(', ') : '';
    throw new Error(((cuerpo && cuerpo.error) || 'Error de conexion') + detalle);
  }
  return cuerpo;
}

const Api = {
  registro: (datos) => peticion('/auth/registro', { method: 'POST', body: JSON.stringify(datos) }),
  login: (datos) => peticion('/auth/login', { method: 'POST', body: JSON.stringify(datos) }),
  listarPuntos: () => peticion('/puntos'),
  puntosPublicos: (filtros) => peticion('/puntos/publicos' + consulta(filtros)),
  localidades: () => peticion('/puntos/localidades'),
  obtenerPunto: (id) => peticion('/puntos/' + id),
  crearPunto: (datos) => peticion('/puntos', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarPunto: (id, datos) => peticion('/puntos/' + id, { method: 'PUT', body: JSON.stringify(datos) }),
  desactivarPunto: (id) => peticion('/puntos/' + id, { method: 'DELETE' }),
  tiposResiduo: () => peticion('/puntos/tipos-residuo'),

  crearRegistro: (datos) => peticion('/registros', { method: 'POST', body: JSON.stringify(datos) }),
  misRegistros: (filtros) => peticion('/registros/mios' + consulta(filtros)),
  registrosDeMiPunto: (estado) => peticion('/registros/mi-punto' + consulta({ estado })),
  validarRegistro: (id, datos) => peticion('/registros/' + id + '/validacion', { method: 'PUT', body: JSON.stringify(datos) }),

  reportePersonal: (filtros) => peticion('/reportes/personal' + consulta(filtros)),
  reporteGlobal: (filtros) => peticion('/reportes/global' + consulta(filtros)),
  estadisticas: () => peticion('/reportes/estadisticas'),

  listarTipos: () => peticion('/tipos'),
  obtenerTipo: (id) => peticion('/tipos/' + id),
  crearTipo: (datos) => peticion('/tipos', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarTipo: (id, datos) => peticion('/tipos/' + id, { method: 'PUT', body: JSON.stringify(datos) }),
  eliminarTipo: (id) => peticion('/tipos/' + id, { method: 'DELETE' })
};

// Escapa texto antes de inyectarlo como HTML (RNF2: proteccion contra XSS).
function escapar(valor) {
  const div = document.createElement('div');
  div.textContent = valor === null || valor === undefined ? '' : String(valor);
  return div.innerHTML;
}

// Muestra un aviso accesible (aria-live) en el contenedor indicado.
function mostrarMensaje(id, texto, tipo = 'ok') {
  const caja = document.getElementById(id);
  caja.textContent = texto;
  caja.className = 'mensaje ' + tipo;
  caja.hidden = false;
}
