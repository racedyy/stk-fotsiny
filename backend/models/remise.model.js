const pool = require('../db');

/**
 * Modèle pour les remises
 */
class RemiseModel {
  /**
   * Récupère toutes les remises
   * @returns {Promise<Array>} Liste des remises
   */
  async findAll() {
    try {
      const result = await pool.query(`
        SELECT * FROM remise ORDER BY nb_personnes
      `);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère une remise par son ID
   * @param {number} id - ID de la remise
   * @returns {Promise<Object>} Remise trouvée
   */
  async findById(id) {
    try {
      const result = await pool.query(`
        SELECT * FROM remise WHERE id = $1
      `, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère une remise par le nombre de personnes
   * @param {number} nbPersonnes - Nombre de personnes
   * @returns {Promise<Object>} Remise trouvée
   */
  async findByNbPersonnes(nbPersonnes) {
    try {
      const result = await pool.query(`
        SELECT * FROM remise WHERE nb_personnes = $1
      `, [nbPersonnes]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée une nouvelle remise
   * @param {Object} remise - Données de la remise
   * @returns {Promise<Object>} Remise créée
   */
  async create(remise) {
    const { nb_personnes, pourcentage, description } = remise;
    try {
      const result = await pool.query(`
        INSERT INTO remise (nb_personnes, pourcentage, description) 
        VALUES ($1, $2, $3) 
        RETURNING *
      `, [nb_personnes, pourcentage, description]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Met à jour une remise
   * @param {number} id - ID de la remise
   * @param {Object} remise - Nouvelles données de la remise
   * @returns {Promise<Object>} Remise mise à jour
   */
  async update(id, remise) {
    const { nb_personnes, pourcentage, description } = remise;
    try {
      const result = await pool.query(`
        UPDATE remise 
        SET nb_personnes = $1, pourcentage = $2, description = $3 
        WHERE id = $4 
        RETURNING *
      `, [nb_personnes, pourcentage, description, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime une remise
   * @param {number} id - ID de la remise
   * @returns {Promise<boolean>} True si la remise a été supprimée
   */
  async delete(id) {
    try {
      const result = await pool.query(`
        DELETE FROM remise WHERE id = $1 RETURNING id
      `, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calcule le montant après remise
   * @param {number} montant - Montant initial
   * @param {number} nbPersonnes - Nombre de personnes
   * @returns {Promise<number>} Montant après remise
   */
  async calculerMontantAvecRemise(montant, nbPersonnes) {
    try {
      // Si le nombre de personnes est 1 ou moins, pas de remise
      if (nbPersonnes <= 1) {
        return montant;
      }

      // Chercher la remise applicable
      const remise = await this.findByNbPersonnes(nbPersonnes);
      
      // Si aucune remise n'est trouvée, retourner le montant initial
      if (!remise) {
        return montant;
      }
      
      // Calculer le montant avec remise
      const remiseMontant = montant * (remise.pourcentage / 100);
      return montant - remiseMontant;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RemiseModel();
