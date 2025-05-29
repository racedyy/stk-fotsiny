import axios from 'axios';
import API_BASE_URL from './api.config';

const API_URL = `${API_BASE_URL}/remises`;

// Récupérer toutes les remises
const getAllRemises = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer une remise par ID
const getRemiseById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Créer une nouvelle remise
const createRemise = async (remiseData) => {
  try {
    const response = await axios.post(API_URL, remiseData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Mettre à jour une remise
const updateRemise = async (id, remiseData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, remiseData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Supprimer une remise
const deleteRemise = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    return true;
  } catch (error) {
    throw error;
  }
};

// Calculer un montant avec remise
const calculerMontantAvecRemise = async (montant, nbPersonnes) => {
  try {
    const response = await axios.post(`${API_URL}/calcul`, { montant, nb_personnes: nbPersonnes });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const remiseService = {
  getAllRemises,
  getRemiseById,
  createRemise,
  updateRemise,
  deleteRemise,
  calculerMontantAvecRemise
};

export default remiseService;
