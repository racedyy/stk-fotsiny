const pool = require('../db');

/**
 * Modèle pour les présences aux activités
 */
class PresenceModel {
  /**
   * Récupère toutes les présences avec les informations détaillées
   * @returns {Promise<Array>} Liste des présences
   */
  async findAll() {
    try {
      const result = await pool.query(`
        SELECT pa.*, 
               a.description as activite_description, a.daty as activite_date,
               COALESCE(m.id, p.id) as personne_id,
               p.nom, p.prenom,
               CASE WHEN m.id IS NOT NULL THEN true ELSE false END as est_membre
        FROM presenceact pa
        LEFT JOIN membres m ON pa.id_membre = m.id
        LEFT JOIN personne p ON COALESCE(pa.id_personne, pa.id_membre) = p.id
        JOIN activites a ON pa.id_act = a.id
        ORDER BY a.daty DESC
      `);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère une présence par son ID avec les informations détaillées
   * @param {number} id - ID de la présence
   * @returns {Promise<Object>} Présence trouvée
   */
  async findById(id) {
    try {
      const result = await pool.query(`
        SELECT pa.*, 
               a.description as activite_description, a.daty as activite_date,
               COALESCE(m.id, p.id) as personne_id,
               p.nom, p.prenom,
               CASE WHEN m.id IS NOT NULL THEN true ELSE false END as est_membre
        FROM presenceact pa
        LEFT JOIN membres m ON pa.id_membre = m.id
        LEFT JOIN personne p ON COALESCE(pa.id_personne, pa.id_membre) = p.id
        JOIN activites a ON pa.id_act = a.id
        WHERE pa.id = $1
      `, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les présences pour une activité donnée
   * @param {number} idActivite - ID de l'activité
   * @returns {Promise<Array>} Liste des présences pour l'activité
   */
  async findByActivite(idActivite) {
    try {
      const result = await pool.query(`
        SELECT pa.*, 
               a.description as activite_description, a.daty as activite_date,
               COALESCE(m.id, p.id) as personne_id,
               p.nom, p.prenom,
               CASE WHEN m.id IS NOT NULL THEN true ELSE false END as est_membre
        FROM presenceact pa
        LEFT JOIN membres m ON pa.id_membre = m.id
        LEFT JOIN personne p ON COALESCE(pa.id_personne, pa.id_membre) = p.id
        JOIN activites a ON pa.id_act = a.id
        WHERE pa.id_act = $1
        ORDER BY p.nom, p.prenom
      `, [idActivite]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vérifie si un membre est déjà présent à une activité
   * @param {number} idMembre - ID du membre
   * @param {number} idActivite - ID de l'activité
   * @returns {Promise<boolean>} True si le membre est déjà présent, false sinon
   */
  async membreEstPresent(idMembre, idActivite) {
    try {
      const result = await pool.query(
        'SELECT * FROM presenceact WHERE id_membre = $1 AND id_act = $2',
        [idMembre, idActivite]
      );
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vérifie si une personne non-membre est déjà présente à une activité
   * @param {number} idPersonne - ID de la personne
   * @param {number} idActivite - ID de l'activité
   * @returns {Promise<boolean>} True si la personne est déjà présente, false sinon
   */
  async personneEstPresente(idPersonne, idActivite) {
    try {
      const result = await pool.query(
        'SELECT * FROM presenceact WHERE id_personne = $1 AND id_act = $2',
        [idPersonne, idActivite]
      );
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée une nouvelle présence pour un membre
   * @param {number} idMembre - ID du membre
   * @param {number} idActivite - ID de l'activité
   * @returns {Promise<Object>} Présence créée avec les informations détaillées
   */
  async createForMembre(idMembre, idActivite) {
    try {
      // Créer la présence
      const result = await pool.query(
        'INSERT INTO presenceact (id_membre, id_act) VALUES ($1, $2) RETURNING *',
        [idMembre, idActivite]
      );
      
      // Récupérer les informations complètes de la présence
      const presenceInfo = await pool.query(`
        SELECT pa.*, 
               a.description as activite_description, a.daty as activite_date,
               m.id as personne_id,
               p.nom, p.prenom,
               true as est_membre
        FROM presenceact pa
        JOIN membres m ON pa.id_membre = m.id
        JOIN personne p ON m.id = p.id
        JOIN activites a ON pa.id_act = a.id
        WHERE pa.id = $1
      `, [result.rows[0].id]);
      
      return presenceInfo.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée une nouvelle présence pour une personne non-membre
   * @param {number} idPersonne - ID de la personne
   * @param {number} idActivite - ID de l'activité
   * @param {number} idMembreAccompagnateur - ID du membre qui accompagne la personne
   * @returns {Promise<Object>} Présence créée avec les informations détaillées
   */
  async createForPersonne(idPersonne, idActivite, idMembreAccompagnateur = null) {
    try {
      // Créer la présence avec le membre accompagnateur
      const result = await pool.query(
        'INSERT INTO presenceact (id_personne, id_act, id_membre) VALUES ($1, $2, $3) RETURNING *',
        [idPersonne, idActivite, idMembreAccompagnateur]
      );
      
      // Récupérer les informations complètes de la présence
      const presenceInfo = await pool.query(`
        SELECT pa.*, 
               a.description as activite_description, a.daty as activite_date,
               p.id as personne_id,
               p.nom, p.prenom,
               false as est_membre,
               m.id as id_membre_accompagnateur,
               mp.nom as nom_accompagnateur,
               mp.prenom as prenom_accompagnateur
        FROM presenceact pa
        JOIN personne p ON pa.id_personne = p.id
        JOIN activites a ON pa.id_act = a.id
        LEFT JOIN membres m ON pa.id_membre = m.id
        LEFT JOIN personne mp ON m.id = mp.id
        WHERE pa.id = $1
      `, [result.rows[0].id]);
      
      return presenceInfo.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime une présence
   * @param {number} id - ID de la présence
   * @returns {Promise<Object>} Présence supprimée
   */
  async delete(id) {
    try {
      const result = await pool.query('DELETE FROM presenceact WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Vérifie si une personne est déjà présente à une activité
   * @param {number} idPersonne - ID de la personne
   * @param {number} idActivite - ID de l'activité
   * @returns {Promise<boolean>} True si la personne est déjà présente, false sinon
   */
  async personneEstPresente(idPersonne, idActivite) {
    try {
      const result = await pool.query(
        'SELECT * FROM presenceact WHERE id_personne = $1 AND id_act = $2',
        [idPersonne, idActivite]
      );
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Vérifie si un membre est déjà présent à une activité
   * @param {number} idMembre - ID du membre
   * @param {number} idActivite - ID de l'activité
   * @returns {Promise<boolean>} True si le membre est déjà présent, false sinon
   */
  async membreEstPresent(idMembre, idActivite) {
    try {
      const result = await pool.query(
        'SELECT * FROM presenceact WHERE id_membre = $1 AND id_act = $2',
        [idMembre, idActivite]
      );
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PresenceModel();
