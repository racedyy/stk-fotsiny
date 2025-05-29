import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import remiseService from '../../services/remise.service';
import { useNotification } from '../../contexts/NotificationContext';

const RemiseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    nb_personnes: '',
    pourcentage: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);

  // Charger les données de la remise si on est en mode édition
  useEffect(() => {
    if (isEditMode) {
      loadRemise();
    }
  }, [id]);

  // Fonction pour charger les données d'une remise existante
  const loadRemise = async () => {
    try {
      setLoadingData(true);
      const data = await remiseService.getRemiseById(id);
      setFormData({
        nb_personnes: data.nb_personnes,
        pourcentage: data.pourcentage,
        description: data.description
      });
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement de la remise:', err);
      setError('Erreur lors du chargement de la remise. Veuillez réessayer plus tard.');
    } finally {
      setLoadingData(false);
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    try {
      setLoading(true);
      setValidated(true);
      
      const remiseData = {
        nb_personnes: parseInt(formData.nb_personnes),
        pourcentage: parseFloat(formData.pourcentage),
        description: formData.description
      };
      
      if (isEditMode) {
        await remiseService.updateRemise(id, remiseData);
        showSuccess('Remise mise à jour avec succès');
      } else {
        await remiseService.createRemise(remiseData);
        showSuccess('Remise créée avec succès');
      }
      
      navigate('/remises');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la remise:', err);
      
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Erreur lors de l\'enregistrement de la remise');
      }
      
      showError('Erreur lors de l\'enregistrement de la remise');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2>{isEditMode ? 'Modifier la Remise' : 'Nouvelle Remise'}</h2>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          
          <form onSubmit={handleSubmit} className={validated ? 'was-validated' : ''}>
            <div className="mb-3">
              <label htmlFor="nb_personnes" className="form-label">Nombre de Personnes</label>
              <input
                type="number"
                className="form-control"
                id="nb_personnes"
                name="nb_personnes"
                value={formData.nb_personnes}
                onChange={handleChange}
                min="2"
                required
                placeholder="Entrez le nombre de personnes"
              />
              <div className="invalid-feedback">
                Veuillez entrer un nombre de personnes valide (minimum 2).
              </div>
              <small className="text-muted">
                Le nombre de personnes pour lequel cette remise s'applique.
              </small>
            </div>
            
            <div className="mb-3">
              <label htmlFor="pourcentage" className="form-label">Pourcentage de Remise</label>
              <input
                type="number"
                className="form-control"
                id="pourcentage"
                name="pourcentage"
                value={formData.pourcentage}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                required
                placeholder="Entrez le pourcentage de remise"
              />
              <div className="invalid-feedback">
                Veuillez entrer un pourcentage valide (entre 0 et 100).
              </div>
              <small className="text-muted">
                Le pourcentage de remise à appliquer.
              </small>
            </div>
            
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                className="form-control"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Entrez une description pour cette remise"
                rows={3}
              ></textarea>
              <div className="invalid-feedback">
                Veuillez entrer une description.
              </div>
            </div>
            
            <div className="d-flex justify-content-between">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/remises')}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RemiseForm;
