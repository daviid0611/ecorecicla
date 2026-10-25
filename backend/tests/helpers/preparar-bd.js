// tests/helpers/preparar-bd.js
// globalSetup de Jest: se ejecuta UNA vez antes de toda la suite.
// Crea la base ecorecicla_test con el mismo schema.sql del proyecto y la
// siembra con el mismo seed.js, para que las pruebas usen datos conocidos.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const BASE_PRUEBAS = process.env.DB_NAME_TEST || 'ecorecicla_test';

// schema.sql crea la base "ecorecicla"; aqui se redirige a la de pruebas
// cambiando solo las tres sentencias que nombran la base.
function schemaParaPruebas() {
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'database', 'schema.sql'), 'utf8');
  return sql
    .replace(/DROP DATABASE IF EXISTS ecorecicla;/, `DROP DATABASE IF EXISTS ${BASE_PRUEBAS};`)
    .replace(/CREATE DATABASE ecorecicla /, `CREATE DATABASE ${BASE_PRUEBAS} `)
    .replace(/USE ecorecicla;/, `USE ${BASE_PRUEBAS};`);
}

module.exports = async () => {
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // schema.sql trae muchas sentencias
  });

  await conexion.query(schemaParaPruebas());
  const { sembrar } = require('../../../database/seed');
  await sembrar(conexion);
  await conexion.end();
};
