const remiseModel = require('../models/remise.model');

/**
 * Contrôleur pour les remises
 */
class RemiseController {
  /**
   * Récupère toutes les remises
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getAllRemises(req, res) {
    try {
      const remises = await remiseModel.findAll();
      res.json(remises);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère une remise par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getRemiseById(req, res) {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }
    
    try {
      const remise = await remiseModel.findById(id);
      
      if (!remise) {
        return res.status(404).json({ error: 'Remise non trouvée' });
      }
      
      res.json(remise);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Crée une nouvelle remise
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createRemise(req, res) {
    const { nb_personnes, pourcentage, description } = req.body;
    
    // Validation des données
    if (!nb_personnes || isNaN(nb_personnes) || nb_personnes <= 0) {
      return res.status(400).json({ error: 'Le nombre de personnes doit être un nombre positif' });
    }
    
    if (!pourcentage || isNaN(pourcentage) || pourcentage < 0 || pourcentage > 100) {
      return res.status(400).json({ error: 'Le pourcentage doit être un nombre entre 0 et 100' });
    }
    
    if (!description) {
      return res.status(400).json({ error: 'La description est requise' });
    }
    
    try {
      // Vérifier si une remise existe déjà pour ce nombre de personnes
      const existingRemise = await remiseModel.findByNbPersonnes(nb_personnes);
      if (existingRemise) {
        return res.status(400).json({ 
          error: 'Une remise existe déjà pour ce nombre de personnes',
          existingRemise
        });
      }
      
      const nouvelleRemise = await remiseModel.create({
        nb_personnes,
        pourcentage,
        description
      });
      
      res.status(201).json(nouvelleRemise);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Met à jour une remise
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async updateRemise(req, res) {
    const id = parseInt(req.params.id);
    const { nb_personnes, pourcentage, description } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }
    
    // Validation des données
    if (!nb_personnes || isNaN(nb_personnes) || nb_personnes <= 0) {
      return res.status(400).json({ error: 'Le nombre de personnes doit être un nombre positif' });
    }
    
    if (!pourcentage || isNaN(pourcentage) || pourcentage < 0 || pourcentage > 100) {
      return res.status(400).json({ error: 'Le pourcentage doit être un nombre entre 0 et 100' });
    }
    
    if (!description) {
      return res.status(400).json({ error: 'La description est requise' });
    }
    
    try {
      // Vérifier si la remise existe
      const remise = await remiseModel.findById(id);
      if (!remise) {
        return res.status(404).json({ error: 'Remise non trouvée' });
      }
      
      // Vérifier si une autre remise existe déjà pour ce nombre de personnes
      const existingRemise = await remiseModel.findByNbPersonnes(nb_personnes);
      if (existingRemise && existingRemise.id !== id) {
        return res.status(400).json({ 
          error: 'Une autre remise existe déjà pour ce nombre de personnes',
          existingRemise
        });
      }
      
      const remiseMiseAJour = await remiseModel.update(id, {
        nb_personnes,
        pourcentage,
        description
      });
      
      res.json(remiseMiseAJour);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Supprime une remise
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async deleteRemise(req, res) {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }
    
    try {
      // Vérifier si la remise existe
      const remise = await remiseModel.findById(id);
      if (!remise) {
        return res.status(404).json({ error: 'Remise non trouvée' });
      }
      
      const deleted = await remiseModel.delete(id);
      
      if (!deleted) {
        return res.status(500).json({ error: 'Erreur lors de la suppression' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Calcule le montant avec remise
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async calculerMontantAvecRemise(req, res) {
    const { montant, nb_personnes } = req.body;
    
    if (!montant || isNaN(montant) || montant <= 0) {
      return res.status(400).json({ error: 'Le montant doit être un nombre positif' });
    }
    
    if (!nb_personnes || isNaN(nb_personnes) || nb_personnes <= 0) {
      return res.status(400).json({ error: 'Le nombre de personnes doit être un nombre positif' });
    }
    
    try {
      const montantAvecRemise = await remiseModel.calculerMontantAvecRemise(montant, nb_personnes);
      
      res.json({
        montant_initial: parseFloat(montant),
        nb_personnes: parseInt(nb_personnes),
        montant_avec_remise: parseFloat(montantAvecRemise)
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = new RemiseController();
