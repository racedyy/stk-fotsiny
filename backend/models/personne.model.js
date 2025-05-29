const pool = require('../db');

/**
 * Modèle pour les personnes
 */
class PersonneModel {
  /**
   * Récupère toutes les personnes
   * @returns {Promise<Array>} Liste des personnes
   */
  async findAll() {
    try {
      const result = await pool.query(`
        SELECT p.*, s.description as sp_description, s.region as sp_region 
        FROM personne p 
        LEFT JOIN sp s ON p.sp = s.id 
        ORDER BY p.id
      `);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère une personne par son ID
   * @param {number} id - ID de la personne
   * @returns {Promise<Object>} Personne trouvée
   */
  async findById(id) {
    try {
      const result = await pool.query(`
        SELECT p.*, s.description as sp_description, s.region as sp_region 
        FROM personne p 
        LEFT JOIN sp s ON p.sp = s.id 
        WHERE p.id = $1
      `, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée une nouvelle personne
   * @param {Object} personne - Données de la personne
   * @returns {Promise<Object>} Personne créée
   */
  async create(personne) {
    const { nom, prenom, dtn, sp } = personne;
    try {
      const result = await pool.query(
        'INSERT INTO personne (nom, prenom, dtn, sp) VALUES ($1, $2, $3, $4) RETURNING *',
        [nom, prenom, dtn, sp]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Met à jour une personne
   * @param {number} id - ID de la personne
   * @param {Object} personne - Nouvelles données de la personne
   * @returns {Promise<Object>} Personne mise à jour
   */
  async update(id, personne) {
    const { nom, prenom, dtn, sp } = personne;
    try {
      const result = await pool.query(
        'UPDATE personne SET nom = $1, prenom = $2, dtn = $3, sp = $4 WHERE id = $5 RETURNING *',
        [nom, prenom, dtn, sp, id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime une personne
   * @param {number} id - ID de la personne
   * @returns {Promise<Object>} Personne supprimée
   */
  async delete(id) {
    try {
      const result = await pool.query('DELETE FROM personne WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vérifie si une personne est membre
   * @param {number} id - ID de la personne
   * @returns {Promise<boolean>} True si la personne est membre, false sinon
   */
  async estMembre(id) {
    try {
      const result = await pool.query('SELECT * FROM membres WHERE id = $1', [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PersonneModel();
