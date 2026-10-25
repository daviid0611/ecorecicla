/**
 * Validacion de fechas AAAA-MM-DD usada por el historial (RF5) y los reportes (RF6).
 * DEF-02: el patron solo revisaba el formato, asi que 2026-02-30 o 2026-13-45
 * pasaban. MariaDB ignoraba el filtro o guardaba 0000-00-00, y MySQL 8
 * respondia error 500. Ahora se comprueba que la fecha exista en el calendario.
 */
const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function esFechaValida(texto) {
  if (typeof texto !== 'string' || !PATRON_FECHA.test(texto)) return false;

  const [anio, mes, dia] = texto.split('-').map(Number);
  // Date corrige las fechas imposibles (30 de febrero pasa a 2 de marzo):
  // si al reconstruirla cambia algun componente, la fecha no existe.
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia;
}

module.exports = { esFechaValida };
