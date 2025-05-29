const pool = require('../db');
const activiteModel = require('../models/activite.model');
const membreModel = require('../models/membre.model');
const presenceModel = require('../models/presence.model');
const paiementModel = require('../models/paiement.model');

/**
 * Contrôleur pour les statistiques
 */
class StatistiqueController {
  /**
   * Récupère les statistiques des activités par personne entre deux dates
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getStatistiquesPersonnes(req, res) {
    const { dateDebut, dateFin } = req.query;
    
    if (!dateDebut || !dateFin) {
      return res.status(400).json({ error: 'Les dates de début et de fin sont requises' });
    }
    
    try {
      // Récupérer toutes les remises disponibles
      const remisesResult = await pool.query(`
        SELECT id, nb_personnes, pourcentage, description
        FROM remise
        ORDER BY nb_personnes ASC
      `);
      
      const remises = remisesResult.rows;
      
      // Récupérer tous les membres
      const membresResult = await pool.query(`
        SELECT 
          m.id as membre_id,
          p.nom,
          p.prenom
        FROM membres m
        JOIN personne p ON m.id = p.id
        ORDER BY p.nom, p.prenom
      `);
      
      const membres = [];
      
      // Pour chaque membre, récupérer ses activités, paiements et personnes tierces
      for (const membre of membresResult.rows) {
        // Récupérer les activités du membre
        const activitesResult = await pool.query(`
          SELECT DISTINCT a.id, a.cotisation
          FROM activites a
          JOIN presenceact pa ON pa.id_act = a.id
          WHERE pa.id_membre = $1 AND a.daty BETWEEN $2 AND $3
        `, [membre.membre_id, dateDebut, dateFin]);
        
        // Récupérer les paiements du membre
        const paiementsResult = await pool.query(`
          SELECT pa.id_act, pay.montant
          FROM payementact pay
          JOIN presenceact pa ON pay.id_presence_act = pa.id
          JOIN activites a ON pa.id_act = a.id
          WHERE pa.id_membre = $1 AND a.daty BETWEEN $2 AND $3
        `, [membre.membre_id, dateDebut, dateFin]);
        
        // Récupérer le nombre de personnes tierces que ce membre a emmenées
        const personnesTiercesResult = await pool.query(`
          SELECT COUNT(*) as nombre_personnes_tierces
          FROM presenceact pa
          JOIN activites a ON pa.id_act = a.id
          WHERE pa.id_membre = $1 AND pa.id_personne IS NOT NULL
          AND a.daty BETWEEN $2 AND $3
        `, [membre.membre_id, dateDebut, dateFin]);
        
        // Calculer les statistiques pour ce membre
        const nombreActivites = activitesResult.rows.length;
        const nombrePersonnesTierces = parseInt(personnesTiercesResult.rows[0].nombre_personnes_tierces) || 0;
        
        // Calculer le montant total à payer avec remises
        let totalAPayer = 0;
        let totalRemise = 0;
        let remisesAppliquees = [];
        
        for (const activite of activitesResult.rows) {
          // Convertir explicitement la cotisation en nombre
          const cotisation = parseFloat(activite.cotisation);
          
          // Récupérer le nombre total de participants pour cette activité
          const participantsResult = await pool.query(`
            SELECT COUNT(*) as nombre_participants
            FROM presenceact
            WHERE id_act = $1
          `, [activite.id]);
          
          const nbTotalParticipants = parseInt(participantsResult.rows[0].nombre_participants) || 0;
          
          // Déterminer la remise applicable
          const remiseApplicable = remises
            .filter(remise => remise.nb_personnes <= nbTotalParticipants)
            .sort((a, b) => b.nb_personnes - a.nb_personnes)[0] || null;
          
          // Calculer le montant après remise
          let montantActivite = cotisation;
          let montantRemise = 0;
          
          if (remiseApplicable) {
            montantRemise = (cotisation * remiseApplicable.pourcentage) / 100;
            montantActivite = cotisation - montantRemise;
            
            // Ajouter la remise appliquée à la liste
            remisesAppliquees.push({
              activiteId: activite.id,
              remiseId: remiseApplicable.id,
              pourcentage: remiseApplicable.pourcentage,
              montantRemise: montantRemise,
              nbParticipants: nbTotalParticipants,
              description: remiseApplicable.description
            });
          }
          
          totalAPayer += montantActivite;
          totalRemise += montantRemise;
        }
        
        // Calculer le montant total reçu
        const totalPaye = paiementsResult.rows.reduce((total, paiement) => total + parseFloat(paiement.montant), 0);
        
        // Calculer le reste à payer
        const resteAPayer = Math.max(0, totalAPayer - totalPaye);
        
        // Calculer le montant total sans remise (pour afficher l'économie réalisée)
        const montantSansRemise = activitesResult.rows.reduce((total, activite) => total + parseFloat(activite.cotisation), 0);
        
        // Ajouter les statistiques du membre
        membres.push({
          id: membre.membre_id,
          nom: membre.nom,
          prenom: membre.prenom,
          nombreActivites,
          nombrePersonnesTierces,
          montantSansRemise: montantSansRemise,
          montantAPayer: totalAPayer,
          montantRemise: totalRemise,
          montantRecu: totalPaye,
          resteAPayer: resteAPayer,
          remisesAppliquees: remisesAppliquees
        });
      }
      
      // Récupérer les détails de toutes les activités par membre
      const activitesParMembre = [];
      
      for (const membre of membres) {
        // Récupérer les détails des activités du membre (avec DISTINCT pour éliminer les doublons)
        const activitesDetailResult = await pool.query(`
          SELECT DISTINCT
            a.id, 
            a.daty as date, 
            a.description, 
            a.cotisation,
            m.id as membre_id,
            p.nom as membre_nom,
            p.prenom as membre_prenom
          FROM activites a
          JOIN presenceact pa ON pa.id_act = a.id
          JOIN membres m ON pa.id_membre = m.id
          JOIN personne p ON m.id = p.id
          WHERE pa.id_membre = $1 AND a.daty BETWEEN $2 AND $3
          ORDER BY a.daty DESC
        `, [membre.id, dateDebut, dateFin]);
        
        for (const activite of activitesDetailResult.rows) {
          // Récupérer le montant payé par le membre pour cette activité
          const paiementResult = await pool.query(`
            SELECT COALESCE(SUM(pay.montant), 0) as montant_paye
            FROM payementact pay
            JOIN presenceact pa ON pay.id_presence_act = pa.id
            WHERE pa.id_membre = $1 AND pa.id_act = $2
          `, [membre.id, activite.id]);
          
          const montantPaye = parseFloat(paiementResult.rows[0].montant_paye) || 0;
          
          activitesParMembre.push({
            id: activite.id,
            date: activite.date,
            description: activite.description,
            cotisation: parseFloat(activite.cotisation),
            membreId: activite.membre_id,
            membreNom: activite.membre_nom,
            membrePrenom: activite.membre_prenom,
            montantPaye: montantPaye,
            resteAPayer: Math.max(0, parseFloat(activite.cotisation) - montantPaye)
          });
        }
      }
      
      // Calculer les totaux pour les membres
      const totaux = {
        nombreActivites: membres.reduce((sum, membre) => sum + membre.nombreActivites, 0),
        nombrePersonnesTierces: membres.reduce((sum, membre) => sum + membre.nombrePersonnesTierces, 0),
        montantAPayer: membres.reduce((sum, membre) => sum + membre.montantAPayer, 0),
        montantRecu: membres.reduce((sum, membre) => sum + membre.montantRecu, 0),
        resteAPayer: membres.reduce((sum, membre) => sum + membre.resteAPayer, 0)
      };
      
      // Récupérer toutes les personnes non-membres qui ont participé à des activités
      const personnesResult = await pool.query(`
        SELECT DISTINCT 
          p.id as personne_id,
          p.nom,
          p.prenom
        FROM personne p
        JOIN presenceact pa ON pa.id_personne = p.id
        JOIN activites a ON pa.id_act = a.id
        WHERE a.daty BETWEEN $1 AND $2
        AND p.id NOT IN (SELECT id FROM membres)
        ORDER BY p.nom, p.prenom
      `, [dateDebut, dateFin]);
      
      const personnes = [];
      
      // Pour chaque personne, récupérer ses activités, paiements et membre accompagnateur
      for (const personne of personnesResult.rows) {
        // Récupérer les activités de la personne
        const activitesResult = await pool.query(`
          SELECT a.id, a.cotisation, pa.id_membre
          FROM activites a
          JOIN presenceact pa ON pa.id_act = a.id
          WHERE pa.id_personne = $1 AND a.daty BETWEEN $2 AND $3
        `, [personne.personne_id, dateDebut, dateFin]);
        
        // Récupérer les paiements de la personne
        const paiementsResult = await pool.query(`
          SELECT pa.id_act, pay.montant
          FROM payementact pay
          JOIN presenceact pa ON pay.id_presence_act = pa.id
          JOIN activites a ON pa.id_act = a.id
          WHERE pa.id_personne = $1 AND a.daty BETWEEN $2 AND $3
        `, [personne.personne_id, dateDebut, dateFin]);
        
        // Récupérer le membre accompagnateur
        let membreAccompagnateur = null;
        if (activitesResult.rows.length > 0 && activitesResult.rows[0].id_membre) {
          const membreResult = await pool.query(`
            SELECT m.id, p.nom, p.prenom
            FROM membres m
            JOIN personne p ON m.id = p.id
            WHERE m.id = $1
          `, [activitesResult.rows[0].id_membre]);
          
          if (membreResult.rows.length > 0) {
            membreAccompagnateur = {
              id: membreResult.rows[0].id,
              nom: membreResult.rows[0].nom,
              prenom: membreResult.rows[0].prenom
            };
          }
        }
        
        // Calculer les statistiques pour cette personne
        const nombreActivites = activitesResult.rows.length;
        
        // Calculer le montant total à payer
        let montantAPayer = 0;
        for (const activite of activitesResult.rows) {
          montantAPayer += parseFloat(activite.cotisation);
        }
        
        // Calculer le montant total payé
        const montantPaye = paiementsResult.rows.reduce((total, paiement) => total + parseFloat(paiement.montant), 0);
        
        // Calculer le reste à payer
        const resteAPayer = Math.max(0, montantAPayer - montantPaye);
        
        // Ajouter les statistiques de la personne
        personnes.push({
          id: personne.personne_id,
          nom: personne.nom,
          prenom: personne.prenom,
          nombreActivites,
          membreAccompagnateur,
          montantAPayer,
          montantPaye,
          resteAPayer
        });
      }
      
      // Calculer les totaux pour les personnes
      const totauxPersonnes = {
        nombrePersonnes: personnes.length,
        nombreActivites: personnes.reduce((sum, p) => sum + p.nombreActivites, 0),
        montantAPayer: personnes.reduce((sum, p) => sum + p.montantAPayer, 0),
        montantPaye: personnes.reduce((sum, p) => sum + p.montantPaye, 0),
        resteAPayer: personnes.reduce((sum, p) => sum + p.resteAPayer, 0)
      };
      
      // Ajouter les personnes et leurs totaux à la réponse
      res.json({
        membres,
        personnes,
        activitesParMembre,
        totaux,
        totauxPersonnes,
        dateDebut,
        dateFin
      });
    } catch (err) {
      console.error('Erreur dans getStatistiquesPersonnes:', err);
      res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
  }
  /**
   * Récupère les statistiques des activités et membres entre deux dates
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getStatistiquesByDateRange(req, res) {
    const { dateDebut, dateFin } = req.query;
    
    if (!dateDebut || !dateFin) {
      return res.status(400).json({ error: 'Les dates de début et de fin sont requises' });
    }
    
    try {
      // Récupérer toutes les remises disponibles
      const remisesResult = await pool.query(`
        SELECT id, nb_personnes, pourcentage, description
        FROM remise
        ORDER BY nb_personnes ASC
      `);
      
      const remises = remisesResult.rows;
      // Récupérer le nombre d'activités dans la période
      const activitesQuery = await pool.query(`
        SELECT COUNT(*) as nombre_activites
        FROM activites
        WHERE daty BETWEEN $1 AND $2
      `, [dateDebut, dateFin]);
      
      const nombreActivites = parseInt(activitesQuery.rows[0].nombre_activites);
      
      // Récupérer le nombre de présences dans la période
      const presencesQuery = await pool.query(`
        SELECT COUNT(*) as nombre_presences
        FROM presenceact pa
        JOIN activites a ON pa.id_act = a.id
        WHERE a.daty BETWEEN $1 AND $2
      `, [dateDebut, dateFin]);
      
      const nombrePresences = parseInt(presencesQuery.rows[0].nombre_presences);
      
      // Récupérer le montant total à payer (cotisations des activités)
      const montantAPayer = await pool.query(`
        SELECT SUM(a.cotisation) as montant_total
        FROM presenceact pa
        JOIN activites a ON pa.id_act = a.id
        WHERE a.daty BETWEEN $1 AND $2
      `, [dateDebut, dateFin]);
      
      const montantTotalAPayer = parseFloat(montantAPayer.rows[0].montant_total || 0);
      
      // Récupérer le montant total reçu (paiements)
      const montantRecu = await pool.query(`
        SELECT SUM(pay.montant) as montant_total
        FROM payementact pay
        JOIN presenceact pa ON pay.id_presence_act = pa.id
        JOIN activites a ON pa.id_act = a.id
        WHERE a.daty BETWEEN $1 AND $2
      `, [dateDebut, dateFin]);
      
      const montantTotalRecu = parseFloat(montantRecu.rows[0].montant_total || 0);
      
      // Récupérer les activités dans la période
      const activitesResult = await pool.query(`
        SELECT id, description, daty, region, cotisation
        FROM activites
        WHERE daty BETWEEN $1 AND $2
        ORDER BY daty DESC
      `, [dateDebut, dateFin]);
      
      const activites = activitesResult.rows;
      
      // Pour chaque activité, récupérer les présences et les paiements
      const activitesStats = [];
      const regionStats = {};
      
      for (const activite of activites) {
        // Récupérer les présences
        const presencesResult = await pool.query(`
          SELECT id, id_membre, id_personne
          FROM presenceact
          WHERE id_act = $1
        `, [activite.id]);
        
        const presences = presencesResult.rows;
        
        // Calculer le nombre de membres et non-membres
        const nbMembres = presences.filter(p => p.id_membre && !p.id_personne).length;
        const nbNonMembres = presences.filter(p => p.id_personne).length;
        const nbTotalParticipants = presences.length;
        
        // Récupérer les paiements
        const paiementsResult = await pool.query(`
          SELECT pay.id, pa.id_membre, pay.montant
          FROM payementact pay
          JOIN presenceact pa ON pay.id_presence_act = pa.id
          WHERE pa.id_act = $1
        `, [activite.id]);
        
        const paiements = paiementsResult.rows;
        
        // Calculer le total payé (comme dans activite.service.js)
        const totalPaye = paiements.reduce((total, paiement) => total + parseFloat(paiement.montant), 0);
        
        // Convertir explicitement la cotisation en nombre
        const cotisation = parseFloat(activite.cotisation);
        
        // Le nombre total de participants est déjà calculé plus haut
        
        // Déterminer la remise applicable
        const remiseApplicable = remises
          .filter(remise => remise.nb_personnes <= nbTotalParticipants)
          .sort((a, b) => b.nb_personnes - a.nb_personnes)[0] || null;
        
        // Calculer le montant initial (sans remise)
        const montantInitial = cotisation;
        
        // Calculer le montant après remise
        let totalAPayer = cotisation;
        let remiseAppliquee = 0;
        let remisesDetails = [];
        
        if (remiseApplicable) {
          remiseAppliquee = (cotisation * remiseApplicable.pourcentage) / 100;
          totalAPayer = cotisation - remiseAppliquee;
          
          // Ajouter les détails de la remise appliquée
          remisesDetails.push({
            remiseId: remiseApplicable.id,
            pourcentage: remiseApplicable.pourcentage,
            nbParticipants: remiseApplicable.nb_personnes,
            description: remiseApplicable.description
          });
        }
        
        // Calculer le reste à payer
        const resteAPayer = Math.max(0, totalAPayer - totalPaye);
        
        // Ajouter les statistiques de l'activité avec les mêmes noms de champs que dans activite.service.js
        activitesStats.push({
          id: activite.id,
          description: activite.description,
          daty: activite.daty,
          region: activite.region,
          cotisation: cotisation, // Utiliser la valeur convertie en nombre
          nombre_participants: presences.length,
          nbMembres,
          nbNonMembres,
          nbTotalParticipants,
          montantInitial,
          remiseAppliquee,
          remisesDetails,
          totalAPayer,
          totalPaye,
          resteAPayer
        });
        
        // Mettre à jour les statistiques par région avec les mêmes noms de champs
        if (!regionStats[activite.region]) {
          regionStats[activite.region] = {
            region: activite.region,
            nombre_activites: 0,
            nombre_presences: 0,
            nbMembres: 0,
            nbNonMembres: 0,
            montantInitial: 0,
            remiseAppliquee: 0,
            remisesDetails: [],
            totalAPayer: 0,
            totalPaye: 0,
            resteAPayer: 0
          };
        }
        
        regionStats[activite.region].nombre_activites++;
        regionStats[activite.region].nombre_presences += presences.length;
        regionStats[activite.region].nbMembres += nbMembres;
        regionStats[activite.region].nbNonMembres += nbNonMembres;
        regionStats[activite.region].montantInitial += montantInitial;
        regionStats[activite.region].remiseAppliquee += remiseAppliquee;
        regionStats[activite.region].totalAPayer += totalAPayer;
        regionStats[activite.region].totalPaye += totalPaye;
        
        // Ajouter les détails de remise s'ils existent
        if (remisesDetails.length > 0) {
          // Vérifier si cette remise existe déjà dans les détails de la région
          const existingRemiseIndex = regionStats[activite.region].remisesDetails.findIndex(
            r => r.remiseId === remisesDetails[0].remiseId
          );
          
          if (existingRemiseIndex >= 0) {
            // Mettre à jour le nombre de participants pour cette remise
            regionStats[activite.region].remisesDetails[existingRemiseIndex].nbParticipants += nbTotalParticipants;
          } else {
            // Ajouter la nouvelle remise aux détails
            regionStats[activite.region].remisesDetails.push({
              ...remisesDetails[0],
              nbParticipants: nbTotalParticipants
            });
          }
        }
        
        // Calculer le reste à payer pour la région
        regionStats[activite.region].resteAPayer = Math.max(0, regionStats[activite.region].totalAPayer - regionStats[activite.region].totalPaye);
      }
      
      // Convertir les statistiques par région en tableau
      const statistiquesParRegion = { rows: Object.values(regionStats) };
      
      // Utiliser les statistiques par activité déjà calculées
      const statistiquesParActivite = { rows: activitesStats };
      
      // Renvoyer les statistiques
      res.json({
        nombreActivites,
        nombrePresences,
        montantTotalAPayer,
        montantTotalRecu,
        dateDebut,
        dateFin,
        statistiquesParRegion: statistiquesParRegion.rows,
        statistiquesParActivite: statistiquesParActivite.rows
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
  
  /**
   * Récupère les statistiques des activités par région entre deux dates
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getStatistiquesActivitesByRegion(req, res) {
    const { dateDebut, dateFin } = req.query;
    
    if (!dateDebut || !dateFin) {
      return res.status(400).json({ error: 'Les dates de début et de fin sont requises' });
    }
    
    try {
      const result = await pool.query(`
        SELECT region, COUNT(*) as nombre_activites
        FROM activites
        WHERE daty BETWEEN $1 AND $2
        GROUP BY region
        ORDER BY nombre_activites DESC
      `, [dateDebut, dateFin]);
      
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
  
  /**
   * Récupère les statistiques des membres par activité entre deux dates
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getStatistiquesMembresParActivite(req, res) {
    const { dateDebut, dateFin } = req.query;
    
    if (!dateDebut || !dateFin) {
      return res.status(400).json({ error: 'Les dates de début et de fin sont requises' });
    }
    
    try {
      const result = await pool.query(`
        SELECT a.id, a.description, COUNT(pa.id) as nombre_participants
        FROM activites a
        LEFT JOIN presenceact pa ON a.id = pa.id_act
        WHERE a.daty BETWEEN $1 AND $2
        GROUP BY a.id, a.description
        ORDER BY nombre_participants DESC
      `, [dateDebut, dateFin]);
      
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  /**
   * Récupère les statistiques des activités par sp entre deux dates
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getStatistiquesActivitesBySP(req, res) {
    const { dateDebut, dateFin } = req.query;
    
    if (!dateDebut || !dateFin) {
      return res.status(400).json({ error: 'Les dates de début et de fin sont requises' });
    }
    
    try {
      // Récupérer toutes les remises disponibles
      const remisesResult = await pool.query(`
        SELECT id, nb_personnes, pourcentage, description
        FROM remise
        ORDER BY nb_personnes ASC
      `);
      
      const remises = remisesResult.rows;
      // Récupérer tous les SP avec le nombre de personnes dans chaque SP
      const spResult = await pool.query(`
        SELECT s.id, s.description, s.region, COUNT(p.id) as nombre_personnes
        FROM sp s
        LEFT JOIN personne p ON s.id = p.sp
        GROUP BY s.id, s.description, s.region
        ORDER BY s.description
      `);
      
      const servicePublics = [];
      
      // Pour chaque région (sp), récupérer ses activités
      for (const sp of spResult.rows) {
        // Récupérer les activités liées à ce SP spécifique (par son ID)
        // On récupère uniquement les activités où des personnes appartenant à ce SP spécifique ont participé
        // Nous utilisons une sous-requête pour vérifier que la personne appartenait déjà à ce SP au moment de l'activité
        const activitesResult = await pool.query(`
          SELECT DISTINCT a.*
          FROM activites a
          JOIN presenceact pa ON a.id = pa.id_act
          JOIN personne p ON (pa.id_membre = p.id OR pa.id_personne = p.id)
          WHERE p.sp = $1 
          AND a.daty BETWEEN $2 AND $3
          AND p.id IN (
            SELECT id FROM personne WHERE sp = $1
          )
        `, [sp.id, dateDebut, dateFin]);
        
        // Même si le SP n'a pas d'activités, on l'affiche avec des valeurs à zéro
        
        // Initialiser les variables pour ce SP
        let nombreActivites = activitesResult.rows.length;
        let nombreParticipants = 0;
        let montantInitialTotal = 0;
        let remiseAppliqueeTotale = 0;
        let montantAPayer = 0;
        let montantRecu = 0;
        let remisesDetailsRegion = [];
        
        // Pour chaque activité, récupérer les participants et les paiements
        for (const activite of activitesResult.rows) {
          // Récupérer le nombre de participants
          const participantsResult = await pool.query(`
            SELECT COUNT(*) as nombre_participants
            FROM presenceact
            WHERE id_act = $1
          `, [activite.id]);
          
          const activiteParticipants = parseInt(participantsResult.rows[0].nombre_participants) || 0;
          nombreParticipants += activiteParticipants;
          
          // Déterminer la remise applicable
          const remiseApplicable = remises
            .filter(remise => remise.nb_personnes <= activiteParticipants)
            .sort((a, b) => b.nb_personnes - a.nb_personnes)[0] || null;
          
          // Calculer le montant initial (sans remise) - juste la cotisation, pas multipliée par le nombre de participants
          const activiteMontantInitial = parseFloat(activite.cotisation);
          montantInitialTotal += activiteMontantInitial;
          
          // Calculer le montant après remise
          let activiteMontantAPayer = activiteMontantInitial;
          let activiteRemiseAppliquee = 0;
          let activiteRemisesDetails = [];
          
          if (remiseApplicable) {
            activiteRemiseAppliquee = (activiteMontantInitial * remiseApplicable.pourcentage) / 100;
            activiteMontantAPayer = activiteMontantInitial - activiteRemiseAppliquee;
            remiseAppliqueeTotale += activiteRemiseAppliquee;
            
            // Ajouter les détails de la remise appliquée
            const remiseDetail = {
              remiseId: remiseApplicable.id,
              pourcentage: remiseApplicable.pourcentage,
              nbParticipants: remiseApplicable.nb_personnes,
              description: remiseApplicable.description
            };
            
            activiteRemisesDetails.push(remiseDetail);
            
            // Vérifier si cette remise existe déjà dans les détails de la région
            const existingRemiseIndex = remisesDetailsRegion.findIndex(
              r => r.remiseId === remiseDetail.remiseId
            );
            
            if (existingRemiseIndex >= 0) {
              // Mettre à jour le nombre de participants pour cette remise
              remisesDetailsRegion[existingRemiseIndex].nbParticipants += activiteParticipants;
            } else {
              // Ajouter la nouvelle remise aux détails de la région
              remisesDetailsRegion.push({
                ...remiseDetail,
                nbParticipants: activiteParticipants
              });
            }
          }
          
          // Mettre à jour les totaux - le montant à payer est fixe, c'est la cotisation après remise
          montantAPayer += activiteMontantAPayer;
          
          // Récupérer les paiements pour cette activité
          const paiementsResult = await pool.query(`
            SELECT SUM(pay.montant) as total_paye
            FROM payementact pay
            JOIN presenceact pa ON pay.id_presence_act = pa.id
            WHERE pa.id_act = $1
          `, [activite.id]);
          
          const activiteMontantRecu = parseFloat(paiementsResult.rows[0].total_paye) || 0;
          montantRecu += activiteMontantRecu;
        }
        
        // Calculer le reste à payer
        const resteAPayer = Math.max(0, montantAPayer - montantRecu);
        
        // Ajouter les statistiques de la région (sp)
        servicePublics.push({
          id: sp.id || servicePublics.length + 1, // Utiliser l'ID du SP ou générer un ID séquentiel
          description: sp.description || sp.region, // Utiliser la description du SP ou la région comme fallback
          region: sp.region,
          nombrePersonnes: parseInt(sp.nombre_personnes) || 0, // Nombre de personnes dans ce SP
          nombreActivites,
          nombreParticipants,
          montantInitial: montantInitialTotal,
          remiseAppliquee: remiseAppliqueeTotale,
          remisesDetails: remisesDetailsRegion,
          montantAPayer,
          montantRecu,
          resteAPayer
        });
      }
      
      // Récupérer toutes les activités dans la période avec les détails par SP
      // On associe chaque activité au SP des personnes qui y ont participé
      // Nous utilisons une sous-requête pour vérifier que la personne appartenait déjà à ce SP au moment de l'activité
      const activitesParSPResult = await pool.query(`
        SELECT DISTINCT a.id, a.description, a.daty as date, a.priorite, a.region, a.cotisation,
               s.description as service_public, s.description as sp_description, s.id as sp_id
        FROM activites a
        JOIN presenceact pa ON a.id = pa.id_act
        JOIN personne p ON (pa.id_membre = p.id OR pa.id_personne = p.id)
        JOIN sp s ON p.sp = s.id
        WHERE a.daty BETWEEN $1 AND $2
        AND p.id IN (
          SELECT id FROM personne WHERE sp = s.id
        )
        ORDER BY a.daty DESC
      `, [dateDebut, dateFin]);
      
      const activitesParSP = [];
      
      // Pour chaque activité, récupérer les participants et les paiements
      for (const activite of activitesParSPResult.rows) {
        // Récupérer le nombre de participants
        const participantsResult = await pool.query(`
          SELECT COUNT(*) as nombre_participants
          FROM presenceact
          WHERE id_act = $1
        `, [activite.id]);
        
        const nombreParticipants = parseInt(participantsResult.rows[0].nombre_participants) || 0;
        
        // Déterminer la remise applicable
        const remiseApplicable = remises
          .filter(remise => remise.nb_personnes <= nombreParticipants)
          .sort((a, b) => b.nb_personnes - a.nb_personnes)[0] || null;
        
        // Calculer le montant initial (sans remise) - juste la cotisation, pas multipliée par le nombre de participants
        const montantInitial = parseFloat(activite.cotisation);
        
        // Calculer le montant après remise
        let montantAPayer = montantInitial;
        let remiseAppliquee = 0;
        let remisesDetails = [];
        
        if (remiseApplicable) {
          remiseAppliquee = (montantInitial * remiseApplicable.pourcentage) / 100;
          montantAPayer = montantInitial - remiseAppliquee;
          
          // Ajouter les détails de la remise appliquée
          remisesDetails.push({
            remiseId: remiseApplicable.id,
            pourcentage: remiseApplicable.pourcentage,
            nbParticipants: remiseApplicable.nb_personnes,
            description: remiseApplicable.description
          });
        }
        
        // Récupérer les paiements pour cette activité
        const paiementsResult = await pool.query(`
          SELECT SUM(pay.montant) as total_paye
          FROM payementact pay
          JOIN presenceact pa ON pay.id_presence_act = pa.id
          WHERE pa.id_act = $1
        `, [activite.id]);
        
        const montantRecu = parseFloat(paiementsResult.rows[0].total_paye) || 0;
        
        // Le montant à payer est fixe, c'est la cotisation après remise
        
        // Calculer le reste à payer
        const resteAPayer = Math.max(0, montantAPayer - montantRecu);
        
        // Ajouter les détails de l'activité
        activitesParSP.push({
          id: activite.id,
          description: activite.description,
          date: activite.date,
          priorite: activite.priorite,
          region: activite.region,
          servicePublic: activite.service_public,
          cotisation: parseFloat(activite.cotisation),
          nombreParticipants,
          montantInitial,
          remiseAppliquee,
          remisesDetails,
          montantAPayer,
          montantRecu,
          resteAPayer
        });
      }
      
      // Calculer les totaux
      const totaux = {
        nombreServicePublics: servicePublics.length,
        nombreActivites: servicePublics.reduce((sum, sp) => sum + sp.nombreActivites, 0),
        nombreParticipants: servicePublics.reduce((sum, sp) => sum + sp.nombreParticipants, 0),
        montantInitial: servicePublics.reduce((sum, sp) => sum + (sp.montantInitial || sp.montantAPayer), 0),
        remiseAppliquee: servicePublics.reduce((sum, sp) => sum + (sp.remiseAppliquee || 0), 0),
        montantAPayer: servicePublics.reduce((sum, sp) => sum + sp.montantAPayer, 0),
        montantRecu: servicePublics.reduce((sum, sp) => sum + sp.montantRecu, 0),
        resteAPayer: servicePublics.reduce((sum, sp) => sum + sp.resteAPayer, 0)
      };
      
      res.json({
        servicePublics,
        activitesParSP,
        totaux,
        dateDebut,
        dateFin
      });
    } catch (err) {
      console.error('Erreur dans getStatistiquesActivitesBySP:', err);
      res.status(500).json({ error: 'Erreur serveur: ' + err.message });
    }
  }
}

module.exports = new StatistiqueController();
