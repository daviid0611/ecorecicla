/**
 * RF4 (registrar reciclaje), RF5 (historial personal) y RF10 (validacion
 * por el operador). Consultas parametrizadas en todos los casos (RNF2).
 */
const pool = require('../db');
const { ErrorApi } = require('../middlewares/error');
const { calcularCO2Evitado } = require('../services/impacto');
const { esFechaValida } = require('../utils/fechas');

const CANTIDAD_MAXIMA_KG = 999999.99;
// cantidad_kg es DECIMAL(8,2): solo se admiten hasta 2 decimales.
const PATRON_DOS_DECIMALES = /^\d+(\.\d{1,2})?$/;

/**
 * Devuelve el error de la cantidad o null si es valida.
 * DEF-04: solo se aceptan numeros o textos numericos (true o [5] no son cantidades).
 * DEF-05: el 0 ya no cae en "debe ser numerica", llega a "mayor que cero".
 * DEF-01: con mas de 2 decimales la BD redondea (0,009 se vuelve 0,01) o
 * rompe el CHECK (0,004 se vuelve 0,00 y responde 500); se rechaza antes.
 */
function errorDeCantidad(valor) {
  const esNumerico = typeof valor === 'number' || (typeof valor === 'string' && valor.trim() !== '');
  if (!esNumerico || Number.isNaN(Number(valor))) return 'La cantidad debe ser numerica';

  const cantidad = Number(valor);
  if (cantidad <= 0) return 'La cantidad debe ser mayor que cero';
  if (cantidad > CANTIDAD_MAXIMA_KG) return 'La cantidad supera el maximo permitido';
  if (!PATRON_DOS_DECIMALES.test(String(cantidad))) {
    return 'La cantidad admite maximo 2 decimales (minimo 0.01 kg)';
  }
  return null;
}

function validarRegistro({ id_punto, id_tipo, cantidad_kg }) {
  const errores = [];
  if (!id_punto) errores.push('Debe seleccionar un punto de reciclaje');
  if (!id_tipo) errores.push('Debe seleccionar un tipo de residuo');

  const errorCantidad = errorDeCantidad(cantidad_kg);
  if (errorCantidad) errores.push(errorCantidad);

  return errores;
}

/**
 * Regla de negocio del enunciado: un punto solo puede recibir los residuos
 * que tiene asignados en punto_tipo_residuo. Se comprueba en el backend
 * porque el frontend puede ser manipulado.
 */
async function verificarPuntoYTipo(idPunto, idTipo) {
  const [puntos] = await pool.execute(
    'SELECT estado FROM punto_reciclaje WHERE id_punto = ?', [idPunto]
  );
  if (puntos.length === 0) throw new ErrorApi(404, 'El punto de reciclaje no existe');
  if (puntos[0].estado !== 'activo') throw new ErrorApi(400, 'El punto de reciclaje esta inactivo');

  const [aceptado] = await pool.execute(
    'SELECT 1 FROM punto_tipo_residuo WHERE id_punto = ? AND id_tipo = ?', [idPunto, idTipo]
  );
  if (aceptado.length === 0) {
    throw new ErrorApi(400, 'Ese punto no acepta el tipo de residuo seleccionado');
  }
}

async function crear(req, res) {
  const errores = validarRegistro(req.body);
  if (errores.length > 0) throw new ErrorApi(400, 'Datos invalidos', errores);

  const { id_punto, id_tipo, cantidad_kg, observaciones } = req.body;
  await verificarPuntoYTipo(id_punto, id_tipo);

  // Nace en 'pendiente': solo el operador del punto puede aprobarlo (RF10).
  const [resultado] = await pool.execute(
    `INSERT INTO registro_reciclaje (id_usuario, id_punto, id_tipo, cantidad_kg, observaciones)
     VALUES (?, ?, ?, ?, ?)`,
    [req.usuario.id_usuario, id_punto, id_tipo, Number(cantidad_kg), observaciones || null]
  );

  const [filas] = await pool.execute(
    `SELECT r.id_registro, r.cantidad_kg, r.fecha_registro, r.estado,
            p.nombre AS punto, t.nombre AS tipo_residuo,
            t.factor_co2_kg
     FROM registro_reciclaje r
     JOIN punto_reciclaje p ON p.id_punto = r.id_punto
     JOIN tipo_residuo t ON t.id_tipo = r.id_tipo
     WHERE r.id_registro = ?`,
    [resultado.insertId]
  );

  res.status(201).json({ mensaje: 'Registro guardado. Queda pendiente de validacion.', registro: conCO2(filas[0]) });
}

// El CO2 se calcula en el servicio de impacto (ESC-11), no en el SQL.
// mysql2 entrega los DECIMAL como texto: se convierten antes de calcular.
function conCO2({ factor_co2_kg, ...fila }) {
  return { ...fila, co2_estimado_kg: calcularCO2Evitado(Number(fila.cantidad_kg), Number(factor_co2_kg)) };
}

// Arma la parte WHERE de los filtros opcionales sin concatenar valores.
function filtrosDeHistorial(consulta) {
  const condiciones = [];
  const valores = [];

  if (consulta.desde) {
    if (!esFechaValida(consulta.desde)) throw new ErrorApi(400, 'La fecha "desde" debe ser una fecha valida con formato AAAA-MM-DD');
    condiciones.push('r.fecha_registro >= ?');
    valores.push(consulta.desde + ' 00:00:00');
  }
  if (consulta.hasta) {
    if (!esFechaValida(consulta.hasta)) throw new ErrorApi(400, 'La fecha "hasta" debe ser una fecha valida con formato AAAA-MM-DD');
    condiciones.push('r.fecha_registro <= ?');
    valores.push(consulta.hasta + ' 23:59:59');
  }
  if (consulta.id_tipo) {
    // DEF-03: Number('plastico') es NaN y la consulta devolvia 0 filas sin avisar.
    if (!/^\d+$/.test(consulta.id_tipo)) throw new ErrorApi(400, 'El tipo de residuo debe ser un numero entero');
    condiciones.push('r.id_tipo = ?');
    valores.push(Number(consulta.id_tipo));
  }
  if (consulta.estado) {
    condiciones.push('r.estado = ?');
    valores.push(consulta.estado);
  }
  return { condiciones, valores };
}

async function mios(req, res) {
  const { condiciones, valores } = filtrosDeHistorial(req.query);
  const sql =
    `SELECT r.id_registro, r.cantidad_kg, r.fecha_registro, r.estado, r.observaciones,
            r.observacion_validacion, p.nombre AS punto, t.nombre AS tipo_residuo,
            t.factor_co2_kg
     FROM registro_reciclaje r
     JOIN punto_reciclaje p ON p.id_punto = r.id_punto
     JOIN tipo_residuo t ON t.id_tipo = r.id_tipo
     WHERE r.id_usuario = ?` +
    (condiciones.length > 0 ? ' AND ' + condiciones.join(' AND ') : '') +
    ' ORDER BY r.fecha_registro DESC';

  const [crudas] = await pool.execute(sql, [req.usuario.id_usuario, ...valores]);
  const filas = crudas.map(conCO2);

  // Los totales del historial solo suman lo aprobado, igual que las vistas.
  const aprobados = filas.filter((f) => f.estado === 'aprobado');
  const suma = (lista, campo) => lista.reduce((acumulado, f) => acumulado + Number(f[campo]), 0);

  res.status(200).json({
    registros: filas,
    resumen: {
      total_registros: filas.length,
      total_kg_aprobados: Number(suma(aprobados, 'cantidad_kg').toFixed(2)),
      co2_evitado_kg: Number(suma(aprobados, 'co2_estimado_kg').toFixed(2))
    }
  });
}

// El operador solo ve lo de SU punto: el id_punto sale del token, no del cliente.
function puntoDelOperador(usuario) {
  if (!usuario.id_punto) {
    throw new ErrorApi(403, 'El operador no tiene un punto de reciclaje asignado');
  }
  return usuario.id_punto;
}

async function deMiPunto(req, res) {
  const idPunto = puntoDelOperador(req.usuario);
  const estado = req.query.estado || 'pendiente';

  const [filas] = await pool.execute(
    `SELECT r.id_registro, r.cantidad_kg, r.fecha_registro, r.estado, r.observaciones,
            u.nombre AS ciudadano, t.nombre AS tipo_residuo
     FROM registro_reciclaje r
     JOIN usuario u ON u.id_usuario = r.id_usuario
     JOIN tipo_residuo t ON t.id_tipo = r.id_tipo
     WHERE r.id_punto = ? AND r.estado = ?
     ORDER BY r.fecha_registro DESC`,
    [idPunto, estado]
  );
  res.status(200).json(filas);
}

async function validar(req, res) {
  const idPunto = puntoDelOperador(req.usuario);
  const { estado, observacion } = req.body;

  if (!['aprobado', 'rechazado'].includes(estado)) {
    throw new ErrorApi(400, 'El estado debe ser aprobado o rechazado');
  }

  const [filas] = await pool.execute(
    'SELECT id_punto, estado FROM registro_reciclaje WHERE id_registro = ?', [req.params.id]
  );
  if (filas.length === 0) throw new ErrorApi(404, 'Registro no encontrado');
  if (filas[0].id_punto !== idPunto) {
    throw new ErrorApi(403, 'Solo puede validar registros de su propio punto');
  }
  if (filas[0].estado !== 'pendiente') {
    throw new ErrorApi(409, 'El registro ya fue validado');
  }

  await pool.execute(
    `UPDATE registro_reciclaje
     SET estado = ?, id_validador = ?, fecha_validacion = NOW(), observacion_validacion = ?
     WHERE id_registro = ?`,
    [estado, req.usuario.id_usuario, observacion || null, req.params.id]
  );

  res.status(200).json({ mensaje: 'Registro ' + estado, id_registro: Number(req.params.id), estado });
}

// validarRegistro se exporta para las pruebas unitarias de valores limite (ESC-09).
module.exports = { crear, mios, deMiPunto, validar, validarRegistro };
