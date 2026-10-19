/**
 * RF6 (reporte por periodo) y RF7 (estadisticas ambientales).
 * Todo sale de las vistas v_impacto_registro y v_estadisticas_mensuales,
 * que ya filtran estado = 'aprobado': un dato sin validar no suma al impacto.
 */
const pool = require('../db');
const { ErrorApi } = require('../middlewares/error');

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Valida el periodo y lo devuelve listo para usar en un BETWEEN.
function periodoDeConsulta(consulta) {
  const { desde, hasta } = consulta;
  if (!PATRON_FECHA.test(desde || '') || !PATRON_FECHA.test(hasta || '')) {
    throw new ErrorApi(400, 'Debe indicar desde y hasta con formato AAAA-MM-DD');
  }
  if (hasta < desde) {
    throw new ErrorApi(400, 'La fecha final no puede ser anterior a la inicial');
  }
  return { desde, hasta, inicio: desde + ' 00:00:00', fin: hasta + ' 23:59:59' };
}

function totalesDe(filas) {
  const suma = (campo) => filas.reduce((acumulado, f) => acumulado + Number(f[campo]), 0);
  return {
    total_kg: Number(suma('total_kg').toFixed(2)),
    co2_evitado_kg: Number(suma('co2_evitado_kg').toFixed(2))
  };
}

// Deja constancia del reporte generado en la tabla reporte (HU6).
async function guardarReporte(idUsuario, tipo, periodo, totales) {
  await pool.execute(
    `INSERT INTO reporte (id_usuario, tipo, fecha_inicio, fecha_fin, total_kg, co2_evitado_kg)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [idUsuario, tipo, periodo.desde, periodo.hasta, totales.total_kg, totales.co2_evitado_kg]
  );
}

async function personal(req, res) {
  const periodo = periodoDeConsulta(req.query);

  const [filas] = await pool.execute(
    `SELECT tipo_residuo, SUM(cantidad_kg) AS total_kg, SUM(co2_evitado_kg) AS co2_evitado_kg
     FROM v_impacto_registro
     WHERE id_usuario = ? AND fecha_registro BETWEEN ? AND ?
     GROUP BY tipo_residuo
     ORDER BY total_kg DESC`,
    [req.usuario.id_usuario, periodo.inicio, periodo.fin]
  );

  const totales = totalesDe(filas);
  await guardarReporte(req.usuario.id_usuario, 'personal', periodo, totales);

  res.status(200).json({
    periodo: { desde: periodo.desde, hasta: periodo.hasta },
    detalle_por_tipo: filas,
    totales
  });
}

async function global(req, res) {
  const periodo = periodoDeConsulta(req.query);

  const [porTipo] = await pool.execute(
    `SELECT tipo_residuo, SUM(cantidad_kg) AS total_kg, SUM(co2_evitado_kg) AS co2_evitado_kg
     FROM v_impacto_registro
     WHERE fecha_registro BETWEEN ? AND ?
     GROUP BY tipo_residuo
     ORDER BY total_kg DESC`,
    [periodo.inicio, periodo.fin]
  );

  const totales = totalesDe(porTipo);
  await guardarReporte(req.usuario.id_usuario, 'global', periodo, totales);

  res.status(200).json({
    periodo: { desde: periodo.desde, hasta: periodo.hasta },
    detalle_por_tipo: porTipo,
    totales
  });
}

async function estadisticas(req, res) {
  const [porMes] = await pool.execute(
    'SELECT mes, tipo_residuo, total_kg, co2_evitado_kg FROM v_estadisticas_mensuales ORDER BY mes DESC, total_kg DESC'
  );

  const [porTipo] = await pool.execute(
    `SELECT tipo_residuo, SUM(cantidad_kg) AS total_kg, SUM(co2_evitado_kg) AS co2_evitado_kg
     FROM v_impacto_registro GROUP BY tipo_residuo ORDER BY total_kg DESC`
  );

  // Ranking de puntos: que sede recolecta mas (HU7).
  const [porPunto] = await pool.execute(
    `SELECT p.nombre AS punto, p.localidad,
            SUM(v.cantidad_kg) AS total_kg, SUM(v.co2_evitado_kg) AS co2_evitado_kg
     FROM v_impacto_registro v
     JOIN punto_reciclaje p ON p.id_punto = v.id_punto
     GROUP BY p.id_punto, p.nombre, p.localidad
     ORDER BY total_kg DESC`
  );

  res.status(200).json({
    por_mes: porMes,
    por_tipo: porTipo,
    ranking_puntos: porPunto,
    totales: totalesDe(porTipo)
  });
}

module.exports = { personal, global, estadisticas };
