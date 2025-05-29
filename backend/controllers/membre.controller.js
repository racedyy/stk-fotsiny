const membreModel = require('../models/membre.model');

/**
 * Contrôleur pour les membres
 */
class MembreController {
  /**
   * Récupère tous les membres
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getAllMembres(req, res) {
    try {
      const membres = await membreModel.findAll();
      res.json(membres);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère un membre par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getMembreById(req, res) {
    const { id } = req.params;
    try {
      const membre = await membreModel.findById(id);
      if (!membre) {
        return res.status(404).json({ error: 'Membre non trouvé' });
      }
      res.json(membre);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Crée un nouveau membre
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createMembre(req, res) {
    const { id_personne, date_affiliation } = req.body;
    
    // Validation des données
    if (!id_personne) {
      return res.status(400).json({ error: 'L\'ID de la personne est requis' });
    }
    
    if (!date_affiliation) {
      return res.status(400).json({ error: 'La date d\'affiliation est requise' });
    }
    
    try {
      const nouveauMembre = await membreModel.create({ id_personne, date_affiliation });
      res.status(201).json(nouveauMembre);
    } catch (err) {
      console.error(err);
      if (err.message === 'Personne non trouvée') {
        return res.status(404).json({ error: err.message });
      }
      if (err.message === 'Cette personne est déjà membre') {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Met à jour un membre
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async updateMembre(req, res) {
    const { id } = req.params;
    const { date_affiliation } = req.body;
    
    // Validation des données
    if (!date_affiliation) {
      return res.status(400).json({ error: 'La date d\'affiliation est requise' });
    }
    
    try {
      const membreModifie = await membreModel.update(id, { date_affiliation });
      res.json(membreModifie);
    } catch (err) {
      console.error(err);
      if (err.message === 'Membre non trouvé') {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Supprime un membre
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async deleteMembre(req, res) {
    const { id } = req.params;
    try {
      await membreModel.delete(id);
      res.json({ message: 'Membre supprimé avec succès' });
    } catch (err) {
      console.error(err);
      if (err.message === 'Membre non trouvé') {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère les activités d'un membre
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getActivites(req, res) {
    const { id } = req.params;
    try {
      const activites = await membreModel.getActivites(id);
      res.json(activites);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère les paiements d'un membre
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPaiements(req, res) {
    const { id } = req.params;
    try {
      const paiements = await membreModel.getPaiements(id);
      res.json(paiements);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = new MembreController();
