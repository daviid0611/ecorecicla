/**
 * Punto de entrada: abre el puerto de la API REST de EcoRecicla.
 * La app se arma en app.js para poder probarla sin abrir el puerto.
 */
const app = require('./app');

const PUERTO = Number(process.env.PORT || 3000);
app.listen(PUERTO, () => {
  console.log('EcoRecicla API escuchando en http://localhost:' + PUERTO);
});
