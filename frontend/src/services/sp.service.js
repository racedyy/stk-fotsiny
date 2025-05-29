import axios from 'axios';
import API_BASE_URL from './api.config';

const API_URL = `${API_BASE_URL}/sp`;

// Récupérer tous les SP
const getAllSP = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer un SP par ID
const getSPById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Créer un nouveau SP
const createSP = async (spData) => {
  try {
    const response = await axios.post(API_URL, spData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Mettre à jour un SP
const updateSP = async (id, spData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, spData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Supprimer un SP
const deleteSP = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer les activités liées à un SP
const getActivitesBySP = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/activites`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const spService = {
  getAllSP,
  getSPById,
  createSP,
  updateSP,
  deleteSP,
  getActivitesBySP
};

export default spService;
