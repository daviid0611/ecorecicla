// tests/impacto.int.test.js
// Pruebas de integracion del impacto ambiental: M4 (factor de CO2, RF9) y
// M5/M6 (reportes RF6 y estadisticas RF7). Comparan lo que responde la API
// con lo que calcula directamente la base de datos.
const { app, pool, request, tokenDe } = require('./helpers/api');

let tokenAdmin;
let tokenCarlos;

beforeAll(async () => {
  [tokenAdmin, tokenCarlos] = await Promise.all(['admin', 'carlos'].map(tokenDe));
});

const conToken = (token) => ({ Authorization: 'Bearer ' + token });

describe('ESC-14 totales del reporte y de las estadisticas', () => {
  test('CP-14-05 el reporte global coincide con la suma de los registros aprobados', async () => {
    const res = await request(app)
      .get('/api/reportes/global?desde=2026-01-01&hasta=2026-12-31')
      .set(conToken(tokenAdmin));

    const [bd] = await pool.execute(
      `SELECT SUM(r.cantidad_kg) AS kg, SUM(ROUND(r.cantidad_kg * t.factor_co2_kg, 2)) AS co2
       FROM registro_reciclaje r JOIN tipo_residuo t ON t.id_tipo = r.id_tipo
       WHERE r.estado = 'aprobado' AND r.fecha_registro BETWEEN '2026-01-01 00:00:00' AND '2026-12-31 23:59:59'`
    );

    expect(res.status).toBe(200);
    expect(res.body.totales.total_kg).toBeCloseTo(Number(bd[0].kg), 2);
    expect(res.body.totales.co2_evitado_kg).toBeCloseTo(Number(bd[0].co2), 2);
  });

  test('CP-14-06 los registros pendientes no suman al reporte personal', async () => {
    // Carlos tiene en el seed 1,20 kg (RAEE) y 3,10 kg (Plastico) aprobados
    // en agosto-septiembre y 6,00 kg de vidrio pendientes.
    const res = await request(app)
      .get('/api/reportes/personal?desde=2026-08-01&hasta=2026-09-30')
      .set(conToken(tokenCarlos));
    expect(res.status).toBe(200);
    expect(res.body.totales.total_kg).toBeCloseTo(4.3, 2);
  });

  test('CP-14-07 periodo invertido responde 400', async () => {
    const res = await request(app)
      .get('/api/reportes/personal?desde=2026-09-30&hasta=2026-08-01')
      .set(conToken(tokenCarlos));
    expect(res.status).toBe(400);
  });

  test('CP-14-09 una fecha inexistente (30 de febrero) responde 400 y no guarda el reporte', async () => {
    const [antes] = await pool.execute('SELECT COUNT(*) AS n FROM reporte');
    const res = await request(app)
      .get('/api/reportes/personal?desde=2026-02-30&hasta=2026-03-31')
      .set(conToken(tokenCarlos));
    const [despues] = await pool.execute('SELECT COUNT(*) AS n FROM reporte');

    expect(res.status).toBe(400);
    expect(despues[0].n).toBe(antes[0].n);
  });

  test('CP-14-08 las estadisticas suman lo mismo por tipo y por punto', async () => {
    const res = await request(app).get('/api/reportes/estadisticas').set(conToken(tokenCarlos));
    const suma = (lista) => lista.reduce((a, f) => a + Number(f.total_kg), 0);
    expect(res.status).toBe(200);
    expect(suma(res.body.ranking_puntos)).toBeCloseTo(suma(res.body.por_tipo), 2);
  });
});

describe('ESC-12 cambio del factor de CO2 (RF9)', () => {
  test('CP-12-01 el CO2 historico se recalcula con el factor nuevo', async () => {
    // Se crea un tipo propio para no alterar los datos de las demas pruebas
    const tipo = await request(app).post('/api/tipos').set(conToken(tokenAdmin))
      .send({ nombre: 'Tetra Pak ' + Date.now(), factor_co2_kg: 1 });
    expect(tipo.status).toBe(201);
    const idTipo = tipo.body.id_tipo;

    await pool.execute('INSERT INTO punto_tipo_residuo (id_punto, id_tipo) VALUES (1, ?)', [idTipo]);
    await pool.execute(
      `INSERT INTO registro_reciclaje (id_usuario, id_punto, id_tipo, cantidad_kg, estado)
       SELECT id_usuario, 1, ?, 10, 'aprobado' FROM usuario WHERE correo = 'carlos@ecorecicla.test'`,
      [idTipo]
    );

    const cambio = await request(app).put('/api/tipos/' + idTipo).set(conToken(tokenAdmin))
      .send({ nombre: tipo.body.nombre, factor_co2_kg: 2.5 });
    expect(cambio.status).toBe(200);

    const [vista] = await pool.execute(
      'SELECT co2_evitado_kg FROM v_impacto_registro WHERE id_tipo = ?', [idTipo]
    );
    expect(Number(vista[0].co2_evitado_kg)).toBeCloseTo(25, 2); // 10 kg x 2,5
  });

  test('CP-12-02 factor cero o negativo responde 400', async () => {
    const res = await request(app).put('/api/tipos/1').set(conToken(tokenAdmin))
      .send({ nombre: 'Plastico', factor_co2_kg: 0 });
    expect(res.status).toBe(400);
  });

  test('CP-12-03 no se puede borrar un tipo en uso (409)', async () => {
    const res = await request(app).delete('/api/tipos/1').set(conToken(tokenAdmin));
    expect(res.status).toBe(409);
  });
});
