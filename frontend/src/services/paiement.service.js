import axios from 'axios';
import API_BASE_URL from './api.config';

const API_URL = `${API_BASE_URL}/paiements`;

// Récupérer tous les paiements
const getAllPaiements = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer un paiement par ID
const getPaiementById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Créer un nouveau paiement pour un membre
const createPaiementMembre = async (paiementData) => {
  try {
    const response = await axios.post(`${API_URL}/membre`, paiementData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Créer un nouveau paiement pour une personne non-membre
const createPaiementPersonne = async (paiementData) => {
  try {
    const response = await axios.post(`${API_URL}/personne`, paiementData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Mettre à jour un paiement
const updatePaiement = async (id, paiementData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, paiementData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Supprimer un paiement
const deletePaiement = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const paiementService = {
  getAllPaiements,
  getPaiementById,
  createPaiementMembre,
  createPaiementPersonne,
  updatePaiement,
  deletePaiement
};

export default paiementService;
