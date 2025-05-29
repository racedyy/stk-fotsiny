const express = require('express');
const router = express.Router();
const presenceController = require('../controllers/presence.controller');

// Routes pour les présences aux activités
router.get('/', presenceController.getAllPresences);
router.get('/:id', presenceController.getPresenceById);

// Route pour récupérer les présences par activité
router.get('/activite/:id_activite', presenceController.getPresencesByActivite);

// Routes pour créer des présences
router.post('/membre', presenceController.createPresenceForMembre);
router.post('/personne', presenceController.createPresenceForPersonne);
router.post('/anonymous-multiple', presenceController.createMultipleAnonymousPresences);

// Route pour supprimer une présence
router.delete('/:id', presenceController.deletePresence);

module.exports = router;
