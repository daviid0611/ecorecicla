// RF9: ABM de tipos de residuo. Todo el modulo exige rol Administrador.
const express = require('express');
const ctrl = require('../controllers/tipos.controller');
const { asincrono } = require('../middlewares/error');
const { autenticar } = require('../middlewares/auth');
const { autorizar } = require('../middlewares/rol');

const router = express.Router();

// El catalogo publico sigue estando en GET /api/puntos/tipos-residuo:
// estas rutas son las de administracion, con contadores de uso.
router.get('/',       autenticar, autorizar('Administrador'), asincrono(ctrl.listar));
router.get('/:id',    autenticar, autorizar('Administrador'), asincrono(ctrl.obtener));
router.post('/',      autenticar, autorizar('Administrador'), asincrono(ctrl.crear));
router.put('/:id',    autenticar, autorizar('Administrador'), asincrono(ctrl.actualizar));
router.delete('/:id', autenticar, autorizar('Administrador'), asincrono(ctrl.eliminar));

module.exports = router;
