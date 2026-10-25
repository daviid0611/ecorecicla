// tests/helpers/api.js
// Utilidades compartidas por las pruebas de integracion.
const request = require('supertest');
const app = require('../../app');
const pool = require('../../src/db');

// Credenciales del seed (database/seed.js).
const CUENTAS = {
  admin: { correo: 'admin@ecorecicla.test', contrasena: 'Admin123*' },
  operador: { correo: 'operador@ecorecicla.test', contrasena: 'Operador123*' },
  laura: { correo: 'laura@ecorecicla.test', contrasena: 'Ciudadano123*' },
  carlos: { correo: 'carlos@ecorecicla.test', contrasena: 'Ciudadano123*' }
};

// Inicia sesion por la API real (POST /api/auth/login) y devuelve el JWT.
async function tokenDe(cuenta) {
  const res = await request(app).post('/api/auth/login').send(CUENTAS[cuenta]);
  if (res.status !== 200) throw new Error('No se pudo iniciar sesion como ' + cuenta);
  return res.body.token;
}

// Correo unico por prueba para no chocar con datos de otras pruebas.
function correoUnico(prefijo) {
  return `${prefijo}.${Date.now()}.${Math.floor(Math.random() * 1000)}@correo.com.co`;
}

module.exports = { app, pool, request, CUENTAS, tokenDe, correoUnico };
