const presenceModel = require('../models/presence.model');
const membreModel = require('../models/membre.model');
const personneModel = require('../models/personne.model');
const activiteModel = require('../models/activite.model');

/**
 * Contrôleur pour les présences aux activités
 */
class PresenceController {
  /**
   * Récupère toutes les présences
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getAllPresences(req, res) {
    try {
      const presences = await presenceModel.findAll();
      res.json(presences);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère une présence par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPresenceById(req, res) {
    const { id } = req.params;
    try {
      const presence = await presenceModel.findById(id);
      if (!presence) {
        return res.status(404).json({ error: 'Présence non trouvée' });
      }
      res.json(presence);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère les présences pour une activité donnée
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPresencesByActivite(req, res) {
    const { id_activite } = req.params;
    try {
      const presences = await presenceModel.findByActivite(id_activite);
      res.json(presences);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Crée une nouvelle présence pour un membre
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createPresenceForMembre(req, res) {
    const { id_membre, id_act } = req.body;
    
    // Validation des données
    if (!id_membre) {
      return res.status(400).json({ error: 'L\'ID du membre est requis' });
    }
    
    if (!id_act) {
      return res.status(400).json({ error: 'L\'ID de l\'activité est requis' });
    }
    
    try {
      // Vérifier si le membre existe
      const membre = await membreModel.findById(id_membre);
      if (!membre) {
        return res.status(404).json({ error: 'Membre non trouvé' });
      }
      
      // Vérifier si l'activité existe
      const activite = await activiteModel.findById(id_act);
      if (!activite) {
        return res.status(404).json({ error: 'Activité non trouvée' });
      }
      
      // Vérifier si la présence existe déjà
      const estPresent = await presenceModel.membreEstPresent(id_membre, id_act);
      if (estPresent) {
        return res.status(400).json({ error: 'Ce membre est déjà enregistré pour cette activité' });
      }
      
      // Créer la présence
      const nouvellePresence = await presenceModel.createForMembre(id_membre, id_act);
      res.status(201).json(nouvellePresence);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Crée une nouvelle présence pour une personne non-membre
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createPresenceForPersonne(req, res) {
    const { id_personne, id_act, id_membre_accompagnateur } = req.body;
    
    // Validation des données
    if (!id_personne) {
      return res.status(400).json({ error: 'L\'ID de la personne est requis' });
    }
    
    if (!id_act) {
      return res.status(400).json({ error: 'L\'ID de l\'activité est requis' });
    }
    
    if (!id_membre_accompagnateur) {
      return res.status(400).json({ error: 'L\'ID du membre accompagnateur est requis' });
    }
    
    try {
      // Vérifier si la personne existe
      const personne = await personneModel.findById(id_personne);
      if (!personne) {
        return res.status(404).json({ error: 'Personne non trouvée' });
      }
      
      // Vérifier si l'activité existe
      const activite = await activiteModel.findById(id_act);
      if (!activite) {
        return res.status(404).json({ error: 'Activité non trouvée' });
      }
      
      // Vérifier si le membre accompagnateur existe
      const membre = await membreModel.findById(id_membre_accompagnateur);
      if (!membre) {
        return res.status(404).json({ error: 'Membre accompagnateur non trouvé' });
      }
      
      // Vérifier si le membre accompagnateur participe à l'activité
      const membreEstPresent = await presenceModel.membreEstPresent(id_membre_accompagnateur, id_act);
      if (!membreEstPresent) {
        return res.status(400).json({ error: 'Le membre accompagnateur doit être participant à cette activité' });
      }
      
      // Vérifier si la présence existe déjà
      const estPresent = await presenceModel.personneEstPresente(id_personne, id_act);
      if (estPresent) {
        return res.status(400).json({ error: 'Cette personne est déjà enregistrée pour cette activité' });
      }
      
      // Créer la présence avec le membre accompagnateur
      const nouvellePresence = await presenceModel.createForPersonne(id_personne, id_act, id_membre_accompagnateur);
      res.status(201).json(nouvellePresence);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Supprime une présence
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async deletePresence(req, res) {
    const { id } = req.params;
    try {
      const presenceSupprimee = await presenceModel.delete(id);
      if (!presenceSupprimee) {
        return res.status(404).json({ error: 'Présence non trouvée' });
      }
      res.json({ message: 'Présence supprimée avec succès' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
  
  /**
   * Crée plusieurs présences anonymes pour des personnes non-membres
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async createMultipleAnonymousPresences(req, res) {
    const { id_membre_accompagnateur, id_act, nombre } = req.body;
    
    // Validation des données
    if (!id_membre_accompagnateur) {
      return res.status(400).json({ error: 'L\'ID du membre accompagnateur est requis' });
    }
    
    if (!id_act) {
      return res.status(400).json({ error: 'L\'ID de l\'activité est requis' });
    }
    
    if (!nombre || nombre <= 0) {
      return res.status(400).json({ error: 'Le nombre de personnes doit être supérieur à 0' });
    }
    
    try {
      // Vérifier si l'activité existe
      const activite = await activiteModel.findById(id_act);
      if (!activite) {
        return res.status(404).json({ error: 'Activité non trouvée' });
      }
      
      // Vérifier si le membre accompagnateur existe
      const membre = await membreModel.findById(id_membre_accompagnateur);
      if (!membre) {
        return res.status(404).json({ error: 'Membre accompagnateur non trouvé' });
      }
      
      // Vérifier si le membre accompagnateur participe à l'activité
      const membreEstPresent = await presenceModel.membreEstPresent(id_membre_accompagnateur, id_act);
      if (!membreEstPresent) {
        return res.status(400).json({ error: 'Le membre accompagnateur doit être participant à cette activité' });
      }
      
      // Créer les présences anonymes
      const presencesCreees = [];
      
      for (let i = 0; i < nombre; i++) {
        // Créer d'abord une personne anonyme
        const nouvellePersonne = await personneModel.create({
          nom: `Anonyme ${Date.now()}-${i}`,
          prenom: `Accompagné par ${membre.nom} ${membre.prenom}`,
          dtn: new Date().toISOString().split('T')[0], // Ajouter la date de naissance (aujourd'hui par défaut)
          sp: null, // sp null
          adresse: 'Non spécifiée',
          tel: 'Non spécifié',
          email: 'non.specifie@exemple.com',
          est_membre: false
        });
        
        // Créer ensuite la présence pour cette personne
        const nouvellePresence = await presenceModel.createForPersonne(
          nouvellePersonne.id,
          id_act,
          id_membre_accompagnateur
        );
        
        presencesCreees.push(nouvellePresence);
      }
      
      res.status(201).json({
        message: `${nombre} présences anonymes créées avec succès`,
        presences: presencesCreees
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
}

module.exports = new PresenceController();
