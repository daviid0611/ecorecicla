/**
 * Autenticacion por JWT (RF2).
 * Lee el encabezado Authorization: Bearer <token>, lo verifica y deja
 * los datos del usuario en req.usuario para los controladores.
 */
const jwt = require('jsonwebtoken');
const { ErrorApi } = require('./error');

function autenticar(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const [esquema, token] = encabezado.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return next(new ErrorApi(401, 'Token no proporcionado'));
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return next(new ErrorApi(401, 'Token invalido o expirado'));
  }
}

module.exports = { autenticar };
