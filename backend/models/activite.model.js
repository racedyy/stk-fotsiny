const pool = require('../db');

/**
 * Modèle pour les activités
 */
class ActiviteModel {
  /**
   * Récupère toutes les activités
   * @returns {Promise<Array>} Liste des activités
   */
  async findAll() {
    try {
      const result = await pool.query('SELECT * FROM activites ORDER BY daty DESC');
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère une activité par son ID
   * @param {number} id - ID de l'activité
   * @returns {Promise<Object>} Activité trouvée
   */
  async findById(id) {
    try {
      const result = await pool.query('SELECT * FROM activites WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée une nouvelle activité
   * @param {Object} activite - Données de l'activité
   * @returns {Promise<Object>} Activité créée
   */
  async create(activite) {
    const { daty, description, priorite, region, cotisation } = activite;
    try {
      const result = await pool.query(
        'INSERT INTO activites (daty, description, priorite, region, cotisation) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [daty, description, priorite, region, cotisation]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Met à jour une activité
   * @param {number} id - ID de l'activité
   * @param {Object} activite - Nouvelles données de l'activité
   * @returns {Promise<Object>} Activité mise à jour
   */
  async update(id, activite) {
    const { daty, description, priorite, region, cotisation } = activite;
    try {
      const result = await pool.query(
        'UPDATE activites SET daty = $1, description = $2, priorite = $3, region = $4, cotisation = $5 WHERE id = $6 RETURNING *',
        [daty, description, priorite, region, cotisation, id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime une activité
   * @param {number} id - ID de l'activité
   * @returns {Promise<Object>} Activité supprimée
   */
  async delete(id) {
    try {
      const result = await pool.query('DELETE FROM activites WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les participants d'une activité
   * @param {number} id - ID de l'activité
   * @returns {Promise<Array>} Liste des participants
   */
  async getParticipants(id) {
    try {
      const result = await pool.query(`
        SELECT 
          pa.id,
          pa.id_act,
          pa.id_membre,
          pa.id_personne,
          CASE 
            WHEN pa.id_personne IS NULL THEN p.id 
            ELSE pa.id_personne 
          END as id_personne,
          p.nom,
          p.prenom,
          p.dtn,
          CASE 
            WHEN pa.id_personne IS NULL THEN true 
            ELSE false 
          END as est_membre,
          -- Pour les non-membres, récupérer les informations sur le membre accompagnateur
          CASE 
            WHEN pa.id_personne IS NOT NULL THEN pa.id_membre 
            ELSE NULL 
          END as id_membre_accompagnateur,
          accomp.nom as nom_accompagnateur,
          accomp.prenom as prenom_accompagnateur
        FROM presenceact pa
        -- Jointure pour récupérer les informations de la personne (membre ou non-membre)
        LEFT JOIN personne p ON 
          CASE 
            WHEN pa.id_personne IS NULL THEN pa.id_membre 
            ELSE pa.id_personne 
          END = p.id
        -- Jointure pour récupérer les informations du membre accompagnateur
        LEFT JOIN personne accomp ON 
          CASE 
            WHEN pa.id_personne IS NOT NULL THEN pa.id_membre 
            ELSE NULL 
          END = accomp.id
        WHERE pa.id_act = $1
      `, [id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les paiements d'une activité
   * @param {number} id - ID de l'activité
   * @returns {Promise<Array>} Liste des paiements
   */
  async getPaiements(id) {
    try {
      const result = await pool.query(`
        SELECT 
          pa.id,
          pa.id_presence_act,
          pr.id_act,
          pr.id_membre,
          pr.id_personne,
          pa.montant,
          pa.daty,
          CASE 
            WHEN pr.id_personne IS NULL THEN p.id 
            ELSE pr.id_personne 
          END as id_personne,
          p.nom,
          p.prenom,
          CASE 
            WHEN pr.id_personne IS NULL THEN true 
            ELSE false 
          END as est_membre,
          -- Pour les non-membres, récupérer les informations sur le membre accompagnateur
          CASE 
            WHEN pr.id_personne IS NOT NULL THEN pr.id_membre 
            ELSE NULL 
          END as id_membre_accompagnateur,
          accomp.nom as nom_accompagnateur,
          accomp.prenom as prenom_accompagnateur
        FROM payementact pa
        JOIN presenceact pr ON pa.id_presence_act = pr.id
        -- Jointure pour récupérer les informations de la personne (membre ou non-membre)
        LEFT JOIN personne p ON 
          CASE 
            WHEN pr.id_personne IS NULL THEN pr.id_membre 
            ELSE pr.id_personne 
          END = p.id
        -- Jointure pour récupérer les informations du membre accompagnateur
        LEFT JOIN personne accomp ON 
          CASE 
            WHEN pr.id_personne IS NOT NULL THEN pr.id_membre 
            ELSE NULL 
          END = accomp.id
        WHERE pr.id_act = $1
        ORDER BY pa.daty DESC
      `, [id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les activités par région
   * @param {string} region - Région pour filtrer les activités
   * @returns {Promise<Array>} Liste des activités dans la région
   */
  async findByRegion(region) {
    try {
      const result = await pool.query('SELECT * FROM activites WHERE region = $1 ORDER BY daty DESC', [region]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ActiviteModel();
