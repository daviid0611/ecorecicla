/**
 * Manejo centralizado de errores (RNF5: mantenibilidad).
 * Los controladores lanzan ErrorApi con su codigo HTTP y aqui se
 * traduce a una unica forma de respuesta JSON.
 */
class ErrorApi extends Error {
  constructor(codigo, mensaje, detalles) {
    super(mensaje);
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

// Envuelve controladores async para no repetir try/catch en cada uno.
function asincrono(controlador) {
  return (req, res, next) => Promise.resolve(controlador(req, res, next)).catch(next);
}

function noEncontrado(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado' });
}

function manejadorErrores(err, req, res, next) { // eslint-disable-line no-unused-vars
  const codigo = err.codigo || 500;
  if (codigo === 500) {
    console.error('Error no controlado:', err);
  }
  res.status(codigo).json({
    error: codigo === 500 ? 'Error interno del servidor' : err.message,
    detalles: err.detalles
  });
}

module.exports = { ErrorApi, asincrono, noEncontrado, manejadorErrores };
