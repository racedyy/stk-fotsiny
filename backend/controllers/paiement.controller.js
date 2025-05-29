const pool = require('../db');
const paiementModel = require('../models/paiement.model');
const membreModel = require('../models/membre.model');
const personneModel = require('../models/personne.model');
const activiteModel = require('../models/activite.model');

/**
 * Contrôleur pour les paiements d'activités
 */
class PaiementController {
  /**
   * Récupère tous les paiements
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getAllPaiements(req, res) {
    try {
      const paiements = await paiementModel.findAll();
      res.json(paiements);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère un paiement par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPaiementById(req, res) {
    const { id } = req.params;
    try {
      const paiement = await paiementModel.findById(id);
      if (!paiement) {
        return res.status(404).json({ error: 'Paiement non trouvé' });
      }
      res.json(paiement);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère les paiements pour une activité donnée
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPaiementsByActivite(req, res) {
    const { id_activite } = req.params;
    try {
      const paiements = await paiementModel.findByActivite(id_activite);
      res.json(paiements);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère les paiements pour un membre donné
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPaiementsByMembre(req, res) {
    const { id_membre } = req.params;
    try {
      const paiements = await paiementModel.findByMembre(id_membre);
      res.json(paiements);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère les paiements pour une personne non-membre donnée
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPaiementsByPersonne(req, res) {
    const { id_personne } = req.params;
    try {
      const paiements = await paiementModel.findByPersonne(id_personne);
      res.json(paiements);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Crée un nouveau paiement pour un membre
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createPaiementForMembre(req, res) {
    const { id_presence_act, daty, montant } = req.body;
    
    // Validation des données
    if (!id_presence_act) {
      return res.status(400).json({ error: 'L\'ID de présence est requis' });
    }
    
    if (!daty) {
      return res.status(400).json({ error: 'La date du paiement est requise' });
    }
    
    if (!montant || isNaN(montant) || montant <= 0) {
      return res.status(400).json({ error: 'Le montant doit être un nombre positif' });
    }
    
    try {
      // Vérifier si la présence existe et récupérer les informations associées
      const presenceResult = await pool.query(
        `SELECT pr.*, a.cotisation, a.id as id_act, m.id as id_membre 
         FROM presenceact pr 
         JOIN activites a ON pr.id_act = a.id 
         LEFT JOIN membres m ON pr.id_membre = m.id 
         WHERE pr.id = $1`,
        [id_presence_act]
      );
      
      if (presenceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Présence non trouvée' });
      }
      
      const presence = presenceResult.rows[0];
      
      // Vérifier si c'est bien une présence de membre
      if (!presence.id_membre) {
        return res.status(400).json({ error: 'Cette présence n\'est pas associée à un membre' });
      }
      
      // Récupérer tous les paiements pour cette activité
      const tousLesPaiements = await paiementModel.findByActivite(presence.id_act);
      
      // Calculer le montant total déjà payé pour cette activité
      const montantTotalPaye = tousLesPaiements.reduce((total, p) => total + parseFloat(p.montant), 0);
      
      // Calculer le solde restant à payer
      const soldeRestant = presence.cotisation - montantTotalPaye;
      
      // Vérifier si le montant saisi dépasse le solde restant
      if (parseFloat(montant) > soldeRestant && soldeRestant > 0) {
        return res.status(400).json({ 
          error: 'Le montant saisi dépasse le solde restant à payer', 
          montantTotalPaye: montantTotalPaye,
          cotisation: presence.cotisation,
          soldeRestant: soldeRestant
        });
      }
      
      // Créer le paiement
      const nouveauPaiement = await paiementModel.createForMembre({
        id_presence_act,
        daty,
        montant
      });
      
      res.status(201).json(nouveauPaiement);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Crée un nouveau paiement pour une personne non-membre
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createPaiementForPersonne(req, res) {
    const { id_presence_act, daty, montant } = req.body;
    
    // Validation des données
    if (!id_presence_act) {
      return res.status(400).json({ error: 'L\'ID de présence est requis' });
    }
    
    if (!daty) {
      return res.status(400).json({ error: 'La date du paiement est requise' });
    }
    
    if (!montant || isNaN(montant) || montant <= 0) {
      return res.status(400).json({ error: 'Le montant doit être un nombre positif' });
    }
    
    try {
      // Vérifier si la présence existe et récupérer les informations associées
      const presenceResult = await pool.query(
        `SELECT pr.*, a.cotisation, a.id as id_act, p.id as id_personne, m.id as id_membre 
         FROM presenceact pr 
         JOIN activites a ON pr.id_act = a.id 
         LEFT JOIN personne p ON pr.id_personne = p.id 
         LEFT JOIN membres m ON pr.id_membre = m.id 
         WHERE pr.id = $1`,
        [id_presence_act]
      );
      
      if (presenceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Présence non trouvée' });
      }
      
      const presence = presenceResult.rows[0];
      
      // Vérifier si c'est bien une présence de personne non-membre
      if (!presence.id_personne) {
        return res.status(400).json({ error: 'Cette présence n\'est pas associée à une personne non-membre' });
      }
      
      // Récupérer tous les paiements pour cette activité
      const tousLesPaiements = await paiementModel.findByActivite(presence.id_act);
      
      // Calculer le montant total déjà payé pour cette activité
      const montantTotalPaye = tousLesPaiements.reduce((total, p) => total + parseFloat(p.montant), 0);
      
      // Calculer le solde restant à payer
      const soldeRestant = presence.cotisation - montantTotalPaye;
      
      // Vérifier si le montant saisi dépasse le solde restant
      if (parseFloat(montant) > soldeRestant && soldeRestant > 0) {
        return res.status(400).json({ 
          error: 'Le montant saisi dépasse le solde restant à payer', 
          montantTotalPaye: montantTotalPaye,
          cotisation: presence.cotisation,
          soldeRestant: soldeRestant
        });
      }
      
      // Créer le paiement
      const nouveauPaiement = await paiementModel.createForPersonne({
        id_presence_act,
        daty,
        montant
      });
      
      res.status(201).json(nouveauPaiement);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Met à jour un paiement
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async updatePaiement(req, res) {
    const { id } = req.params;
    const { daty, montant } = req.body;
    
    // Validation des données
    if (!daty) {
      return res.status(400).json({ error: 'La date du paiement est requise' });
    }
    
    if (!montant || isNaN(montant) || montant <= 0) {
      return res.status(400).json({ error: 'Le montant doit être un nombre positif' });
    }
    
    try {
      const paiementModifie = await paiementModel.update(id, { daty, montant });
      if (!paiementModifie) {
        return res.status(404).json({ error: 'Paiement non trouvé' });
      }
      res.json(paiementModifie);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Supprime un paiement
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async deletePaiement(req, res) {
    const { id } = req.params;
    try {
      const paiementSupprime = await paiementModel.delete(id);
      if (!paiementSupprime) {
        return res.status(404).json({ error: 'Paiement non trouvé' });
      }
      res.json({ message: 'Paiement supprimé avec succès' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère le total des paiements pour une activité
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getTotalPaiementsForActivite(req, res) {
    const { id_activite } = req.params;
    try {
      const total = await paiementModel.getTotalPaiementsForActivite(id_activite);
      res.json({ id_activite, total });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = new PaiementController();
