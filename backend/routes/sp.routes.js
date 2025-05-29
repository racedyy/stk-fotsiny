const express = require('express');
const router = express.Router();
const spController = require('../controllers/sp.controller');

// Routes pour les services publics (SP)
router.get('/', spController.getAllSP);
router.get('/:id', spController.getSPById);
router.get('/:id/activites', spController.getActivitesBySP);
router.post('/', spController.createSP);
router.put('/:id', spController.updateSP);
router.delete('/:id', spController.deleteSP);

module.exports = router;
