import axios from 'axios';
import API_BASE_URL from './api.config';

const API_URL = `${API_BASE_URL}/statistiques`;

// Récupérer les statistiques des activités et membres entre deux dates
const getStatistiquesByDateRange = async (dateDebut, dateFin) => {
  try {
    const response = await axios.get(`${API_URL}/activites-membres`, {
      params: { dateDebut, dateFin }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer les statistiques des activités par région entre deux dates
const getStatistiquesActivitesByRegion = async (dateDebut, dateFin) => {
  try {
    const response = await axios.get(`${API_URL}/activites-par-region`, {
      params: { dateDebut, dateFin }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer les statistiques des membres par activité entre deux dates
const getStatistiquesMembresParActivite = async (dateDebut, dateFin) => {
  try {
    const response = await axios.get(`${API_URL}/membres-par-activite`, {
      params: { dateDebut, dateFin }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer les statistiques des activités par personne entre deux dates
const getStatistiquesPersonnes = async (dateDebut, dateFin) => {
  try {
    const response = await axios.get(`${API_URL}/personnes`, {
      params: { dateDebut, dateFin }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer les statistiques des activités par sp entre deux dates
const getStatistiquesActivitesBySP = async (dateDebut, dateFin) => {
  try {
    const response = await axios.get(`${API_URL}/activites-par-sp`, {
      params: { dateDebut, dateFin }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const statistiqueService = {
  getStatistiquesByDateRange,
  getStatistiquesActivitesByRegion,
  getStatistiquesMembresParActivite,
  getStatistiquesPersonnes,
  getStatistiquesActivitesBySP
};

export default statistiqueService;
