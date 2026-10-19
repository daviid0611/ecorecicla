/**
 * RF9: gestion de tipos de residuo y su factor de CO2 (solo Administrador).
 * El factor es el corazon del calculo de impacto, por eso se valida que sea
 * un numero positivo antes de tocar la base (HU9).
 */
const pool = require('../db');
const { ErrorApi } = require('../middlewares/error');

const FACTOR_MAXIMO = 999.999;

function validarTipo({ nombre, factor_co2_kg, descripcion }) {
  const errores = [];
  if (!nombre || nombre.trim().length < 3) errores.push('El nombre es obligatorio (minimo 3 caracteres)');
  if (descripcion && descripcion.length > 200) errores.push('La descripcion no puede superar 200 caracteres');

  const factor = Number(factor_co2_kg);
  if (factor_co2_kg === undefined || factor_co2_kg === '' || Number.isNaN(factor)) {
    errores.push('El factor de CO2 debe ser numerico');
  } else if (factor <= 0) {
    errores.push('El factor de CO2 debe ser mayor que cero');
  } else if (factor > FACTOR_MAXIMO) {
    errores.push('El factor de CO2 supera el maximo permitido');
  }
  return errores;
}

// El nombre es UNIQUE en la BD; se comprueba antes para responder 409 y no un 500.
async function nombreRepetido(nombre, idExcluido) {
  const [filas] = await pool.execute(
    'SELECT id_tipo FROM tipo_residuo WHERE nombre = ? AND id_tipo <> ?',
    [nombre.trim(), idExcluido || 0]
  );
  return filas.length > 0;
}

async function buscarTipo(idTipo) {
  const [filas] = await pool.execute(
    'SELECT id_tipo, nombre, descripcion, factor_co2_kg FROM tipo_residuo WHERE id_tipo = ?',
    [idTipo]
  );
  return filas[0] || null;
}

/**
 * Lista con el uso de cada tipo: cuantos registros y cuantos puntos lo tienen.
 * El frontend usa esos contadores para avisar que un tipo en uso no se borra.
 */
async function listar(req, res) {
  const [filas] = await pool.execute(
    `SELECT t.id_tipo, t.nombre, t.descripcion, t.factor_co2_kg,
            (SELECT COUNT(*) FROM registro_reciclaje r WHERE r.id_tipo = t.id_tipo) AS registros,
            (SELECT COUNT(*) FROM punto_tipo_residuo p WHERE p.id_tipo = t.id_tipo) AS puntos
     FROM tipo_residuo t
     ORDER BY t.nombre`
  );
  res.status(200).json(filas);
}

async function obtener(req, res) {
  const tipo = await buscarTipo(req.params.id);
  if (!tipo) throw new ErrorApi(404, 'Tipo de residuo no encontrado');
  res.status(200).json(tipo);
}

async function crear(req, res) {
  const errores = validarTipo(req.body);
  if (errores.length > 0) throw new ErrorApi(400, 'Datos invalidos', errores);

  const { nombre, descripcion, factor_co2_kg } = req.body;
  if (await nombreRepetido(nombre)) {
    throw new ErrorApi(409, 'Ya existe un tipo de residuo con ese nombre');
  }

  const [resultado] = await pool.execute(
    'INSERT INTO tipo_residuo (nombre, descripcion, factor_co2_kg) VALUES (?, ?, ?)',
    [nombre.trim(), descripcion ? descripcion.trim() : null, Number(factor_co2_kg)]
  );
  res.status(201).json(await buscarTipo(resultado.insertId));
}

/**
 * Cambiar el factor recalcula el impacto de TODO el historico, porque las
 * vistas multiplican cantidad por factor al momento de consultar. Se avisa en
 * la respuesta para que el administrador sepa el efecto de lo que hizo.
 */
async function actualizar(req, res) {
  const errores = validarTipo(req.body);
  if (errores.length > 0) throw new ErrorApi(400, 'Datos invalidos', errores);

  const { nombre, descripcion, factor_co2_kg } = req.body;
  if (await nombreRepetido(nombre, req.params.id)) {
    throw new ErrorApi(409, 'Ya existe un tipo de residuo con ese nombre');
  }

  const [resultado] = await pool.execute(
    'UPDATE tipo_residuo SET nombre = ?, descripcion = ?, factor_co2_kg = ? WHERE id_tipo = ?',
    [nombre.trim(), descripcion ? descripcion.trim() : null, Number(factor_co2_kg), req.params.id]
  );
  if (resultado.affectedRows === 0) throw new ErrorApi(404, 'Tipo de residuo no encontrado');

  res.status(200).json({
    mensaje: 'Tipo actualizado. El CO2 evitado de los registros historicos se recalcula con el nuevo factor.',
    tipo: await buscarTipo(req.params.id)
  });
}

/**
 * Aqui si es borrado fisico, al reves que en puntos: tipo_residuo es un
 * catalogo sin columna de estado. Para no romper las llaves foraneas solo se
 * permite borrar un tipo que ningun registro ni punto este usando (409 si lo esta).
 */
async function eliminar(req, res) {
  const tipo = await buscarTipo(req.params.id);
  if (!tipo) throw new ErrorApi(404, 'Tipo de residuo no encontrado');

  const [usos] = await pool.execute(
    `SELECT (SELECT COUNT(*) FROM registro_reciclaje WHERE id_tipo = ?) AS registros,
            (SELECT COUNT(*) FROM punto_tipo_residuo WHERE id_tipo = ?) AS puntos`,
    [req.params.id, req.params.id]
  );
  const { registros, puntos } = usos[0];
  if (registros > 0 || puntos > 0) {
    throw new ErrorApi(409, 'No se puede eliminar: el tipo esta en uso', [
      registros + ' registro(s) de reciclaje', puntos + ' punto(s) de reciclaje'
    ]);
  }

  await pool.execute('DELETE FROM tipo_residuo WHERE id_tipo = ?', [req.params.id]);
  res.status(200).json({ mensaje: 'Tipo de residuo eliminado', id_tipo: Number(req.params.id) });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
