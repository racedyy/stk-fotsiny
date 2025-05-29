const express = require('express');
const router = express.Router();
const statistiqueController = require('../controllers/statistique.controller');

// Routes pour les statistiques
router.get('/activites-membres', statistiqueController.getStatistiquesByDateRange);
router.get('/activites-par-region', statistiqueController.getStatistiquesActivitesByRegion);
router.get('/membres-par-activite', statistiqueController.getStatistiquesMembresParActivite);
router.get('/personnes', statistiqueController.getStatistiquesPersonnes);
router.get('/activites-par-sp', statistiqueController.getStatistiquesActivitesBySP);

module.exports = router;
