// tests/auth.int.test.js
// Pruebas de integracion del modulo M1 (RF1 registro y RF2 autenticacion).
// Recorren la cadena completa: ruta -> middleware -> controlador -> MariaDB/MySQL.
const jwt = require('jsonwebtoken');
const { app, pool, request, CUENTAS, tokenDe, correoUnico } = require('./helpers/api');

describe('ESC-01 registro con datos validos', () => {
  test('CP-01-01 responde 201, rol Ciudadano y guarda hash bcrypt', async () => {
    const correo = correoUnico('santiago.mejia');
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Santiago Mejía', correo, contrasena: 'Cali2026*', telefono: '3104567890'
    });

    expect(res.status).toBe(201);
    expect(res.body.usuario.rol).toBe('Ciudadano');

    const [filas] = await pool.execute('SELECT contrasena_hash FROM usuario WHERE correo = ?', [correo]);
    expect(filas[0].contrasena_hash).not.toBe('Cali2026*');
    expect(filas[0].contrasena_hash).toMatch(/^\$2[aby]\$10\$/); // formato bcrypt, 10 rondas
  });
});

describe('ESC-02 registro con correo existente', () => {
  test('CP-02-01 correo identico responde 409', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Laura Gómez', correo: 'laura@ecorecicla.test', contrasena: 'OtraClave123'
    });
    expect(res.status).toBe(409);
  });

  test('CP-02-02 el mismo correo en mayusculas tambien responde 409', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Laura Gómez', correo: 'LAURA@EcoRecicla.test', contrasena: 'OtraClave123'
    });
    expect(res.status).toBe(409);
  });
});

describe('ESC-03 registro con datos invalidos', () => {
  test('CP-03-04 responde 400 con el detalle de cada validacion', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Jo', correo: 'no-es-correo', contrasena: '123'
    });
    expect(res.status).toBe(400);
    expect(res.body.detalles).toHaveLength(3);
  });
});

describe('ESC-04 inicio de sesion valido', () => {
  test('CP-04-01 responde 200 y un JWT con rol y expiracion de 2 h', async () => {
    const res = await request(app).post('/api/auth/login').send(CUENTAS.operador);
    expect(res.status).toBe(200);

    const datos = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(datos.rol).toBe('Operador');
    expect(datos.exp - datos.iat).toBe(2 * 60 * 60);
  });
});

describe('ESC-05 inicio de sesion fallido', () => {
  test('CP-05-01 contrasena incorrecta y correo inexistente dan el mismo 401', async () => {
    const claveMala = await request(app).post('/api/auth/login')
      .send({ correo: 'carlos@ecorecicla.test', contrasena: 'NoEsLaClave1' });
    const correoMalo = await request(app).post('/api/auth/login')
      .send({ correo: 'nadie@ecorecicla.test', contrasena: 'NoEsLaClave1' });

    expect(claveMala.status).toBe(401);
    expect(correoMalo.status).toBe(401);
    // Mismo mensaje: no se revela que correos existen
    expect(claveMala.body.error).toBe(correoMalo.body.error);
    expect(claveMala.body.token).toBeUndefined();
  });
});

describe('ESC-06 ruta protegida sin token valido', () => {
  test('CP-06-01 sin token responde 401', async () => {
    const res = await request(app).get('/api/registros/mios');
    expect(res.status).toBe(401);
    expect(res.body.registros).toBeUndefined();
  });

  test('CP-06-02 token expirado responde 401', async () => {
    const vencido = jwt.sign({ id_usuario: 3, rol: 'Ciudadano' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = await request(app).get('/api/registros/mios').set('Authorization', 'Bearer ' + vencido);
    expect(res.status).toBe(401);
  });

  test('CP-06-03 token firmado con otra clave (alterado) responde 401', async () => {
    const falso = jwt.sign({ id_usuario: 1, rol: 'Administrador' }, 'clave-de-un-atacante');
    const res = await request(app).get('/api/tipos').set('Authorization', 'Bearer ' + falso);
    expect(res.status).toBe(401);
  });
});

describe('ESC-07 ciudadano en ruta de administrador', () => {
  test.each([
    ['post', '/api/puntos'],
    ['get', '/api/tipos'],
    ['get', '/api/reportes/global?desde=2026-01-01&hasta=2026-12-31']
  ])('CP-07-01 %s %s responde 403', async (metodo, ruta) => {
    const token = await tokenDe('laura');
    const res = await request(app)[metodo](ruta).set('Authorization', 'Bearer ' + token).send({});
    expect(res.status).toBe(403);
  });
});

describe('ESC-15 inyeccion SQL en el inicio de sesion', () => {
  test.each([
    "' OR '1'='1",
    "admin@ecorecicla.test' -- ",
    "x' UNION SELECT 1,2,3,4,5,6,7 -- "
  ])('CP-15-01 correo %p no inicia sesion', async (correo) => {
    const res = await request(app).post('/api/auth/login').send({ correo, contrasena: "' OR '1'='1" });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });
});
