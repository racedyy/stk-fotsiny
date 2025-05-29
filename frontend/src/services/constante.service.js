import axios from 'axios';
import API_BASE_URL from './api.config';

const API_URL = `${API_BASE_URL}/constantes`;

// Récupérer toutes les constantes (normalement une seule ligne)
const getAllConstantes = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer une constante par ID
const getConstanteById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Créer une nouvelle constante
const createConstante = async (constanteData) => {
  try {
    const response = await axios.post(API_URL, constanteData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Mettre à jour une constante
const updateConstante = async (id, constanteData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, constanteData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const constanteService = {
  getAllConstantes,
  getConstanteById,
  createConstante,
  updateConstante
};

export default constanteService;
