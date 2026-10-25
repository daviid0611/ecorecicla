/**
 * Datos iniciales de EcoRecicla.
 * Genera los hashes con bcrypt en tiempo de ejecucion: nunca se escriben
 * hashes a mano en el .sql porque no corresponderian a ninguna contrasena real.
 * Uso:  node database/seed.js   (desde la carpeta backend, o con npm run seed)
 */
const path = require('path');

// Node busca los modulos desde la carpeta del archivo hacia arriba, y este
// script vive en database/ mientras que las dependencias se instalan en
// backend/node_modules. Se agrega esa ruta al resolvedor para que el seed
// se pueda ejecutar con "npm run seed" desde backend.
module.paths.push(path.join(__dirname, '..', 'backend', 'node_modules'));

require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const RONDAS_BCRYPT = 10;

// Contrasenas de demostracion. Estan documentadas en el README.
const USUARIOS = [
  { rol: 'Administrador', nombre: 'Admin EcoRecicla', correo: 'admin@ecorecicla.test',    clave: 'Admin123*',     telefono: '3000000001', punto: null },
  { rol: 'Operador',      nombre: 'Operador Suba',    correo: 'operador@ecorecicla.test', clave: 'Operador123*',  telefono: '3000000002', punto: 1 },
  { rol: 'Ciudadano',     nombre: 'Laura Gomez',      correo: 'laura@ecorecicla.test',    clave: 'Ciudadano123*', telefono: '3000000003', punto: null },
  { rol: 'Ciudadano',     nombre: 'Carlos Perez',     correo: 'carlos@ecorecicla.test',   clave: 'Ciudadano123*', telefono: '3000000004', punto: null }
];

// Registros de ejemplo para que las vistas de impacto muestren datos.
const REGISTROS = [
  ['laura@ecorecicla.test',  1, 1, 2.50, '2026-08-03 10:15:00', 'Botellas PET',      'aprobado'],
  ['laura@ecorecicla.test',  1, 2, 4.00, '2026-08-10 16:40:00', null,                'aprobado'],
  ['laura@ecorecicla.test',  3, 4, 0.80, '2026-08-17 09:05:00', 'Latas de aluminio', 'pendiente'],
  ['carlos@ecorecicla.test', 2, 5, 1.20, '2026-08-20 11:30:00', 'Cargadores',        'aprobado'],
  ['carlos@ecorecicla.test', 3, 3, 6.00, '2026-09-02 15:00:00', null,                'pendiente'],
  ['carlos@ecorecicla.test', 1, 1, 3.10, '2026-09-08 12:20:00', null,                'aprobado']
];

async function obtenerRoles(conexion) {
  const [filas] = await conexion.query('SELECT id_rol, nombre FROM rol');
  return Object.fromEntries(filas.map((f) => [f.nombre, f.id_rol]));
}

async function insertarUsuarios(conexion, roles) {
  const ids = {};
  for (const u of USUARIOS) {
    const hash = await bcrypt.hash(u.clave, RONDAS_BCRYPT);
    const [res] = await conexion.execute(
      'INSERT INTO usuario (id_rol, id_punto, nombre, correo, contrasena_hash, telefono) VALUES (?, ?, ?, ?, ?, ?)',
      [roles[u.rol], u.punto, u.nombre, u.correo, hash, u.telefono]
    );
    ids[u.correo] = res.insertId;
    if (require.main === module) console.log('Usuario creado:', u.correo, '/', u.clave);
  }
  return ids;
}

async function insertarRegistros(conexion, idsUsuario) {
  for (const [correo, punto, tipo, kg, fecha, obs, estado] of REGISTROS) {
    await conexion.execute(
      `INSERT INTO registro_reciclaje
         (id_usuario, id_punto, id_tipo, cantidad_kg, fecha_registro, observaciones, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [idsUsuario[correo], punto, tipo, kg, fecha, obs, estado]
    );
  }
  if (require.main === module) console.log('Registros de ejemplo insertados:', REGISTROS.length);
}

// Limpia y siembra usuarios y registros. Se exporta para que las pruebas
// de integracion preparen su base (ecorecicla_test) con los mismos datos.
async function sembrar(conexion) {
  // Se limpia antes de sembrar para poder correr el seed las veces que sea.
  await conexion.query('DELETE FROM registro_reciclaje');
  await conexion.query('DELETE FROM usuario');

  const roles = await obtenerRoles(conexion);
  const idsUsuario = await insertarUsuarios(conexion, roles);
  await insertarRegistros(conexion, idsUsuario);
}

async function main() {
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecorecicla'
  });

  await sembrar(conexion);

  await conexion.end();
  console.log('Seed completado.');
}

// Solo se ejecuta al llamarlo con node; al importarlo desde las pruebas, no.
if (require.main === module) {
  main().catch((error) => {
    console.error('Error en el seed:', error.message);
    process.exit(1);
  });
}

module.exports = { sembrar, USUARIOS };
