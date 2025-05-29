const pool = require('../db');

/**
 * Modèle pour les paiements d'activités
 */
class PaiementModel {
  /**
   * Récupère tous les paiements avec les informations détaillées
   * @returns {Promise<Array>} Liste des paiements
   */
  async findAll() {
    try {
      const result = await pool.query(`
        SELECT pa.*, 
               pr.id_act,
               a.description as activite_description, a.daty as activite_date, a.cotisation as activite_cotisation,
               COALESCE(m.id, p.id) as personne_id,
               p.nom, p.prenom,
               CASE WHEN m.id IS NOT NULL THEN true ELSE false END as est_membre
        FROM payementact pa
        JOIN presenceact pr ON pa.id_presence_act = pr.id
        LEFT JOIN membres m ON pr.id_membre = m.id
        LEFT JOIN personne p ON COALESCE(pr.id_personne, pr.id_membre) = p.id
        JOIN activites a ON pr.id_act = a.id
        ORDER BY pa.daty DESC
      `);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère un paiement par son ID avec les informations détaillées
   * @param {number} id - ID du paiement
   * @returns {Promise<Object>} Paiement trouvé
   */
  async findById(id) {
    try {
      const result = await pool.query(`
        SELECT pa.*, 
               pr.id_act,
               a.description as activite_description, a.daty as activite_date, a.cotisation as activite_cotisation,
               COALESCE(m.id, p.id) as personne_id,
               p.nom, p.prenom,
               CASE WHEN m.id IS NOT NULL THEN true ELSE false END as est_membre
        FROM payementact pa
        JOIN presenceact pr ON pa.id_presence_act = pr.id
        LEFT JOIN membres m ON pr.id_membre = m.id
        LEFT JOIN personne p ON COALESCE(pr.id_personne, pr.id_membre) = p.id
        JOIN activites a ON pr.id_act = a.id
        WHERE pa.id = $1
      `, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les paiements pour une activité donnée
   * @param {number} idActivite - ID de l'activité
   * @returns {Promise<Array>} Liste des paiements pour l'activité
   */
  async findByActivite(idActivite) {
    try {
      const result = await pool.query(`
        SELECT pa.*, 
               pr.id_act,
               a.description as activite_description, a.daty as activite_date, a.cotisation as activite_cotisation,
               COALESCE(m.id, p.id) as personne_id,
               p.nom, p.prenom,
               CASE WHEN m.id IS NOT NULL THEN true ELSE false END as est_membre
        FROM payementact pa
        JOIN presenceact pr ON pa.id_presence_act = pr.id
        LEFT JOIN membres m ON pr.id_membre = m.id
        LEFT JOIN personne p ON COALESCE(pr.id_personne, pr.id_membre) = p.id
        JOIN activites a ON pr.id_act = a.id
        WHERE pr.id_act = $1
        ORDER BY pa.daty DESC
      `, [idActivite]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les paiements pour un membre donné
   * @param {number} idMembre - ID du membre
   * @returns {Promise<Array>} Liste des paiements pour le membre
   */
  async findByMembre(idMembre) {
    try {
      const result = await pool.query(`
        SELECT pa.*, 
               pr.id_act,
               a.description as activite_description, a.daty as activite_date, a.cotisation as activite_cotisation,
               m.id as membre_id,
               p.id as personne_id,
               p.nom, p.prenom,
               true as est_membre
        FROM payementact pa
        JOIN presenceact pr ON pa.id_presence_act = pr.id
        JOIN membres m ON pr.id_membre = m.id
        JOIN personne p ON m.id = p.id
        JOIN activites a ON pr.id_act = a.id
        WHERE pr.id_membre = $1
        ORDER BY pa.daty DESC
      `, [idMembre]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les paiements pour une personne non-membre donnée
   * @param {number} idPersonne - ID de la personne
   * @returns {Promise<Array>} Liste des paiements pour la personne
   */
  async findByPersonne(idPersonne) {
    try {
      const result = await pool.query(`
        SELECT pa.*, 
               pr.id_act,
               a.description as activite_description, a.daty as activite_date, a.cotisation as activite_cotisation,
               p.id as personne_id,
               p.nom, p.prenom,
               false as est_membre
        FROM payementact pa
        JOIN presenceact pr ON pa.id_presence_act = pr.id
        JOIN personne p ON pr.id_personne = p.id
        JOIN activites a ON pr.id_act = a.id
        WHERE pr.id_personne = $1
        ORDER BY pa.daty DESC
      `, [idPersonne]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère tous les paiements d'une activité spécifique
   * @param {number} idAct - ID de l'activité
   * @returns {Promise<Array>} Liste des paiements de l'activité
   */
  async findByActivite(idAct) {
    try {
      const result = await pool.query(`
        SELECT pa.*, 
               pr.id_act,
               a.description as activite_description, a.daty as activite_date, a.cotisation as activite_cotisation,
               COALESCE(m.id, p.id) as personne_id,
               p.nom, p.prenom,
               CASE WHEN m.id IS NOT NULL THEN true ELSE false END as est_membre
        FROM payementact pa
        JOIN presenceact pr ON pa.id_presence_act = pr.id
        LEFT JOIN membres m ON pr.id_membre = m.id
        LEFT JOIN personne p ON COALESCE(pr.id_personne, m.id) = p.id
        JOIN activites a ON pr.id_act = a.id
        WHERE pr.id_act = $1
        ORDER BY pa.daty DESC
      `, [idAct]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée un nouveau paiement pour un membre
   * @param {Object} paiement - Données du paiement
   * @returns {Promise<Object>} Paiement créé avec les informations détaillées
   */
  async createForMembre(paiement) {
    const { id_presence_act, daty, montant } = paiement;
    try {
      // Vérifier que la présence existe et correspond à un membre
      const presenceCheck = await pool.query(
        'SELECT * FROM presenceact WHERE id = $1 AND id_membre IS NOT NULL',
        [id_presence_act]
      );
      
      if (presenceCheck.rows.length === 0) {
        throw new Error('Présence non trouvée ou n\'appartient pas à un membre');
      }
      
      // Créer le paiement
      const result = await pool.query(
        'INSERT INTO payementact (id_presence_act, daty, montant) VALUES ($1, $2, $3) RETURNING *',
        [id_presence_act, daty, montant]
      );
      
      // Récupérer les informations complètes du paiement
      const paiementInfo = await pool.query(`
        SELECT pa.*, 
               pr.id_act,
               a.description as activite_description, a.daty as activite_date, a.cotisation as activite_cotisation,
               m.id as membre_id,
               p.id as personne_id,
               p.nom, p.prenom,
               true as est_membre
        FROM payementact pa
        JOIN presenceact pr ON pa.id_presence_act = pr.id
        LEFT JOIN membres m ON pr.id_membre = m.id
        LEFT JOIN personne p ON m.id = p.id
        JOIN activites a ON pr.id_act = a.id
        WHERE pa.id = $1
      `, [result.rows[0].id]);
      
      return paiementInfo.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée un nouveau paiement pour une personne non-membre
   * @param {Object} paiement - Données du paiement
   * @returns {Promise<Object>} Paiement créé avec les informations détaillées
   */
  async createForPersonne(paiement) {
    const { id_presence_act, daty, montant } = paiement;
    try {
      // Vérifier que la présence existe et correspond à une personne non-membre
      const presenceCheck = await pool.query(
        'SELECT * FROM presenceact WHERE id = $1 AND id_personne IS NOT NULL',
        [id_presence_act]
      );
      
      if (presenceCheck.rows.length === 0) {
        throw new Error('Présence non trouvée ou n\'appartient pas à une personne');
      }
      
      // Créer le paiement
      const result = await pool.query(
        'INSERT INTO payementact (id_presence_act, daty, montant) VALUES ($1, $2, $3) RETURNING *',
        [id_presence_act, daty, montant]
      );
      
      // Récupérer les informations complètes du paiement
      const paiementInfo = await pool.query(`
        SELECT pa.*, 
               pr.id_act,
               a.description as activite_description, a.daty as activite_date, a.cotisation as activite_cotisation,
               p.id as personne_id,
               p.nom, p.prenom,
               false as est_membre
        FROM payementact pa
        JOIN presenceact pr ON pa.id_presence_act = pr.id
        JOIN personne p ON pr.id_personne = p.id
        JOIN activites a ON pr.id_act = a.id
        WHERE pa.id = $1
      `, [result.rows[0].id]);
      
      return paiementInfo.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Met à jour un paiement
   * @param {number} id - ID du paiement
   * @param {Object} paiement - Nouvelles données du paiement
   * @returns {Promise<Object>} Paiement mis à jour avec les informations détaillées
   */
  async update(id, paiement) {
    const { daty, montant } = paiement;
    try {
      const result = await pool.query(
        'UPDATE payementact SET daty = $1, montant = $2 WHERE id = $3 RETURNING *',
        [daty, montant, id]
      );
      
      if (!result.rows[0]) {
        return null;
      }
      
      // Récupérer les informations complètes du paiement mis à jour
      const paiementInfo = await pool.query(`
        SELECT pa.*, 
               pr.id_act,
               a.description as activite_description, a.daty as activite_date, a.cotisation as activite_cotisation,
               COALESCE(m.id, p.id) as personne_id,
               p.nom, p.prenom,
               CASE WHEN m.id IS NOT NULL THEN true ELSE false END as est_membre
        FROM payementact pa
        JOIN presenceact pr ON pa.id_presence_act = pr.id
        LEFT JOIN membres m ON pr.id_membre = m.id
        LEFT JOIN personne p ON COALESCE(pr.id_personne, pr.id_membre) = p.id
        JOIN activites a ON pr.id_act = a.id
        WHERE pa.id = $1
      `, [id]);
      
      return paiementInfo.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime un paiement
   * @param {number} id - ID du paiement
   * @returns {Promise<Object>} Paiement supprimé
   */
  async delete(id) {
    try {
      const result = await pool.query('DELETE FROM payementact WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calcule le total des paiements pour une activité
   * @param {number} idActivite - ID de l'activité
   * @returns {Promise<number>} Total des paiements
   */
  async getTotalPaiementsForActivite(idActivite) {
    try {
      const result = await pool.query(`
        SELECT SUM(pa.montant) as total 
        FROM payementact pa
        JOIN presenceact pr ON pa.id_presence_act = pr.id
        WHERE pr.id_act = $1
      `, [idActivite]);
      return parseFloat(result.rows[0].total) || 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PaiementModel();
