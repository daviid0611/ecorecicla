/**
 * RF1 registro de usuarios y RF2 autenticacion.
 * Todas las consultas van parametrizadas (?) para evitar inyeccion SQL (RNF2).
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { ErrorApi } = require('../middlewares/error');

const RONDAS_BCRYPT = 10;
const LARGO_MINIMO_CLAVE = 8;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Devuelve la lista de errores del formulario de registro.
function validarRegistro({ nombre, correo, contrasena }) {
  const errores = [];
  if (!nombre || nombre.trim().length < 3) errores.push('El nombre es obligatorio (minimo 3 caracteres)');
  if (!correo || !PATRON_CORREO.test(correo)) errores.push('El correo no tiene un formato valido');
  if (!contrasena || contrasena.length < LARGO_MINIMO_CLAVE) {
    errores.push('La contrasena debe tener al menos ' + LARGO_MINIMO_CLAVE + ' caracteres');
  }
  return errores;
}

async function registrar(req, res) {
  const { nombre, correo, contrasena, telefono } = req.body;
  const errores = validarRegistro(req.body);
  if (errores.length > 0) {
    throw new ErrorApi(400, 'Datos invalidos', errores);
  }

  const [existentes] = await pool.execute('SELECT id_usuario FROM usuario WHERE correo = ?', [correo]);
  if (existentes.length > 0) {
    throw new ErrorApi(409, 'El correo ya esta registrado');
  }

  // Todo registro publico nace como Ciudadano: los otros roles los asigna el administrador.
  const [roles] = await pool.execute('SELECT id_rol FROM rol WHERE nombre = ?', ['Ciudadano']);
  const hash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);

  const [resultado] = await pool.execute(
    'INSERT INTO usuario (id_rol, nombre, correo, contrasena_hash, telefono) VALUES (?, ?, ?, ?, ?)',
    [roles[0].id_rol, nombre.trim(), correo.trim().toLowerCase(), hash, telefono || null]
  );

  res.status(201).json({
    mensaje: 'Usuario registrado',
    usuario: { id_usuario: resultado.insertId, nombre: nombre.trim(), correo, rol: 'Ciudadano' }
  });
}

async function login(req, res) {
  const { correo, contrasena } = req.body;
  if (!correo || !contrasena) {
    throw new ErrorApi(400, 'Correo y contrasena son obligatorios');
  }

  const [filas] = await pool.execute(
    `SELECT u.id_usuario, u.nombre, u.correo, u.contrasena_hash, u.estado, u.id_punto, r.nombre AS rol
     FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
     WHERE u.correo = ?`,
    [correo]
  );

  const usuario = filas[0];
  // Mismo mensaje si no existe el correo o si la clave falla: no se le
  // confirma a un atacante que correos estan registrados (OWASP).
  if (!usuario || usuario.estado !== 'activo') {
    throw new ErrorApi(401, 'Credenciales invalidas');
  }

  const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);
  if (!coincide) {
    throw new ErrorApi(401, 'Credenciales invalidas');
  }

  const token = jwt.sign(
    { id_usuario: usuario.id_usuario, rol: usuario.rol, id_punto: usuario.id_punto },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRA || '2h' }
  );

  res.status(200).json({
    token,
    usuario: { id_usuario: usuario.id_usuario, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }
  });
}

// Devuelve el usuario del token: la sirve el frontend para pintar el panel.
async function perfil(req, res) {
  const [filas] = await pool.execute(
    `SELECT u.id_usuario, u.nombre, u.correo, u.telefono, u.id_punto, r.nombre AS rol
     FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = ?`,
    [req.usuario.id_usuario]
  );
  if (filas.length === 0) {
    throw new ErrorApi(404, 'Usuario no encontrado');
  }
  res.status(200).json(filas[0]);
}

// validarRegistro se exporta para las pruebas unitarias (ESC-03).
module.exports = { registrar, login, perfil, validarRegistro };
