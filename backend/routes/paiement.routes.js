const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiement.controller');

// Routes pour les paiements d'activités
router.get('/', paiementController.getAllPaiements);
router.get('/:id', paiementController.getPaiementById);

// Routes pour récupérer les paiements par relation
router.get('/activite/:id_activite', paiementController.getPaiementsByActivite);
router.get('/membre/:id_membre', paiementController.getPaiementsByMembre);
router.get('/personne/:id_personne', paiementController.getPaiementsByPersonne);

// Routes pour créer des paiements
router.post('/membre', paiementController.createPaiementForMembre);
router.post('/personne', paiementController.createPaiementForPersonne);

// Routes pour mettre à jour et supprimer des paiements
router.put('/:id', paiementController.updatePaiement);
router.delete('/:id', paiementController.deletePaiement);

// Route pour obtenir le total des paiements pour une activité
router.get('/activite/:id_activite/total', paiementController.getTotalPaiementsForActivite);

module.exports = router;
