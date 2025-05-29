const express = require('express');
const router = express.Router();
const constanteController = require('../controllers/constante.controller');

// Routes pour les constantes
router.get('/', constanteController.getAllConstantes);
router.get('/:id', constanteController.getConstanteById);
router.post('/', constanteController.createConstante);
router.put('/:id', constanteController.updateConstante);

// Route pour vérifier si une cotisation est valide
router.post('/verifier', constanteController.verifierCotisation);

module.exports = router;
