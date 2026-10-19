// Rutas de autenticacion: RF1 (registro) y RF2 (login con JWT).
const express = require('express');
const { registrar, login, perfil } = require('../controllers/auth.controller');
const { asincrono } = require('../middlewares/error');
const { autenticar } = require('../middlewares/auth');

const router = express.Router();

router.post('/registro', asincrono(registrar));
router.post('/login', asincrono(login));
router.get('/perfil', autenticar, asincrono(perfil));

module.exports = router;
