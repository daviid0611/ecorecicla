// tests/impacto.test.js
// Scenario ESC-11: CO2 avoided
// Prueba unitaria del cálculo de CO2 evitado (plan de pruebas PP-ECO-001)
const { calcularCO2Evitado } =
  require('../src/services/impacto');
describe('calcularCO2Evitado', () => {
  test('peso x factor, 2 decimales', () => {
    // 2.5 kg x 1.75 = 4.375 -> 4.38
    // toBeCloseTo y no toBe: evita falsos fallos por punto flotante
    expect(calcularCO2Evitado(2.5, 1.75))
      .toBeCloseTo(4.38, 2);
  });
  // Partición inválida: un mismo test se ejecuta con cada valor de la lista
  test.each([0, -1, NaN, '3'])('rechaza %p', (peso) => {
    expect(() => calcularCO2Evitado(peso, 1.75))
      .toThrow('peso inválido');
  });
});
