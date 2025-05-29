import axios from 'axios';
import API_BASE_URL from './api.config';

const API_URL = `${API_BASE_URL}/membres`;

// Récupérer tous les membres
const getAllMembres = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer un membre par ID
const getMembreById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Créer un nouveau membre (à partir d'une personne existante)
const createMembre = async (membreData) => {
  try {
    const response = await axios.post(API_URL, membreData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Mettre à jour un membre
const updateMembre = async (id, membreData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, membreData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Supprimer un membre
const deleteMembre = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const membreService = {
  getAllMembres,
  getMembreById,
  createMembre,
  updateMembre,
  deleteMembre
};

export default membreService;
