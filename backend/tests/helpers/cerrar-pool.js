// tests/helpers/cerrar-pool.js
// setupFilesAfterEnv: al terminar cada archivo se cierra el pool de MySQL.
// Sin esto Jest queda esperando conexiones abiertas y no termina.
afterAll(async () => {
  await require('../../src/db').end();
});
