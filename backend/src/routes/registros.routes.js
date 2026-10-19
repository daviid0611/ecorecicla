// RF4, RF5 y RF10: registros de reciclaje.
const express = require('express');
const ctrl = require('../controllers/registros.controller');
const { asincrono } = require('../middlewares/error');
const { autenticar } = require('../middlewares/auth');
const { autorizar } = require('../middlewares/rol');

const router = express.Router();

// RF4: el ciudadano registra lo que reciclo.
router.post('/', autenticar, autorizar('Ciudadano', 'Administrador'), asincrono(ctrl.crear));

// RF5: historial propio con filtros de fecha y tipo.
router.get('/mios', autenticar, asincrono(ctrl.mios));

// RF10: bandeja del operador y validacion. Solo registros de SU punto.
router.get('/mi-punto', autenticar, autorizar('Operador'), asincrono(ctrl.deMiPunto));
router.put('/:id/validacion', autenticar, autorizar('Operador'), asincrono(ctrl.validar));

module.exports = router;
