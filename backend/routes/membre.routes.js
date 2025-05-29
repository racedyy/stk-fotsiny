const express = require('express');
const router = express.Router();
const membreController = require('../controllers/membre.controller');

// Routes pour les membres
router.get('/', membreController.getAllMembres);
router.get('/:id', membreController.getMembreById);
router.post('/', membreController.createMembre);
router.put('/:id', membreController.updateMembre);
router.delete('/:id', membreController.deleteMembre);
router.get('/:id/activites', membreController.getActivites);
router.get('/:id/paiements', membreController.getPaiements);

module.exports = router;
