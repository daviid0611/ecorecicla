/**
 * Autorizacion por rol (RF2).
 * Se usa siempre despues de autenticar: 401 es "no se quien eres",
 * 403 es "se quien eres y no puedes".
 */
const { ErrorApi } = require('./error');

function autorizar(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(new ErrorApi(401, 'No autenticado'));
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return next(new ErrorApi(403, 'No tiene permisos para esta operacion'));
    }
    return next();
  };
}

module.exports = { autorizar };
