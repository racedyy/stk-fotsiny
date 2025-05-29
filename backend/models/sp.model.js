const pool = require('../db');

/**
 * Modèle pour les Services Publics (SP)
 */
class SPModel {
  /**
   * Récupère tous les SP
   * @returns {Promise<Array>} Liste des SP
   */
  async findAll() {
    try {
      const result = await pool.query('SELECT * FROM sp ORDER BY id');
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère un SP par son ID
   * @param {number} id - ID du SP
   * @returns {Promise<Object>} SP trouvé
   */
  async findById(id) {
    try {
      const result = await pool.query('SELECT * FROM sp WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée un nouveau SP
   * @param {Object} sp - Données du SP
   * @returns {Promise<Object>} SP créé
   */
  async create(sp) {
    const { description, region } = sp;
    try {
      const result = await pool.query(
        'INSERT INTO sp (description, region) VALUES ($1, $2) RETURNING *',
        [description, region]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Met à jour un SP
   * @param {number} id - ID du SP
   * @param {Object} sp - Nouvelles données du SP
   * @returns {Promise<Object>} SP mis à jour
   */
  async update(id, sp) {
    const { description, region } = sp;
    try {
      const result = await pool.query(
        'UPDATE sp SET description = $1, region = $2 WHERE id = $3 RETURNING *',
        [description, region, id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime un SP
   * @param {number} id - ID du SP
   * @returns {Promise<Object>} SP supprimé
   */
  async delete(id) {
    try {
      const result = await pool.query('DELETE FROM sp WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vérifie si un SP est utilisé par des personnes
   * @param {number} id - ID du SP
   * @returns {Promise<boolean>} True si le SP est utilisé, false sinon
   */
  async estUtilise(id) {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM personne WHERE sp = $1', [id]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SPModel();
