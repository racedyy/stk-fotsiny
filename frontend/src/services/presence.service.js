import axios from 'axios';
import API_BASE_URL from './api.config';

const API_URL = `${API_BASE_URL}/presences`;

// Récupérer toutes les présences
const getAllPresences = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer une présence par ID
const getPresenceById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Créer une nouvelle présence pour un membre
const createPresenceMembre = async (presenceData) => {
  try {
    const response = await axios.post(`${API_URL}/membre`, presenceData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Créer une nouvelle présence pour une personne non-membre
const createPresencePersonne = async (presenceData) => {
  try {
    const response = await axios.post(`${API_URL}/personne`, presenceData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Supprimer une présence
const deletePresence = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer les présences par activité
const getPresencesByActivite = async (id_activite) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/activites/${id_activite}/participants`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Créer plusieurs présences anonymes pour des personnes non-membres
const createMultipleAnonymousPresences = async (presenceData) => {
  try {
    const response = await axios.post(`${API_URL}/anonymous-multiple`, presenceData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const presenceService = {
  getAllPresences,
  getPresenceById,
  createPresenceMembre,
  createPresencePersonne,
  deletePresence,
  getPresencesByActivite,
  createMultipleAnonymousPresences
};

export default presenceService;
