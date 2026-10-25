// tests/fechas.test.js
// Prueba unitaria de esFechaValida (DEF-02, escenarios ESC-13 y ESC-14).
const { esFechaValida } = require('../src/utils/fechas');

describe('esFechaValida', () => {
  test.each(['2026-08-01', '2026-12-31', '2028-02-29', '2026-10-24'])('acepta %p', (fecha) => {
    expect(esFechaValida(fecha)).toBe(true);
  });

  test.each([
    '2026-02-29', // 2026 no es bisiesto
    '2026-02-30',
    '2026-13-45',
    '2026-04-31', // abril tiene 30 dias
    '2026-00-10',
    '15/08/2026',
    '2026-8-1',
    '',
    undefined,
    ['2026-08-01', '2026-08-02'] // ?desde=...&desde=... llega como arreglo
  ])('rechaza %p', (fecha) => {
    expect(esFechaValida(fecha)).toBe(false);
  });
});
