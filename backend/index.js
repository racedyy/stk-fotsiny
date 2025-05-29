const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import du module de connexion à la base de données
const pool = require('./db');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes de base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API STK!' });
});

// Routes pour les SP (sp)
const spRoutes = require('./routes/sp.routes');
app.use('/api/sp', spRoutes);

// Routes pour les Personnes
const personneRoutes = require('./routes/personne.routes');
app.use('/api/personnes', personneRoutes);

// Routes pour les Membres
const membreRoutes = require('./routes/membre.routes');
app.use('/api/membres', membreRoutes);

// Routes pour les Activités
const activiteRoutes = require('./routes/activite.routes');
app.use('/api/activites', activiteRoutes);

// Routes pour les Présences aux activités
const presenceRoutes = require('./routes/presence.routes');
app.use('/api/presences', presenceRoutes);

// Routes pour les Paiements
const paiementRoutes = require('./routes/paiement.routes');
app.use('/api/paiements', paiementRoutes);

// Routes pour les Constantes
const constanteRoutes = require('./routes/constante.routes');
app.use('/api/constantes', constanteRoutes);

// Routes pour les Statistiques
const statistiqueRoutes = require('./routes/statistique.routes');
app.use('/api/statistiques', statistiqueRoutes);

// Routes pour les Remises
const remiseRoutes = require('./routes/remise.routes');
app.use('/api/remises', remiseRoutes);

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});

// Exportation de l'application pour l'utiliser dans d'autres fichiers si nécessaire
module.exports = app;
