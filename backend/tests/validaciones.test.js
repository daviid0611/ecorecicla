// tests/validaciones.test.js
// Pruebas unitarias de las reglas de validacion (plan de pruebas PP-ECO-001).
// No tocan la base de datos: llaman directamente a las funciones puras.
const auth = require('../src/controllers/auth.controller');
const registros = require('../src/controllers/registros.controller');

// ---------------------------------------------------------------------------
// ESC-03: validacion del formulario de registro de usuario (RF1)
// ---------------------------------------------------------------------------
describe('ESC-03 validarRegistro de usuario', () => {
  const valido = { nombre: 'Valentina Ríos', correo: 'valentina.rios@correo.com.co', contrasena: 'Bogota2026*' };

  test('CP-03-01 datos validos no generan errores', () => {
    expect(auth.validarRegistro(valido)).toEqual([]);
  });

  // Valores limite del nombre (minimo 3) y de la contrasena (minimo 8)
  test.each([
    ['nombre de 2 caracteres', { nombre: 'Al' }, 'El nombre es obligatorio (minimo 3 caracteres)'],
    ['nombre solo con espacios', { nombre: '     ' }, 'El nombre es obligatorio (minimo 3 caracteres)'],
    ['correo sin dominio', { correo: 'valentina@' }, 'El correo no tiene un formato valido'],
    ['correo con espacios', { correo: 'valentina rios@correo.com.co' }, 'El correo no tiene un formato valido'],
    ['contrasena de 7 caracteres', { contrasena: 'Bogota1' }, 'La contrasena debe tener al menos 8 caracteres']
  ])('CP-03-02 rechaza %s', (_caso, cambio, mensaje) => {
    expect(auth.validarRegistro({ ...valido, ...cambio })).toContain(mensaje);
  });

  test('CP-03-03 acepta nombre de 3 caracteres y contrasena de 8 (limites validos)', () => {
    expect(auth.validarRegistro({ ...valido, nombre: 'Ana', contrasena: 'Medelli8' })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// ESC-09: particiones de equivalencia y valores limite de la cantidad (RF4)
// La columna cantidad_kg es DECIMAL(8,2): el rango valido es 0,01 a 999 999,99.
// ---------------------------------------------------------------------------
describe('ESC-09 validarRegistro de reciclaje (cantidad en kg)', () => {
  const base = { id_punto: 1, id_tipo: 1 };
  const errores = (cantidad) => registros.validarRegistro({ ...base, cantidad_kg: cantidad });

  test.each([0.01, 1, 250, 999999.99, '2.5'])('CP-09-01 particion valida: %p kg', (cantidad) => {
    expect(errores(cantidad)).toEqual([]);
  });

  // La BD guarda 2 decimales: 0,004 se vuelve 0,00 y 0,009 se vuelve 0,01.
  // El minimo real es 0,01 kg, asi que todo lo menor se rechaza en la API.
  test.each([-1, 0, 0.009, 0.004])('CP-09-02 particion invalida inferior: %p kg', (cantidad) => {
    expect(errores(cantidad).join(' ')).toMatch(/cantidad/i);
  });

  test('CP-09-06 el mensaje para 0 kg indica el limite, no el tipo de dato', () => {
    expect(errores(0)).toContain('La cantidad debe ser mayor que cero');
  });

  test.each([1000000, 999999.999])('CP-09-03 particion invalida superior: %p kg', (cantidad) => {
    expect(errores(cantidad)).toContain('La cantidad supera el maximo permitido');
  });

  test.each(['abc', '', null, true, [5]])('CP-09-04 particion invalida de tipo: %p', (cantidad) => {
    expect(errores(cantidad)).toContain('La cantidad debe ser numerica');
  });

  test('CP-09-05 sin punto ni tipo de residuo', () => {
    const lista = registros.validarRegistro({ cantidad_kg: 3 });
    expect(lista).toEqual(expect.arrayContaining([
      'Debe seleccionar un punto de reciclaje',
      'Debe seleccionar un tipo de residuo'
    ]));
  });
});
