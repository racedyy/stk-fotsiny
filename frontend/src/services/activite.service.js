import axios from 'axios';
import API_BASE_URL from './api.config';
import remiseService from './remise.service';

const API_URL = `${API_BASE_URL}/activites`;

// Récupérer toutes les activités
const getAllActivites = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer une activité par ID
const getActiviteById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Créer une nouvelle activité
const createActivite = async (activiteData) => {
  try {
    const response = await axios.post(API_URL, activiteData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Mettre à jour une activité
const updateActivite = async (id, activiteData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, activiteData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Supprimer une activité
const deleteActivite = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer les participants d'une activité
const getParticipants = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/participants`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer les paiements d'une activité
const getPaiements = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/paiements`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer les informations de paiement pour toutes les activités
const getAllActivitesWithPayments = async () => {
  try {
    // Récupérer toutes les activités
    const activites = await getAllActivites();
    
    // Récupérer toutes les remises disponibles
    const remises = await remiseService.getAllRemises();
    
    // Pour chaque activité, récupérer les paiements et les participants
    const activitesWithPayments = await Promise.all(activites.map(async (activite) => {
      try {
        // Récupérer les paiements
        const paiements = await getPaiements(activite.id);
        const totalPaye = paiements.reduce((total, paiement) => total + parseFloat(paiement.montant), 0);
        
        // Récupérer les participants
        const participants = await getParticipants(activite.id);
        
        // Compter le nombre de membres et de non-membres
        const nbMembres = participants.filter(p => p.est_membre).length;
        const nbNonMembres = participants.filter(p => !p.est_membre).length;
        const nbTotalParticipants = nbMembres + nbNonMembres;
        
        // Calculer la remise applicable (sans compter le membre)
        const nbPersonnesPourRemise = nbTotalParticipants - 1;
        let remiseApplicable = null;
        let pourcentageRemise = 0;
        
        if (remises.length > 0 && nbPersonnesPourRemise > 0) {
          // Trouver la remise applicable avec le plus grand nombre de personnes éligible
          remiseApplicable = remises
            .filter(remise => remise.nb_personnes <= nbPersonnesPourRemise)
            .sort((a, b) => b.nb_personnes - a.nb_personnes)[0] || null;
            
          if (remiseApplicable) {
            pourcentageRemise = remiseApplicable.pourcentage;
          }
        }
        
        // Calculer le montant après remise
        const montantRemise = activite.cotisation * (pourcentageRemise / 100);
        const montantApresRemise = activite.cotisation - montantRemise;
        
        // Calculer le reste à payer en tenant compte de la remise
        const resteAPayer = Math.max(0, montantApresRemise - totalPaye);
        
        return {
          ...activite,
          totalPaye,
          resteAPayer,
          nbMembres,
          nbNonMembres,
          nbTotalParticipants,
          nbPersonnesPourRemise,
          pourcentageRemise,
          remiseApplicable,
          montantRemise: montantRemise || 0,
          montantApresRemise: montantApresRemise || activite.cotisation
        };
      } catch (error) {
        // En cas d'erreur, retourner l'activité sans informations de paiement
        return {
          ...activite,
          totalPaye: 0,
          resteAPayer: activite.cotisation,
          nbMembres: 0,
          nbNonMembres: 0,
          nbTotalParticipants: 0,
          nbPersonnesPourRemise: 0,
          pourcentageRemise: 0,
          remiseApplicable: null,
          montantRemise: 0,
          montantApresRemise: activite.cotisation
        };
      }
    }));
    
    return activitesWithPayments;
  } catch (error) {
    throw error;
  }
};

const activiteService = {
  getAllActivites,
  getAllActivitesWithPayments,
  getActiviteById,
  createActivite,
  updateActivite,
  deleteActivite,
  getParticipants,
  getPaiements
};

export default activiteService;
