# EcoRecicla - Prototipo completo (fases 1, 2 y 3)

Plataforma web para el registro y seguimiento del reciclaje urbano.
Proyecto PLANETA VERDE - Universidad Manuela Beltran.
Asignaturas: Estandares y Metricas de Calidad de Software / Ingenieria Web.

Autores: David Alejandro Zambrano Arguello, Samuel Ossa Escobar.

Autor: David Alejandro Zambrano Arguello (práctica de control de versiones, Guía 7).

## Que incluye esta fase

| RF | Descripcion | Estado |
|----|-------------|--------|
| RF1 | Registro de usuarios (rol Ciudadano por defecto) | Implementado |
| RF2 | Login con JWT + autorizacion por rol | Implementado |
| RF3 | Consulta publica de puntos activos, con filtro por tipo y localidad | Implementado |
| RF4 | Registro de reciclaje (valida que el punto acepte ese residuo) | Implementado |
| RF5 | Historial personal con filtros de fecha, tipo y estado | Implementado |
| RF6 | Reporte por periodo con kg y CO2 evitado | Implementado |
| RF7 | Estadisticas ambientales (por mes, por tipo y ranking de puntos) | Implementado |
| RF8 | CRUD completo de puntos de reciclaje (solo Administrador) | Implementado |
| RF10 | Validacion de registros por el operador de su punto | Implementado |
| RF9 | Gestion de tipos de residuo y su factor de CO2 | Implementado |

Completitud funcional: **10 de 10 RF (100%)**, por encima de la meta del 90%
de la tabla de metricas ISO/IEC 25010 del documento de especificacion.

## Stack

- Backend: Node.js + Express, mysql2 con consultas parametrizadas, JWT, bcrypt, dotenv.
- Frontend: HTML5 semantico + CSS3 con Flexbox + JavaScript vanilla (fetch). Sin frameworks.
- Base de datos: MySQL 8, base `ecorecicla`.

## Instalacion paso a paso (Windows)

Requisitos: Node.js 18 o superior y MySQL 8 instalados.

### 1. Instalar dependencias

Abrir PowerShell o CMD en la carpeta del proyecto:

```bash
cd ecorecicla\backend
npm install
```

### 2. Crear la base de datos

```bash
mysql -u root -p < ..\database\schema.sql
```

Si `mysql` no se reconoce como comando, usar la ruta completa, por ejemplo:

```bash
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < ..\database\schema.sql
```

El script borra y vuelve a crear la base `ecorecicla` con las tablas, los roles,
los 3 puntos de ejemplo, los 5 tipos de residuo y las dos vistas de impacto.

### 3. Configurar el archivo .env

Copiar `.env.example` a `backend\.env` y poner la contrasena de MySQL:

```bash
copy ..\.env.example .env
```

Contenido a revisar en `backend\.env`:

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_de_mysql
DB_NAME=ecorecicla
JWT_SECRET=cambia_esta_clave_secreta_ecorecicla
JWT_EXPIRA=2h
```

### 4. Cargar los usuarios de prueba (seed)

```bash
npm run seed
```

El seed genera los hashes con bcrypt en el momento: por eso las contrasenas
de abajo si funcionan (en el .sql nunca se escriben hashes a mano).

| Rol | Correo | Contrasena |
|-----|--------|------------|
| Administrador | admin@ecorecicla.test | `Admin123*` |
| Operador (EcoPunto Suba) | operador@ecorecicla.test | `Operador123*` |
| Ciudadano | laura@ecorecicla.test | `Ciudadano123*` |
| Ciudadano | carlos@ecorecicla.test | `Ciudadano123*` |

### 5. Levantar el backend (y el frontend)

```bash
npm start
```

Express sirve la API en `/api` y tambien la carpeta `frontend/` como contenido
estatico, asi que no hace falta un segundo servidor ni configurar CORS.

Abrir en el navegador: <http://localhost:3000>

| Pantalla | URL | Quien entra |
|----------|-----|-------------|
| Portada | `/index.html` | Todos |
| Login y registro | `/login.html` | Todos |
| Puntos de reciclaje (RF3) | `/puntos.html` | Publico, sin sesion |
| Registrar reciclaje (RF4) | `/registrar.html` | Ciudadano |
| Mi historial (RF5) | `/historial.html` | Ciudadano |
| Reportes y estadisticas (RF6, RF7) | `/reportes.html` | Ciudadano y Administrador |
| Validar registros (RF10) | `/validar.html` | Operador |
| Administrar puntos (RF8) | `/admin-puntos.html` | Administrador |
| Tipos de residuo (RF9) | `/admin-tipos.html` | Administrador |

Al iniciar sesion cada rol cae en su pantalla: Administrador en administrar
puntos, Operador en validar, Ciudadano en registrar reciclaje.

En el diagrama de despliegue ese rol de servidor estatico lo cumple Nginx;
en desarrollo lo hace el mismo Express.

## Probar la API con Postman

Importar `docs/EcoRecicla.postman_collection.json`.
Ejecutar primero **RF2 - Login administrador**: guarda el token en la variable
`{{token}}` y las demas peticiones lo reutilizan.

## Endpoints

| Metodo | Ruta | Acceso | Codigos |
|--------|------|--------|---------|
| POST | `/api/auth/registro` | Publico | 201, 400, 409 |
| POST | `/api/auth/login` | Publico | 200, 400, 401 |
| GET | `/api/auth/perfil` | Autenticado | 200, 401, 404 |
| GET | `/api/puntos` | Administrador | 200, 401, 403 |
| GET | `/api/puntos/:id` | Administrador | 200, 401, 403, 404 |
| GET | `/api/puntos/publicos` | Publico | 200 |
| GET | `/api/puntos/localidades` | Publico | 200 |
| GET | `/api/puntos/tipos-residuo` | Publico | 200 |
| POST | `/api/puntos` | Administrador | 201, 400, 401, 403 |
| PUT | `/api/puntos/:id` | Administrador | 200, 400, 401, 403, 404 |
| DELETE | `/api/puntos/:id` | Administrador | 200, 401, 403, 404 |
| POST | `/api/registros` | Ciudadano | 201, 400, 401, 403, 404 |
| GET | `/api/registros/mios` | Autenticado | 200, 400, 401 |
| GET | `/api/registros/mi-punto` | Operador | 200, 401, 403 |
| PUT | `/api/registros/:id/validacion` | Operador | 200, 400, 401, 403, 404, 409 |
| GET | `/api/reportes/personal` | Autenticado | 200, 400, 401 |
| GET | `/api/reportes/global` | Administrador | 200, 400, 401, 403 |
| GET | `/api/reportes/estadisticas` | Autenticado | 200, 401 |
| GET | `/api/tipos` | Administrador | 200, 401, 403 |
| GET | `/api/tipos/:id` | Administrador | 200, 401, 403, 404 |
| POST | `/api/tipos` | Administrador | 201, 400, 401, 403, 409 |
| PUT | `/api/tipos/:id` | Administrador | 200, 400, 401, 403, 404, 409 |
| DELETE | `/api/tipos/:id` | Administrador | 200, 401, 403, 404, 409 |

`DELETE` hace **borrado logico** (`estado = 'inactivo'`): los registros
historicos de reciclaje apuntan al punto con llave foranea y un borrado
fisico perderia el impacto ambiental ya reportado.

## Export de la base de datos incluido

`database/ecorecicla_export.sql` ya viene generado con mysqldump despues de
correr el seed: trae las 7 tablas, las 2 vistas, los datos de ejemplo y los
hashes reales de bcrypt. Se restaura con:

```bash
mysql -u root -p < database\ecorecicla_export.sql
```

## Regenerar el export despues de cambiar datos

Despues de crear la base y correr el seed:

```bash
mysqldump -u root -p --databases ecorecicla --routines --triggers --events --result-file=ecorecicla_export.sql
```

Con ruta completa si `mysqldump` no esta en el PATH:

```bash
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u root -p --databases ecorecicla --routines --triggers --events --result-file=ecorecicla_export.sql
```

## Estructura del proyecto

```
ecorecicla/
  backend/
    app.js                     App de Express y middlewares globales (sin listen)
    server.js                  Arranque: abre el puerto (npm start)
    package.json
    src/
      db.js                    Pool de conexiones MySQL
      routes/                  Rutas: auth, puntos, registros, reportes
      controllers/             Logica de cada endpoint
      middlewares/             JWT, autorizacion por rol, manejo de errores
  frontend/
    index.html login.html admin-puntos.html
    puntos.html registrar.html historial.html reportes.html validar.html
    admin-tipos.html
    css/estilos.css
    js/api.js js/login.js js/admin-puntos.js js/puntos.js
    js/registrar.js js/historial.js js/reportes.js js/validar.js js/admin-tipos.js
  database/
    schema.sql                 Estructura + datos base + vistas
    seed.js                    Usuarios con bcrypt + registros de ejemplo
    ecorecicla_export.sql      Export listo para entregar (mysqldump)
  docs/
    GUIA_SUSTENTACION.md
    EcoRecicla.postman_collection.json
    Documentacion_EcoRecicla.docx        RF, RNF, historias de usuario y diagramas
    Poster_PlanetaVerde_EcoRecicla.docx  Poster del evento
  .env.example  .gitignore  README.md
```


## Flujo de demostracion sugerido para la sustentacion

1. Entrar como **administrador** y crear un punto nuevo con sus tipos de residuo (RF8).
2. Abrir `/puntos.html` **sin sesion** y ver ese punto en la consulta publica, filtrando por tipo y localidad (RF3).
3. Entrar como **laura@ecorecicla.test** y registrar 5 kg de plastico en EcoPunto Suba (RF4).
   Intentar registrar metal en EcoPunto Chapinero: el backend responde 400 porque ese punto no lo acepta.
4. Ver el historial: el registro aparece como **pendiente** y no suma al CO2 (RF5).
5. Entrar como **operador@ecorecicla.test** y aprobarlo desde `/validar.html` (RF10).
   Intentar validar un registro de otro punto: responde 403.
6. Volver como ciudadano a `/reportes.html` y generar el reporte del periodo:
   ahora si suma kg y CO2 evitado (RF6), y las estadisticas muestran el ranking de puntos (RF7).
7. Entrar a `/admin-tipos.html` como administrador, crear un tipo nuevo y editar un factor (RF9).
   El boton Eliminar aparece deshabilitado en los tipos que ya estan en uso; por API responde 409.
8. Desactivar un punto desde administrar puntos y comprobar que desaparece de la consulta publica
   pero los registros historicos siguen existiendo (borrado logico).

## Verificacion realizada

La API se probo de extremo a extremo contra una base de datos temporal
(`ecorecicla_tmpprueba`, borrada despues de la prueba) con estos resultados:
login de los tres roles, creacion de punto (201), latitud fuera de rango (400),
consulta publica con filtros (200), registro valido (201), tipo no aceptado por
el punto (400), cantidad negativa (400), historial filtrado (200), bandeja del
operador (200), aprobacion (200), aprobar dos veces (409), ciudadano intentando
validar (403), estado invalido (400), reporte con fechas invalidas (400),
reporte global como ciudadano (403), estadisticas (200), borrado logico (200) y
desaparicion del punto de la consulta publica.

Para el RF9 se verifico ademas: listar con contadores de uso (200), crear (201),
factor negativo (400), nombre repetido (409), crear como ciudadano (403),
actualizar (200), tipo inexistente (404), eliminar un tipo en uso (409) y
eliminar un tipo sin uso (200).
