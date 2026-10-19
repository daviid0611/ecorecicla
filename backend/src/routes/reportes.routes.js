// RF6 (reportes por periodo) y RF7 (estadisticas ambientales).
const express = require('express');
const ctrl = require('../controllers/reportes.controller');
const { asincrono } = require('../middlewares/error');
const { autenticar } = require('../middlewares/auth');
const { autorizar } = require('../middlewares/rol');

const router = express.Router();

router.get('/personal', autenticar, asincrono(ctrl.personal));
router.get('/global', autenticar, autorizar('Administrador'), asincrono(ctrl.global));
router.get('/estadisticas', autenticar, asincrono(ctrl.estadisticas));

module.exports = router;
