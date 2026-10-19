// tests/auth.int.test.js
// Scenario ESC-06: ruta protegida sin token
// Prueba de integración: la API debe responder 401 si no se envía un JWT
const request = require('supertest');
const app = require('../app'); // la app de Express exportada SIN app.listen()
describe('Rutas protegidas', () => {
  test('GET /api/registros/mios sin token responde 401', async () => {
    const res = await request(app).get('/api/registros/mios'); // siempre con await
    expect(res.status).toBe(401);
  });
});
