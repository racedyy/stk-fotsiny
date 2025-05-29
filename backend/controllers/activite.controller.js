const activiteModel = require('../models/activite.model');
const pool = require('../db');

/**
 * Contrôleur pour les activités
 */
class ActiviteController {
  /**
   * Récupère toutes les activités
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getAllActivites(req, res) {
    try {
      const activites = await activiteModel.findAll();
      res.json(activites);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère une activité par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getActiviteById(req, res) {
    const { id } = req.params;
    try {
      const activite = await activiteModel.findById(id);
      if (!activite) {
        return res.status(404).json({ error: 'Activité non trouvée' });
      }
      res.json(activite);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Crée une nouvelle activité
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createActivite(req, res) {
    const { daty, description, priorite, region, cotisation } = req.body;
    
    // Validation de la date (doit être supérieure à la date du jour)
    const dateActivite = new Date(daty);
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates
    
    if (dateActivite < aujourdHui) {
      return res.status(400).json({ error: 'La date de l\'activité doit être supérieure ou égale à la date du jour' });
    }
    
    // Validation de la priorité (doit être entre 1 et 10)
    if (priorite < 1 || priorite > 10 || !Number.isInteger(Number(priorite))) {
      return res.status(400).json({ error: 'La priorité doit être un nombre entier entre 1 et 10' });
    }
    
    // Validation de la cotisation (doit être un nombre positif)
    if (isNaN(cotisation) || cotisation < 0) {
      return res.status(400).json({ error: 'La cotisation doit être un montant valide (nombre positif)' });
    }
    
    try {
      // Vérifier que la cotisation est comprise entre les valeurs min et max définies dans la table constante
      const constanteResult = await pool.query('SELECT * FROM constante LIMIT 1');
      
      if (constanteResult.rows.length > 0) {
        const { cotisation_inf, cotisation_sup } = constanteResult.rows[0];
        
        if (parseFloat(cotisation) < cotisation_inf || parseFloat(cotisation) > cotisation_sup) {
          return res.status(400).json({ 
            error: `La cotisation doit être comprise entre ${cotisation_inf} Ar et ${cotisation_sup} Ar` 
          });
        }
      }
      
      const nouvelleActivite = await activiteModel.create({ daty, description, priorite, region, cotisation });
      res.status(201).json(nouvelleActivite);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Met à jour une activité
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async updateActivite(req, res) {
    const { id } = req.params;
    const { daty, description, priorite, region, cotisation } = req.body;
    
    // Validation de la date (doit être supérieure à la date du jour)
    const dateActivite = new Date(daty);
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates
    
    if (dateActivite < aujourdHui) {
      return res.status(400).json({ error: 'La date de l\'activité doit être supérieure ou égale à la date du jour' });
    }
    
    // Validation de la priorité (doit être entre 1 et 10)
    if (priorite < 1 || priorite > 10 || !Number.isInteger(Number(priorite))) {
      return res.status(400).json({ error: 'La priorité doit être un nombre entier entre 1 et 10' });
    }
    
    // Validation de la cotisation (doit être un nombre positif)
    if (isNaN(cotisation) || cotisation < 0) {
      return res.status(400).json({ error: 'La cotisation doit être un montant valide (nombre positif)' });
    }
    
    try {
      // Vérifier que la cotisation est comprise entre les valeurs min et max définies dans la table constante
      const constanteResult = await pool.query('SELECT * FROM constante LIMIT 1');
      
      if (constanteResult.rows.length > 0) {
        const { cotisation_inf, cotisation_sup } = constanteResult.rows[0];
        
        if (parseFloat(cotisation) < cotisation_inf || parseFloat(cotisation) > cotisation_sup) {
          return res.status(400).json({ 
            error: `La cotisation doit être comprise entre ${cotisation_inf} Ar et ${cotisation_sup} Ar` 
          });
        }
      }
      
      const activiteModifiee = await activiteModel.update(id, { daty, description, priorite, region, cotisation });
      
      if (!activiteModifiee) {
        return res.status(404).json({ error: 'Activité non trouvée' });
      }
      
      res.json(activiteModifiee);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Supprime une activité
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async deleteActivite(req, res) {
    const { id } = req.params;
    try {
      const activiteSupprimee = await activiteModel.delete(id);
      if (!activiteSupprimee) {
        return res.status(404).json({ error: 'Activité non trouvée' });
      }
      res.json({ message: 'Activité supprimée avec succès' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère les participants d'une activité
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getParticipants(req, res) {
    const { id } = req.params;
    try {
      const participants = await activiteModel.getParticipants(id);
      res.json(participants);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère les paiements d'une activité
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPaiements(req, res) {
    const { id } = req.params;
    try {
      const paiements = await activiteModel.getPaiements(id);
      res.json(paiements);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = new ActiviteController();
