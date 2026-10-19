/**
 * Pool de conexiones a MySQL.
 * Se usa un pool y no una conexion suelta porque la API atiende varias
 * peticiones a la vez (RNF1: 100 usuarios concurrentes).
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecorecicla',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false
});

module.exports = pool;
