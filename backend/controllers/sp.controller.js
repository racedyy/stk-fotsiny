const spModel = require('../models/sp.model');
const activiteModel = require('../models/activite.model');

/**
 * Contrôleur pour les Services Publics (SP)
 */
class SPController {
  /**
   * Récupère tous les SP
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getAllSP(req, res) {
    try {
      const sps = await spModel.findAll();
      res.json(sps);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère un SP par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getSPById(req, res) {
    const { id } = req.params;
    try {
      const sp = await spModel.findById(id);
      if (!sp) {
        return res.status(404).json({ error: 'SP non trouvé' });
      }
      res.json(sp);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Crée un nouveau SP
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createSP(req, res) {
    const { description, region } = req.body;
    
    // Validation des données
    if (!description) {
      return res.status(400).json({ error: 'La description est requise' });
    }
    
    if (!region) {
      return res.status(400).json({ error: 'La région est requise' });
    }
    
    try {
      const nouveauSP = await spModel.create({ description, region });
      res.status(201).json(nouveauSP);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Met à jour un SP
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async updateSP(req, res) {
    const { id } = req.params;
    const { description, region } = req.body;
    
    // Validation des données
    if (!description) {
      return res.status(400).json({ error: 'La description est requise' });
    }
    
    if (!region) {
      return res.status(400).json({ error: 'La région est requise' });
    }
    
    try {
      const spModifie = await spModel.update(id, { description, region });
      if (!spModifie) {
        return res.status(404).json({ error: 'SP non trouvé' });
      }
      res.json(spModifie);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Supprime un SP
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async deleteSP(req, res) {
    const { id } = req.params;
    try {
      // Vérifier si le SP est utilisé par des personnes
      const estUtilise = await spModel.estUtilise(id);
      if (estUtilise) {
        return res.status(400).json({ 
          error: 'Impossible de supprimer ce SP car il est utilisé par des personnes.' 
        });
      }
      
      const spSupprime = await spModel.delete(id);
      if (!spSupprime) {
        return res.status(404).json({ error: 'SP non trouvé' });
      }
      res.json({ message: 'SP supprimé avec succès' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère les activités liées à un SP
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getActivitesBySP(req, res) {
    const { id } = req.params;
    try {
      // Récupérer le SP pour obtenir sa région
      const sp = await spModel.findById(id);
      if (!sp) {
        return res.status(404).json({ error: 'SP non trouvé' });
      }
      
      // Récupérer les activités dans la même région que le SP
      const activites = await activiteModel.findByRegion(sp.region);
      res.json(activites);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = new SPController();
