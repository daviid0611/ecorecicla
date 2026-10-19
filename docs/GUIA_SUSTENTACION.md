# Guia de sustentacion - EcoRecicla

Documento de apoyo para explicar el codigo en clase.

## 1. Arquitectura en tres capas

Coincide con el diagrama de despliegue del poster:

- **Capa de cliente**: navegador con HTML5, CSS3 (Flexbox) y JavaScript vanilla.
- **Capa de aplicacion**: Node.js + Express (API REST, JWT, bcrypt) en el puerto 3000.
- **Capa de datos**: MySQL 8, base `ecorecicla`, puerto 3306.

En produccion Nginx sirve el frontend y hace de proxy hacia Express; en
desarrollo Express sirve los dos para simplificar (`express.static`).

## 2. Flujo completo de una peticion del CRUD de puntos

Ejemplo: el administrador crea un punto desde `admin-puntos.html`.

1. **Navegador** - el administrador llena el formulario y pulsa "Crear punto".
   `frontend/js/admin-puntos.js` captura el evento `submit`, evita el envio
   tradicional (`evento.preventDefault()`) y arma un objeto con
   `datosDelFormulario()`, incluyendo el arreglo `tipos` de los checkboxes.

2. **Capa de acceso a la API** - llama a `Api.crearPunto(datos)` en
   `frontend/js/api.js`, que hace `fetch('/api/puntos', { method: 'POST' })`
   agregando dos cabeceras: `Content-Type: application/json` y
   `Authorization: Bearer <token>`. El token salio del login y vive en
   `localStorage`.

3. **Express** - `backend/app.js` recibe la peticion.
   `express.json()` convierte el cuerpo JSON en `req.body` y la peticion entra
   por `app.use('/api/puntos', rutasPuntos)`.

4. **Router** - `src/routes/puntos.routes.js` hace coincidir `POST /` y ejecuta
   la cadena de middlewares en orden: `autenticar`, `autorizar('Administrador')`,
   y por ultimo el controlador.

5. **Middleware JWT** - `src/middlewares/auth.js` lee el encabezado
   `Authorization`, separa el esquema `Bearer` del token y lo verifica con
   `jwt.verify(token, JWT_SECRET)`. Si falla responde **401**. Si pasa, guarda
   el contenido del token en `req.usuario` (`id_usuario`, `rol`, `id_punto`).

6. **Middleware de rol** - `src/middlewares/rol.js` compara `req.usuario.rol`
   con los roles permitidos. Si no coincide responde **403**.
   La diferencia importa: 401 es "no se quien eres", 403 es "se quien eres y no puedes".

7. **Controlador** - `src/controllers/puntos.controller.js`, funcion `crear`:
   - `validarPunto()` revisa campos obligatorios y rangos de latitud/longitud.
     Si hay errores lanza `ErrorApi(400, ...)` con la lista de detalles.
   - Abre una **transaccion** (`beginTransaction`): el punto y sus tipos
     aceptados deben guardarse juntos o no guardarse.
   - `INSERT INTO punto_reciclaje ... VALUES (?, ?, ?, ?, ?, ?)` con
     **consulta parametrizada**: los valores viajan aparte del SQL, por eso no
     hay inyeccion SQL (RNF2).
   - `guardarTipos()` borra e inserta las filas de `punto_tipo_residuo`.
   - `commit()` y respuesta **201** con el punto recien creado.

8. **MySQL** - ejecuta las sentencias dentro de la transaccion y devuelve
   `insertId`. Las llaves foraneas garantizan que los tipos existan.

9. **Respuesta** - Express serializa el JSON. En el navegador, `peticion()`
   verifica `respuesta.ok`; si no lo es arma el mensaje de error con
   `cuerpo.error` y `cuerpo.detalles`. Si todo sale bien, `admin-puntos.js`
   muestra el aviso y vuelve a cargar la tabla con `cargarTabla()`.

Si en cualquier punto se lanza un error, `asincrono()` lo pasa a `next(err)` y
lo atiende `manejadorErrores` en `src/middlewares/error.js`, que responde
siempre con la misma forma `{ error, detalles }`.

## 3. Que hace cada archivo

### Backend

| Archivo | Responsabilidad |
|---------|-----------------|
| `backend/app.js` | Carga `.env`, registra `express.json()`, el estatico del frontend, las rutas, el 404 de API y el manejador de errores. Levanta el servidor. |
| `src/db.js` | Crea el pool de conexiones mysql2 (10 conexiones) que reutilizan todos los controladores. |
| `src/middlewares/error.js` | Clase `ErrorApi` (codigo + mensaje + detalles), envoltorio `asincrono()`, `noEncontrado` (404) y `manejadorErrores` (respuesta unica y 500 sin filtrar detalles internos). |
| `src/middlewares/auth.js` | Verifica el JWT y llena `req.usuario`. Responde 401. |
| `src/middlewares/rol.js` | `autorizar('Administrador')`. Responde 403. |
| `src/routes/auth.routes.js` | `POST /registro`, `POST /login`, `GET /perfil`. |
| `src/routes/registros.routes.js` | RF4 (`POST /`), RF5 (`GET /mios`) y RF10 (`GET /mi-punto`, `PUT /:id/validacion`). |
| `src/routes/reportes.routes.js` | RF6 (`GET /personal`, `GET /global`) y RF7 (`GET /estadisticas`). |
| `src/routes/tipos.routes.js` | RF9: ABM de tipos de residuo, todo con rol Administrador. |
| `src/controllers/tipos.controller.js` | RF9: valida que el factor de CO2 sea positivo, controla nombres repetidos (409) y bloquea el borrado de un tipo en uso (409). |
| `src/controllers/registros.controller.js` | RF4, RF5 y RF10. Valida que el punto acepte el residuo y que el operador solo toque su punto. |
| `src/controllers/reportes.controller.js` | RF6 y RF7 sobre las vistas de impacto. Guarda cada reporte generado en la tabla `reporte`. |
| `src/routes/puntos.routes.js` | Las 5 operaciones del CRUD (con `autenticar` y `autorizar('Administrador')`) mas las rutas publicas `GET /publicos`, `GET /localidades` y `GET /tipos-residuo`. |
| `src/controllers/auth.controller.js` | RF1 y RF2: validacion, control de correo duplicado (409), hash con bcrypt, comparacion y firma del JWT. |
| `src/controllers/puntos.controller.js` | RF8: listar, obtener, crear, actualizar, desactivar, tipos de residuo. Validaciones y transacciones. |

### Frontend

| Archivo | Responsabilidad |
|---------|-----------------|
| `index.html` | Portada con accesos por rol. |
| `login.html` + `js/login.js` | RF1 y RF2 desde el navegador. Formularios con `label`, `aria-describedby` y avisos con `aria-live`. |
| `admin-puntos.html` + `js/admin-puntos.js` | RF8: tabla de puntos y formulario unico que sirve para crear y editar. |
| `js/api.js` | Objeto `Sesion` (token en localStorage) y objeto `Api` con una funcion por endpoint. Centraliza el manejo de errores. |
| `css/estilos.css` | Flexbox, variables CSS y un `media query` a 600px para el diseno responsive. |
| `puntos.html` + `js/puntos.js` | RF3: consulta publica de puntos activos con filtros por tipo y localidad. No pide token. |
| `registrar.html` + `js/registrar.js` | RF4: registro de reciclaje en 4 pasos (RNF3). El select de tipos se filtra segun el punto elegido. |
| `historial.html` + `js/historial.js` | RF5: historial con filtros de fecha, tipo y estado, mas tarjetas de resumen. |
| `validar.html` + `js/validar.js` | RF10: bandeja del operador con aprobar y rechazar. |
| `reportes.html` + `js/reportes.js` | RF6 y RF7: reporte por periodo, acumulado por mes y ranking de puntos. |
| `admin-tipos.html` + `js/admin-tipos.js` | RF9: tabla de tipos con contadores de uso y formulario de crear/editar. |

### Base de datos

| Archivo | Responsabilidad |
|---------|-----------------|
| `database/schema.sql` | Tablas, llaves foraneas, CHECK, indices, datos base y las dos vistas de impacto. |
| `database/seed.js` | Usuarios con hash bcrypt real y registros de ejemplo. Agrega `backend/node_modules` a `module.paths` porque el script vive fuera de esa carpeta. |

## 4. Cambios al modelo de datos respecto al primer export

1. `usuario.id_punto` (FK a `punto_reciclaje`, NULL): permite saber que punto
   valida cada operador. Antes no existia y el RF10 no se podia cumplir.
2. `registro_reciclaje.validado TINYINT` se reemplazo por
   `estado ENUM('pendiente','aprobado','rechazado')` mas `id_validador`,
   `fecha_validacion` y `observacion_validacion`. Un registro rechazado no es
   lo mismo que uno pendiente, y HU10 exige poder rechazar con observacion.
3. Las vistas `v_impacto_registro` y `v_estadisticas_mensuales` filtran
   `estado = 'aprobado'`: un dato sin validar no puede sumar al impacto.
4. Indice `idx_reg_punto_estado (id_punto, estado)`: es exactamente la consulta
   que hace la bandeja del operador (`GET /api/registros/mi-punto`).
5. Los usuarios salieron del `.sql` y los crea `seed.js` con bcrypt.

## 5. Decisiones de calidad (Estandares y Metricas)

- **Codigos HTTP**: 200 consulta/actualizacion correcta, 201 creacion,
  400 datos invalidos, 401 sin token o token invalido, 403 rol sin permiso,
  404 recurso inexistente, 409 correo duplicado, 500 error no controlado.
- **Manejo centralizado de errores**: un unico `manejadorErrores`; los 500 no
  exponen detalles internos al cliente (solo se escriben en consola).
- **Complejidad ciclomatica <= 10 (RNF5)**: funciones cortas con una sola
  responsabilidad. Por ejemplo la validacion se parte en
  `errorDeCoordenada()` y `validarPunto()` en vez de una sola funcion con
  muchos `if` encadenados.
- **Seguridad (RNF2)**: bcrypt con 10 rondas, JWT firmado, consultas
  parametrizadas en el 100% de los accesos a la BD, escape de HTML en el
  frontend antes de pintar datos en la tabla, y mensaje de login generico para
  no revelar que correos existen.
- **Accesibilidad (RNF3)**: cada `input` tiene su `label`, las ayudas usan
  `aria-describedby`, los avisos usan `role="status"` y `aria-live="polite"`,
  y la navegacion tiene `aria-label`.

## 6. Estado de los requerimientos funcionales

| RF | Estado | Donde |
|----|--------|-------|
| RF1 Registro de usuarios | Implementado | `auth.controller.js` -> `registrar` |
| RF2 Autenticacion y roles | Implementado | `auth.controller.js` -> `login`, middlewares `auth.js` y `rol.js` |
| RF3 Consulta publica de puntos | Implementado | `puntos.controller.js` -> `listarPublicos` + `puntos.html` |
| RF4 Registro de reciclaje | Implementado | `registros.controller.js` -> `crear` + `registrar.html` |
| RF5 Historial personal | Implementado | `registros.controller.js` -> `mios` + `historial.html` |
| RF6 Reportes por periodo | Implementado | `reportes.controller.js` -> `personal` y `global` |
| RF7 Estadisticas ambientales | Implementado | `reportes.controller.js` -> `estadisticas` |
| RF8 Gestion de puntos | Implementado (CRUD completo) | `puntos.controller.js` + `admin-puntos.html` |
| RF9 Gestion de tipos de residuo | Implementado | `tipos.controller.js` + `admin-tipos.html` |
| RF10 Validacion del operador | Implementado | `registros.controller.js` -> `deMiPunto` y `validar` + `validar.html` |

Completitud funcional = 10 RF implementados / 10 especificados = **100%**,
por encima de la meta del 90% de adecuacion funcional de la tabla ISO/IEC 25010.

## 7. Preguntas probables del docente

**Por que el DELETE no borra la fila?**
Porque `registro_reciclaje` tiene una llave foranea hacia `punto_reciclaje`.
Un borrado fisico fallaria por integridad referencial, o peor, con `ON DELETE
CASCADE` borraria el historico de reciclaje y el impacto ambiental reportado.
Por eso `DELETE /api/puntos/:id` marca `estado = 'inactivo'`.

**Como se evita la inyeccion SQL?**
Nunca se concatena SQL. Se usa `pool.execute(sql, [valores])` de mysql2, que
envia la sentencia y los datos por separado (prepared statements).

**Donde se guarda la contrasena?**
Nunca en texto plano. `bcrypt.hash(clave, 10)` guarda el hash en
`usuario.contrasena_hash` y en el login se compara con `bcrypt.compare()`.

**Que lleva el token?**
`id_usuario`, `rol` e `id_punto`, firmado con `JWT_SECRET` y con expiracion de
2 horas. No lleva la contrasena ni datos sensibles.

**Por que Express sirve el frontend?**
Para que todo corra con un solo comando y sin CORS en desarrollo. En el
diagrama de despliegue ese papel lo cumple Nginx.


## 8. Flujo del registro de reciclaje (RF4) y su validacion (RF10)

Es el proceso principal del diagrama de procesos del documento.

1. El ciudadano inicia sesion (RF2) y entra a `registrar.html`.
2. Elige punto: `js/registrar.js` ya tiene la lista de `GET /api/puntos/publicos`,
   que incluye los tipos aceptados por cada punto, y filtra el segundo select.
3. Escribe la cantidad en kg y envia. `POST /api/registros` con el token.
4. El controlador valida: cantidad numerica y mayor que cero, punto existente y
   activo, y sobre todo que exista la fila en `punto_tipo_residuo` que une ese
   punto con ese tipo. Si no existe, responde **400**. Esta comprobacion vive en
   el backend a proposito: el frontend se puede manipular.
5. El registro se guarda con `estado = 'pendiente'`. Aun no suma al impacto.
6. El operador de ese punto entra a `validar.html`. `GET /api/registros/mi-punto`
   usa el `id_punto` **del token**, no un parametro del cliente: un operador no
   puede pedir la bandeja de otro punto.
7. Aprueba o rechaza con `PUT /api/registros/:id/validacion`. El controlador
   verifica que el registro sea de su punto (si no, **403**) y que siga
   pendiente (si ya fue validado, **409**). Guarda `id_validador`,
   `fecha_validacion` y la observacion.
8. Al quedar en `aprobado`, el registro entra en la vista `v_impacto_registro`
   y desde ese momento suma en el historial (RF5), en el reporte por periodo
   (RF6) y en las estadisticas (RF7).

## 9. Como se calcula el CO2 evitado

`co2_evitado_kg = cantidad_kg * tipo_residuo.factor_co2_kg`, redondeado a dos
decimales. El calculo esta en la vista `v_impacto_registro`, no repetido en el
codigo JavaScript: si manana cambia un factor, cambia en un solo lugar y todos
los reportes quedan coherentes.

## 10. Pruebas realizadas sobre la API

Prueba de extremo a extremo contra una base temporal, con los tres roles.
Resultados obtenidos (codigo HTTP real):

| Caso | Esperado | Obtenido |
|------|----------|----------|
| Crear punto como administrador | 201 | 201 |
| Latitud fuera de rango | 400 | 400 |
| Crear punto como ciudadano | 403 | 403 |
| Consulta publica sin token | 200 | 200 |
| Registrar reciclaje valido | 201 | 201 |
| Registrar residuo que el punto no acepta | 400 | 400 |
| Registrar cantidad negativa | 400 | 400 |
| Aprobar registro (operador) | 200 | 200 |
| Aprobar un registro ya validado | 409 | 409 |
| Validar siendo ciudadano | 403 | 403 |
| Validar con estado invalido | 400 | 400 |
| Reporte con fechas invalidas | 400 | 400 |
| Reporte global como ciudadano | 403 | 403 |
| Punto inexistente | 404 | 404 |
| Borrado logico y desaparicion de la consulta publica | 200 | 200 |
| Crear tipo de residuo (RF9) | 201 | 201 |
| Crear tipo con factor negativo | 400 | 400 |
| Crear tipo con nombre repetido | 409 | 409 |
| Crear tipo siendo ciudadano | 403 | 403 |
| Actualizar tipo | 200 | 200 |
| Eliminar tipo en uso | 409 | 409 |
| Eliminar tipo sin uso | 200 | 200 |


## 11. Por que los puntos se desactivan y los tipos de residuo se borran

Es la pregunta que mas se presta para confundirse, porque son dos decisiones
distintas para dos tablas parecidas.

- **`punto_reciclaje`** tiene columna `estado`. Un punto siempre acumula
  historico (`registro_reciclaje.id_punto`), asi que borrarlo perderia datos ya
  reportados. Por eso `DELETE /api/puntos/:id` hace borrado logico y el punto
  desaparece de la consulta publica, pero los registros viejos siguen apuntando
  a el.
- **`tipo_residuo`** es un catalogo pequeno y no tiene columna `estado`. Si un
  tipo no lo usa ningun registro ni ningun punto, no hay historico que proteger
  y se borra de verdad. Si esta en uso, el controlador responde **409** con el
  detalle de cuantos registros y cuantos puntos lo usan, y el boton Eliminar
  aparece deshabilitado en la interfaz.

El criterio en ambos casos es el mismo: **nunca se destruye informacion que
sostiene el impacto ambiental ya reportado**; lo que cambia es que uno de los
dos siempre tiene historico y el otro puede no tenerlo.

## 12. Efecto de cambiar un factor de CO2

`factor_co2_kg` no se copia dentro de `registro_reciclaje`: la vista
`v_impacto_registro` lo multiplica al momento de consultar. Editar el factor de
un tipo recalcula el CO2 de todo el historico de ese residuo, y la API lo avisa
en el mensaje de respuesta del `PUT`. La alternativa habria sido guardar el
factor usado en cada registro (historizarlo); se escogio la vista por
simplicidad y porque el factor es un valor de referencia ambiental, no un precio.
