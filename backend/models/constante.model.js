const pool = require('../db');

/**
 * Modèle pour les constantes
 */
class ConstanteModel {
  /**
   * Récupère toutes les constantes
   * @returns {Promise<Array>} Liste des constantes
   */
  async findAll() {
    try {
      const result = await pool.query('SELECT * FROM constante');
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère une constante par son ID
   * @param {number} id - ID de la constante
   * @returns {Promise<Object>} Constante trouvée
   */
  async findById(id) {
    try {
      const result = await pool.query('SELECT * FROM constante WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée une nouvelle constante
   * @param {Object} constante - Données de la constante
   * @returns {Promise<Object>} Constante créée
   */
  async create(constante) {
    const { cotisation_inf, cotisation_sup } = constante;
    try {
      // Vérifier s'il existe déjà une constante
      const existingConstante = await pool.query('SELECT * FROM constante');
      if (existingConstante.rows.length > 0) {
        throw new Error('Une constante existe déjà');
      }
      
      const result = await pool.query(
        'INSERT INTO constante (cotisation_inf, cotisation_sup) VALUES ($1, $2) RETURNING *',
        [cotisation_inf, cotisation_sup]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Met à jour une constante
   * @param {number} id - ID de la constante
   * @param {Object} constante - Nouvelles données de la constante
   * @returns {Promise<Object>} Constante mise à jour
   */
  async update(id, constante) {
    const { cotisation_inf, cotisation_sup } = constante;
    try {
      const result = await pool.query(
        'UPDATE constante SET cotisation_inf = $1, cotisation_sup = $2 WHERE id = $3 RETURNING *',
        [cotisation_inf, cotisation_sup, id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vérifie si une valeur de cotisation est valide selon les constantes
   * @param {number} cotisation - Montant de la cotisation à vérifier
   * @returns {Promise<boolean>} True si la cotisation est valide, false sinon
   */
  async estCotisationValide(cotisation) {
    try {
      const constantes = await this.findAll();
      if (constantes.length === 0) {
        return true; // Si pas de constantes définies, on considère que toute valeur est valide
      }
      
      const { cotisation_inf, cotisation_sup } = constantes[0];
      return cotisation >= cotisation_inf && cotisation <= cotisation_sup;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ConstanteModel();
