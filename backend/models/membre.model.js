const pool = require('../db');

/**
 * Modèle pour les membres
 */
class MembreModel {
  /**
   * Récupère tous les membres avec leurs informations personnelles
   * @returns {Promise<Array>} Liste des membres
   */
  async findAll() {
    try {
      const result = await pool.query(`
        SELECT m.*, p.nom, p.prenom, p.dtn, p.sp, s.description as sp_description, s.region as sp_region
        FROM membres m
        JOIN personne p ON m.id = p.id
        LEFT JOIN sp s ON p.sp = s.id
        ORDER BY m.id
      `);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère un membre par son ID
   * @param {number} id - ID du membre
   * @returns {Promise<Object>} Membre trouvé
   */
  async findById(id) {
    try {
      const result = await pool.query(`
        SELECT m.*, p.nom, p.prenom, p.dtn, p.sp, s.description as sp_description, s.region as sp_region
        FROM membres m
        JOIN personne p ON m.id = p.id
        LEFT JOIN sp s ON p.sp = s.id
        WHERE m.id = $1
      `, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée un nouveau membre à partir d'une personne existante
   * @param {Object} membre - Données du membre
   * @returns {Promise<Object>} Membre créé
   */
  async create(membre) {
    const { id_personne, date_affiliation } = membre;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Vérifier si la personne existe
      const personneCheck = await client.query('SELECT * FROM personne WHERE id = $1', [id_personne]);
      if (personneCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Personne non trouvée');
      }
      
      // Vérifier si la personne est déjà membre
      const membreCheck = await client.query('SELECT * FROM membres WHERE id = $1', [id_personne]);
      if (membreCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new Error('Cette personne est déjà membre');
      }
      
      // Ajouter la personne comme membre
      await client.query(
        'INSERT INTO membres (id, date_affiliation) VALUES ($1, $2) RETURNING *',
        [id_personne, date_affiliation]
      );
      
      await client.query('COMMIT');
      
      // Récupérer les informations complètes du membre
      const membreInfo = await pool.query(`
        SELECT m.*, p.nom, p.prenom, p.dtn, p.sp, s.description as sp_description, s.region as sp_region
        FROM membres m
        JOIN personne p ON m.id = p.id
        LEFT JOIN sp s ON p.sp = s.id
        WHERE m.id = $1
      `, [id_personne]);
      
      return membreInfo.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Met à jour un membre
   * @param {number} id - ID du membre
   * @param {Object} membre - Nouvelles données du membre
   * @returns {Promise<Object>} Membre mis à jour
   */
  async update(id, membre) {
    const { date_affiliation } = membre;
    try {
      const result = await pool.query(
        'UPDATE membres SET date_affiliation = $1 WHERE id = $2 RETURNING *',
        [date_affiliation, id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Membre non trouvé');
      }
      
      // Récupérer les informations complètes du membre mis à jour
      const membreInfo = await pool.query(`
        SELECT m.*, p.nom, p.prenom, p.dtn, p.sp, s.description as sp_description, s.region as sp_region
        FROM membres m
        JOIN personne p ON m.id = p.id
        LEFT JOIN sp s ON p.sp = s.id
        WHERE m.id = $1
      `, [id]);
      
      return membreInfo.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime un membre
   * @param {number} id - ID du membre
   * @returns {Promise<Object>} Membre supprimé
   */
  async delete(id) {
    try {
      const result = await pool.query('DELETE FROM membres WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Membre non trouvé');
      }
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les activités d'un membre
   * @param {number} id - ID du membre
   * @returns {Promise<Array>} Liste des activités
   */
  async getActivites(id) {
    try {
      const result = await pool.query(`
        SELECT a.*, pa.date_presence
        FROM activites a
        JOIN presenceact pa ON a.id = pa.id_act
        WHERE pa.id_membre = $1
        ORDER BY a.daty DESC
      `, [id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les paiements d'un membre
   * @param {number} id - ID du membre
   * @returns {Promise<Array>} Liste des paiements
   */
  async getPaiements(id) {
    try {
      const result = await pool.query(`
        SELECT pay.*, a.description as activite_description
        FROM payementact pay
        JOIN presenceact pr ON pay.id_presence_act = pr.id
        JOIN activites a ON pr.id_act = a.id
        WHERE pr.id_membre = $1
        ORDER BY pay.daty DESC
      `, [id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new MembreModel();
