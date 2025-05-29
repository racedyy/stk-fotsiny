import axios from 'axios';
import API_BASE_URL from './api.config';

const API_URL = `${API_BASE_URL}/personnes`;

// Récupérer toutes les personnes
const getAllPersonnes = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Récupérer une personne par ID
const getPersonneById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Créer une nouvelle personne
const createPersonne = async (personneData) => {
  try {
    const response = await axios.post(API_URL, personneData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Mettre à jour une personne
const updatePersonne = async (id, personneData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, personneData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Supprimer une personne
const deletePersonne = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const personneService = {
  getAllPersonnes,
  getPersonneById,
  createPersonne,
  updatePersonne,
  deletePersonne
};

export default personneService;
