/**
 * RF8: CRUD completo de puntos de reciclaje (solo Administrador).
 * Consultas parametrizadas y funciones cortas para mantener la
 * complejidad ciclomatica por funcion <= 10 (RNF5).
 */
const pool = require('../db');
const { ErrorApi } = require('../middlewares/error');

const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;

// Valida un numero opcional dentro de un rango; null o vacio se acepta.
function errorDeCoordenada(valor, nombre, minimo, maximo) {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = Number(valor);
  if (Number.isNaN(numero)) return nombre + ' debe ser numerico';
  if (numero < minimo || numero > maximo) return nombre + ' debe estar entre ' + minimo + ' y ' + maximo;
  return null;
}

function validarPunto(datos) {
  const errores = [];
  if (!datos.nombre || datos.nombre.trim() === '') errores.push('El nombre es obligatorio');
  if (!datos.direccion || datos.direccion.trim() === '') errores.push('La direccion es obligatoria');
  if (!datos.localidad || datos.localidad.trim() === '') errores.push('La localidad es obligatoria');

  const errorLat = errorDeCoordenada(datos.latitud, 'La latitud', LAT_MIN, LAT_MAX);
  const errorLon = errorDeCoordenada(datos.longitud, 'La longitud', LON_MIN, LON_MAX);
  if (errorLat) errores.push(errorLat);
  if (errorLon) errores.push(errorLon);

  if (datos.estado && !['activo', 'inactivo'].includes(datos.estado)) {
    errores.push('El estado debe ser activo o inactivo');
  }
  return errores;
}

// Normaliza los campos del cuerpo para no meter cadenas vacias en la BD.
function valoresDePunto(datos) {
  return [
    datos.nombre.trim(),
    datos.direccion.trim(),
    datos.localidad.trim(),
    datos.latitud === undefined || datos.latitud === '' ? null : Number(datos.latitud),
    datos.longitud === undefined || datos.longitud === '' ? null : Number(datos.longitud),
    datos.horario ? datos.horario.trim() : null
  ];
}

// Reemplaza la lista de residuos aceptados por el punto.
async function guardarTipos(conexion, idPunto, tipos) {
  await conexion.execute('DELETE FROM punto_tipo_residuo WHERE id_punto = ?', [idPunto]);
  if (!Array.isArray(tipos) || tipos.length === 0) return;
  for (const idTipo of tipos) {
    await conexion.execute(
      'INSERT INTO punto_tipo_residuo (id_punto, id_tipo) VALUES (?, ?)',
      [idPunto, Number(idTipo)]
    );
  }
}

async function buscarPuntoConTipos(idPunto) {
  const [puntos] = await pool.execute('SELECT * FROM punto_reciclaje WHERE id_punto = ?', [idPunto]);
  if (puntos.length === 0) return null;
  const [tipos] = await pool.execute(
    `SELECT t.id_tipo, t.nombre
     FROM punto_tipo_residuo p JOIN tipo_residuo t ON t.id_tipo = p.id_tipo
     WHERE p.id_punto = ?`,
    [idPunto]
  );
  return { ...puntos[0], tipos_aceptados: tipos };
}

/**
 * RF3: consulta publica. Solo devuelve puntos activos (por eso el borrado
 * logico del RF8 los saca de esta lista) y admite filtros opcionales por
 * tipo de residuo y localidad, ambos parametrizados.
 */
async function listarPublicos(req, res) {
  const condiciones = ["p.estado = 'activo'"];
  const valores = [];

  if (req.query.id_tipo) {
    // EXISTS y no JOIN directo: filtra por un tipo sin perder los demas
    // tipos que el punto acepta en el GROUP_CONCAT de abajo.
    condiciones.push('EXISTS (SELECT 1 FROM punto_tipo_residuo f WHERE f.id_punto = p.id_punto AND f.id_tipo = ?)');
    valores.push(Number(req.query.id_tipo));
  }
  if (req.query.localidad) {
    condiciones.push('p.localidad LIKE ?');
    valores.push('%' + req.query.localidad + '%');
  }

  const [filas] = await pool.execute(
    `SELECT p.id_punto, p.nombre, p.direccion, p.localidad, p.latitud, p.longitud, p.horario,
            GROUP_CONCAT(t.nombre ORDER BY t.nombre SEPARATOR ', ') AS tipos_aceptados
     FROM punto_reciclaje p
     LEFT JOIN punto_tipo_residuo pt ON pt.id_punto = p.id_punto
     LEFT JOIN tipo_residuo t ON t.id_tipo = pt.id_tipo
     WHERE ` + condiciones.join(' AND ') +
    ` GROUP BY p.id_punto
      ORDER BY p.localidad, p.nombre`,
    valores
  );
  res.status(200).json(filas);
}

// Localidades con puntos activos: alimenta el filtro de la consulta publica.
async function listarLocalidades(req, res) {
  const [filas] = await pool.execute(
    "SELECT DISTINCT localidad FROM punto_reciclaje WHERE estado = 'activo' ORDER BY localidad"
  );
  res.status(200).json(filas.map((f) => f.localidad));
}

async function listar(req, res) {
  const [filas] = await pool.execute(
    `SELECT p.*, GROUP_CONCAT(t.nombre ORDER BY t.nombre SEPARATOR ', ') AS tipos_aceptados
     FROM punto_reciclaje p
     LEFT JOIN punto_tipo_residuo pt ON pt.id_punto = p.id_punto
     LEFT JOIN tipo_residuo t ON t.id_tipo = pt.id_tipo
     GROUP BY p.id_punto
     ORDER BY p.nombre`
  );
  res.status(200).json(filas);
}

async function obtener(req, res) {
  const punto = await buscarPuntoConTipos(req.params.id);
  if (!punto) {
    throw new ErrorApi(404, 'Punto de reciclaje no encontrado');
  }
  res.status(200).json(punto);
}

async function crear(req, res) {
  const errores = validarPunto(req.body);
  if (errores.length > 0) {
    throw new ErrorApi(400, 'Datos invalidos', errores);
  }

  // Transaccion: el punto y sus tipos aceptados deben quedar juntos o nada.
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [resultado] = await conexion.execute(
      'INSERT INTO punto_reciclaje (nombre, direccion, localidad, latitud, longitud, horario) VALUES (?, ?, ?, ?, ?, ?)',
      valoresDePunto(req.body)
    );
    await guardarTipos(conexion, resultado.insertId, req.body.tipos);
    await conexion.commit();
    const punto = await buscarPuntoConTipos(resultado.insertId);
    res.status(201).json(punto);
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

async function actualizar(req, res) {
  const errores = validarPunto(req.body);
  if (errores.length > 0) {
    throw new ErrorApi(400, 'Datos invalidos', errores);
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [resultado] = await conexion.execute(
      `UPDATE punto_reciclaje
       SET nombre = ?, direccion = ?, localidad = ?, latitud = ?, longitud = ?, horario = ?, estado = ?
       WHERE id_punto = ?`,
      [...valoresDePunto(req.body), req.body.estado || 'activo', req.params.id]
    );
    if (resultado.affectedRows === 0) {
      await conexion.rollback();
      throw new ErrorApi(404, 'Punto de reciclaje no encontrado');
    }
    await guardarTipos(conexion, req.params.id, req.body.tipos);
    await conexion.commit();
    res.status(200).json(await buscarPuntoConTipos(req.params.id));
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

/**
 * Borrado logico: se marca estado='inactivo' en vez de DELETE porque
 * registro_reciclaje guarda el historico y apunta con FK a este punto.
 * Un DELETE fisico romperia esos registros o los borraria en cascada,
 * y el impacto ambiental ya reportado se perderia.
 */
async function desactivar(req, res) {
  const [resultado] = await pool.execute(
    "UPDATE punto_reciclaje SET estado = 'inactivo' WHERE id_punto = ?",
    [req.params.id]
  );
  if (resultado.affectedRows === 0) {
    throw new ErrorApi(404, 'Punto de reciclaje no encontrado');
  }
  res.status(200).json({ mensaje: 'Punto desactivado', punto: await buscarPuntoConTipos(req.params.id) });
}

// Lista auxiliar para llenar los checkboxes del formulario del administrador.
async function listarTiposResiduo(req, res) {
  const [filas] = await pool.execute('SELECT id_tipo, nombre, factor_co2_kg FROM tipo_residuo ORDER BY nombre');
  res.status(200).json(filas);
}

module.exports = {
  listar, obtener, crear, actualizar, desactivar,
  listarTiposResiduo, listarPublicos, listarLocalidades
};
