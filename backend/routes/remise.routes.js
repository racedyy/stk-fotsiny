const express = require('express');
const router = express.Router();
const remiseController = require('../controllers/remise.controller');

// Récupérer toutes les remises
router.get('/', remiseController.getAllRemises);

// Récupérer une remise par son ID
router.get('/:id', remiseController.getRemiseById);

// Créer une nouvelle remise
router.post('/', remiseController.createRemise);

// Mettre à jour une remise
router.put('/:id', remiseController.updateRemise);

// Supprimer une remise
router.delete('/:id', remiseController.deleteRemise);

// Calculer un montant avec remise
router.post('/calcul', remiseController.calculerMontantAvecRemise);

module.exports = router;
