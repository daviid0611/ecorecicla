/**
 * Punto de entrada de la API REST de EcoRecicla.
 * Express tambien sirve la carpeta frontend/ como contenido estatico:
 * en desarrollo evita problemas de CORS y en produccion ese rol lo
 * cumple Nginx, como muestra el diagrama de despliegue.
 */
require('dotenv').config();
const path = require('path');
const express = require('express');

const rutasAuth = require('./src/routes/auth.routes');
const rutasPuntos = require('./src/routes/puntos.routes');
const rutasRegistros = require('./src/routes/registros.routes');
const rutasReportes = require('./src/routes/reportes.routes');
const rutasTipos = require('./src/routes/tipos.routes');
const { noEncontrado, manejadorErrores } = require('./src/middlewares/error');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/auth', rutasAuth);
app.use('/api/puntos', rutasPuntos);
app.use('/api/registros', rutasRegistros);
app.use('/api/reportes', rutasReportes);
app.use('/api/tipos', rutasTipos);

// 404 solo para rutas de API: las demas las resuelve el estatico.
app.use('/api', noEncontrado);
app.use(manejadorErrores);

const PUERTO = Number(process.env.PORT || 3000);
app.listen(PUERTO, () => {
  console.log('EcoRecicla API escuchando en http://localhost:' + PUERTO);
});

module.exports = app;
