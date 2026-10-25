// tests/registros.int.test.js
// Pruebas de integracion de los modulos M3 (registro de reciclaje, RF4),
// M5 (historial, RF5) y la validacion del operador (RF10).
// Datos del seed: punto 1 = EcoPunto Suba (operador@), punto 2 = Chapinero
// (acepta Plastico, Papel y RAEE, NO Vidrio ni Metal), tipo 1 = Plastico (1,5).
const { app, pool, request, tokenDe } = require('./helpers/api');

let tokenLaura;
let tokenCarlos;
let tokenOperador;
let tokenAdmin;

beforeAll(async () => {
  [tokenLaura, tokenCarlos, tokenOperador, tokenAdmin] = await Promise.all(
    ['laura', 'carlos', 'operador', 'admin'].map(tokenDe)
  );
});

const conToken = (token) => ({ Authorization: 'Bearer ' + token });

function registrar(token, cuerpo) {
  return request(app).post('/api/registros').set(conToken(token)).send(cuerpo);
}

describe('ESC-08 registro de una entrega valida', () => {
  test('CP-08-01 responde 201, queda pendiente y aparece en el historial', async () => {
    const res = await registrar(tokenLaura, {
      id_punto: 1, id_tipo: 1, cantidad_kg: 2.5, observaciones: 'Botellas de gaseosa'
    });

    expect(res.status).toBe(201);
    expect(res.body.registro.estado).toBe('pendiente');
    expect(res.body.registro.co2_estimado_kg).toBeCloseTo(3.75, 2); // 2,5 kg x 1,5

    const historial = await request(app).get('/api/registros/mios').set(conToken(tokenLaura));
    const ids = historial.body.registros.map((r) => r.id_registro);
    expect(ids).toContain(res.body.registro.id_registro);
  });
});

describe('ESC-09 cantidades en los limites (por la API)', () => {
  test.each([0.01, 999999.99])('CP-09-07 %p kg se acepta (limite valido)', async (cantidad) => {
    const res = await registrar(tokenCarlos, { id_punto: 1, id_tipo: 2, cantidad_kg: cantidad });
    expect(res.status).toBe(201);
  });

  test.each([0, -3, 'abc', 1000000, 0.004])('CP-09-08 %p kg responde 400 y no se guarda', async (cantidad) => {
    const [antes] = await pool.execute('SELECT COUNT(*) AS n FROM registro_reciclaje');
    const res = await registrar(tokenCarlos, { id_punto: 1, id_tipo: 2, cantidad_kg: cantidad });
    const [despues] = await pool.execute('SELECT COUNT(*) AS n FROM registro_reciclaje');

    expect(res.status).toBe(400);
    expect(despues[0].n).toBe(antes[0].n);
  });
});

describe('ESC-10 regla de negocio punto/tipo de residuo', () => {
  test('CP-10-01 punto que no acepta el residuo responde 400', async () => {
    // EcoPunto Chapinero (2) no recibe Vidrio (3)
    const res = await registrar(tokenLaura, { id_punto: 2, id_tipo: 3, cantidad_kg: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Ese punto no acepta el tipo de residuo seleccionado');
  });

  test('CP-10-02 punto inactivo responde 400', async () => {
    // El administrador crea un punto y luego lo desactiva (borrado logico, RF8)
    const creado = await request(app).post('/api/puntos').set(conToken(tokenAdmin)).send({
      nombre: 'EcoPunto Usaquén', direccion: 'Calle 120 # 7-40', localidad: 'Usaquén', tipos: [1]
    });
    expect(creado.status).toBe(201);
    const idPunto = creado.body.id_punto;
    await request(app).delete('/api/puntos/' + idPunto).set(conToken(tokenAdmin));

    const res = await registrar(tokenLaura, { id_punto: idPunto, id_tipo: 1, cantidad_kg: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('El punto de reciclaje esta inactivo');
  });
});

describe('ESC-13 historial con filtros', () => {
  test('CP-13-01 filtra por tipo y estado, del mas reciente al mas antiguo', async () => {
    const res = await request(app)
      .get('/api/registros/mios?id_tipo=1&estado=aprobado')
      .set(conToken(tokenCarlos));

    expect(res.status).toBe(200);
    expect(res.body.registros.length).toBeGreaterThan(0);
    res.body.registros.forEach((r) => {
      expect(r.tipo_residuo).toBe('Plastico');
      expect(r.estado).toBe('aprobado');
    });
    const fechas = res.body.registros.map((r) => new Date(r.fecha_registro).getTime());
    expect(fechas).toEqual([...fechas].sort((a, b) => b - a));
  });

  test('CP-13-02 filtra por rango de fechas', async () => {
    const res = await request(app)
      .get('/api/registros/mios?desde=2026-08-01&hasta=2026-08-15')
      .set(conToken(tokenLaura));
    expect(res.status).toBe(200);
    expect(res.body.registros).toHaveLength(2); // 3 y 10 de agosto en el seed
  });

  test('CP-13-03 un ciudadano solo ve sus propios registros', async () => {
    const res = await request(app).get('/api/registros/mios').set(conToken(tokenLaura));
    const [propios] = await pool.execute(
      "SELECT COUNT(*) AS n FROM registro_reciclaje r JOIN usuario u ON u.id_usuario = r.id_usuario WHERE u.correo = 'laura@ecorecicla.test'"
    );
    expect(res.body.registros).toHaveLength(propios[0].n);
  });

  test.each(['15/08/2026', '2026-8-1', '2026-13-45', '2026-02-30'])(
    'CP-13-04 fecha invalida %p responde 400', async (fecha) => {
      const res = await request(app).get('/api/registros/mios?desde=' + encodeURIComponent(fecha)).set(conToken(tokenLaura));
      expect(res.status).toBe(400);
    }
  );

  test('CP-13-05 id_tipo no numerico responde 400', async () => {
    const res = await request(app).get('/api/registros/mios?id_tipo=plastico').set(conToken(tokenLaura));
    expect(res.status).toBe(400);
  });
});

describe('ESC-14 validacion del operador (RF10)', () => {
  async function registroPendiente(idPunto) {
    const res = await registrar(tokenLaura, { id_punto: idPunto, id_tipo: 1, cantidad_kg: 4 });
    return res.body.registro.id_registro;
  }

  test('CP-14-01 el operador aprueba un registro de su punto', async () => {
    const id = await registroPendiente(1);
    const res = await request(app).put(`/api/registros/${id}/validacion`)
      .set(conToken(tokenOperador)).send({ estado: 'aprobado', observacion: 'Material limpio' });

    expect(res.status).toBe(200);
    const [filas] = await pool.execute('SELECT estado, id_validador FROM registro_reciclaje WHERE id_registro = ?', [id]);
    expect(filas[0].estado).toBe('aprobado');
    expect(filas[0].id_validador).not.toBeNull();
  });

  test('CP-14-02 no puede validar registros de otro punto (403)', async () => {
    const id = await registroPendiente(3); // EcoPunto Kennedy
    const res = await request(app).put(`/api/registros/${id}/validacion`)
      .set(conToken(tokenOperador)).send({ estado: 'aprobado' });
    expect(res.status).toBe(403);
  });

  test('CP-14-03 no puede validar dos veces el mismo registro (409)', async () => {
    const id = await registroPendiente(1);
    await request(app).put(`/api/registros/${id}/validacion`).set(conToken(tokenOperador)).send({ estado: 'rechazado' });
    const res = await request(app).put(`/api/registros/${id}/validacion`)
      .set(conToken(tokenOperador)).send({ estado: 'aprobado' });
    expect(res.status).toBe(409);
  });

  test('CP-14-04 un ciudadano no puede validar (403)', async () => {
    const id = await registroPendiente(1);
    const res = await request(app).put(`/api/registros/${id}/validacion`)
      .set(conToken(tokenLaura)).send({ estado: 'aprobado' });
    expect(res.status).toBe(403);
  });
});

describe('ESC-15 inyeccion SQL en los filtros del historial', () => {
  test("CP-15-02 estado=' OR '1'='1 no devuelve registros de otros usuarios", async () => {
    const res = await request(app)
      .get('/api/registros/mios?estado=' + encodeURIComponent("' OR '1'='1"))
      .set(conToken(tokenLaura));
    expect(res.status).toBe(200);
    expect(res.body.registros).toHaveLength(0);
  });
});
