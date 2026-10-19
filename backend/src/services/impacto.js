// src/services/impacto.js
// Servicio de impacto ambiental de EcoRecicla
// Calcula los kg de CO2 evitados: peso (kg) x factor del material (kg de CO2 por kg)
function calcularCO2Evitado(pesoKg, factor) {
  // typeof descarta textos como '3'; Number.isFinite descarta NaN e Infinity
  if (typeof pesoKg !== 'number' || !Number.isFinite(pesoKg) || pesoKg <= 0) {
    throw new Error('peso inválido');
  }
  if (typeof factor !== 'number' || !Number.isFinite(factor) || factor < 0) {
    throw new Error('factor inválido');
  }
  // Redondeo a 2 decimales: se multiplica por 100, se redondea y se divide
  return Math.round(pesoKg * factor * 100) / 100;
}
module.exports = { calcularCO2Evitado };
