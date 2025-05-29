const personneModel = require('../models/personne.model');

/**
 * Contrôleur pour les personnes
 */
class PersonneController {
  /**
   * Récupère toutes les personnes
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getAllPersonnes(req, res) {
    try {
      const personnes = await personneModel.findAll();
      res.json(personnes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère une personne par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPersonneById(req, res) {
    const { id } = req.params;
    try {
      const personne = await personneModel.findById(id);
      if (!personne) {
        return res.status(404).json({ error: 'Personne non trouvée' });
      }
      res.json(personne);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Crée une nouvelle personne
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createPersonne(req, res) {
    const { nom, prenom, dtn, sp } = req.body;
    
    // Validation des données
    if (!nom || !prenom) {
      return res.status(400).json({ error: 'Le nom et le prénom sont requis' });
    }
    
    try {
      const nouvellePersonne = await personneModel.create({ nom, prenom, dtn, sp });
      res.status(201).json(nouvellePersonne);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Met à jour une personne
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async updatePersonne(req, res) {
    const { id } = req.params;
    const { nom, prenom, dtn, sp } = req.body;
    
    // Validation des données
    if (!nom || !prenom) {
      return res.status(400).json({ error: 'Le nom et le prénom sont requis' });
    }
    
    try {
      const personneModifiee = await personneModel.update(id, { nom, prenom, dtn, sp });
      if (!personneModifiee) {
        return res.status(404).json({ error: 'Personne non trouvée' });
      }
      res.json(personneModifiee);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Supprime une personne
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async deletePersonne(req, res) {
    const { id } = req.params;
    try {
      // Vérifier si la personne est membre avant de la supprimer
      const estMembre = await personneModel.estMembre(id);
      if (estMembre) {
        return res.status(400).json({ 
          error: 'Impossible de supprimer cette personne car elle est membre. Supprimez d\'abord son statut de membre.' 
        });
      }
      
      const personneSuprimee = await personneModel.delete(id);
      if (!personneSuprimee) {
        return res.status(404).json({ error: 'Personne non trouvée' });
      }
      res.json({ message: 'Personne supprimée avec succès' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = new PersonneController();
