// Rutas del CRUD de puntos de reciclaje (RF8). Todas exigen rol Administrador.
const express = require('express');
const ctrl = require('../controllers/puntos.controller');
const { asincrono } = require('../middlewares/error');
const { autenticar } = require('../middlewares/auth');
const { autorizar } = require('../middlewares/rol');

const router = express.Router();

// RF3: rutas publicas (sin token). Van antes de '/:id' para que Express
// no interprete "publicos" o "tipos-residuo" como un id.
router.get('/publicos', asincrono(ctrl.listarPublicos));
router.get('/localidades', asincrono(ctrl.listarLocalidades));

// Catalogo de tipos de residuo: lo necesitan el administrador y el
// formulario de registro del ciudadano, por eso queda publico.
router.get('/tipos-residuo', asincrono(ctrl.listarTiposResiduo));

router.get('/',    autenticar, autorizar('Administrador'), asincrono(ctrl.listar));
router.get('/:id', autenticar, autorizar('Administrador'), asincrono(ctrl.obtener));
router.post('/',   autenticar, autorizar('Administrador'), asincrono(ctrl.crear));
router.put('/:id', autenticar, autorizar('Administrador'), asincrono(ctrl.actualizar));
router.delete('/:id', autenticar, autorizar('Administrador'), asincrono(ctrl.desactivar));

module.exports = router;
