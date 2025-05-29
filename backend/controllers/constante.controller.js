const constanteModel = require('../models/constante.model');

/**
 * Contrôleur pour les constantes
 */
class ConstanteController {
  /**
   * Récupère toutes les constantes
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getAllConstantes(req, res) {
    try {
      const constantes = await constanteModel.findAll();
      res.json(constantes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère une constante par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getConstanteById(req, res) {
    const { id } = req.params;
    try {
      const constante = await constanteModel.findById(id);
      if (!constante) {
        return res.status(404).json({ error: 'Constante non trouvée' });
      }
      res.json(constante);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Crée une nouvelle constante
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createConstante(req, res) {
    const { cotisation_inf, cotisation_sup } = req.body;
    
    // Validation des données
    if (cotisation_inf === undefined || cotisation_sup === undefined) {
      return res.status(400).json({ error: 'Les valeurs de cotisation inférieure et supérieure sont requises' });
    }
    
    if (isNaN(cotisation_inf) || isNaN(cotisation_sup)) {
      return res.status(400).json({ error: 'Les valeurs de cotisation doivent être des nombres' });
    }
    
    if (cotisation_inf < 0 || cotisation_sup < 0) {
      return res.status(400).json({ error: 'Les valeurs de cotisation doivent être positives' });
    }
    
    if (cotisation_inf > cotisation_sup) {
      return res.status(400).json({ error: 'La cotisation inférieure ne peut pas être supérieure à la cotisation supérieure' });
    }
    
    try {
      const nouvelleConstante = await constanteModel.create({ cotisation_inf, cotisation_sup });
      res.status(201).json(nouvelleConstante);
    } catch (err) {
      console.error(err);
      if (err.message === 'Une constante existe déjà') {
        // Récupérer la constante existante
        const constantes = await constanteModel.findAll();
        return res.status(400).json({ 
          error: 'Une constante existe déjà. Utilisez la méthode PUT pour la mettre à jour.',
          existingConstante: constantes[0]
        });
      }
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Met à jour une constante
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async updateConstante(req, res) {
    const { id } = req.params;
    const { cotisation_inf, cotisation_sup } = req.body;
    
    // Validation des données
    if (cotisation_inf === undefined || cotisation_sup === undefined) {
      return res.status(400).json({ error: 'Les valeurs de cotisation inférieure et supérieure sont requises' });
    }
    
    if (isNaN(cotisation_inf) || isNaN(cotisation_sup)) {
      return res.status(400).json({ error: 'Les valeurs de cotisation doivent être des nombres' });
    }
    
    if (cotisation_inf < 0 || cotisation_sup < 0) {
      return res.status(400).json({ error: 'Les valeurs de cotisation doivent être positives' });
    }
    
    if (cotisation_inf > cotisation_sup) {
      return res.status(400).json({ error: 'La cotisation inférieure ne peut pas être supérieure à la cotisation supérieure' });
    }
    
    try {
      const constanteModifiee = await constanteModel.update(id, { cotisation_inf, cotisation_sup });
      if (!constanteModifiee) {
        return res.status(404).json({ error: 'Constante non trouvée' });
      }
      res.json(constanteModifiee);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Vérifie si une cotisation est valide
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async verifierCotisation(req, res) {
    const { cotisation } = req.body;
    
    if (cotisation === undefined) {
      return res.status(400).json({ error: 'La valeur de cotisation est requise' });
    }
    
    if (isNaN(cotisation)) {
      return res.status(400).json({ error: 'La valeur de cotisation doit être un nombre' });
    }
    
    try {
      const estValide = await constanteModel.estCotisationValide(cotisation);
      res.json({ 
        cotisation, 
        estValide,
        message: estValide ? 'La cotisation est valide' : 'La cotisation est en dehors des limites autorisées'
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = new ConstanteController();
