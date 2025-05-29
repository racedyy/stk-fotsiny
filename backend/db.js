const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion à PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stk_db',
  password: process.env.DB_PASSWORD || 'PostgresCedy',
  port: process.env.DB_PORT || 5432,
});

// Test de connexion à la base de données
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
  } else {
    console.log('Connexion à la base de données établie avec succès!');
  }
});

module.exports = pool;
