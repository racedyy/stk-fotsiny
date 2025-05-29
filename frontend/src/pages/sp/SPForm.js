import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import spService from '../../services/sp.service';
import Spinner from '../../components/common/Spinner';
import { useNotification } from '../../contexts/NotificationContext';

const SPForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    description: '',
    region: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useNotification();
  
  useEffect(() => {
    const fetchData = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const spData = await spService.getSPById(id);
          setFormData({
            description: spData.description,
            region: spData.region
          });
        } catch (err) {
          console.error('Erreur lors du chargement du sp:', err);
          showError('Erreur lors du chargement du sp. Veuillez réessayer plus tard.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [id, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation de base
    if (!formData.description || !formData.region) {
      showError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (isEditMode) {
        await spService.updateSP(id, formData);
      } else {
        await spService.createSP(formData);
      }
      
      showSuccess(`sp ${isEditMode ? 'modifié' : 'créé'} avec succès`);
      navigate('/sp');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du sp:', err);
      showError(err.response?.data?.error || 'Erreur lors de l\'enregistrement du sp. Veuillez réessayer plus tard.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) return <Spinner text="Chargement des données..." />;
  
  return (
    <div className="sp-form">
      <h1 className="mb-4">{isEditMode ? 'Modifier un sp' : 'Ajouter un sp'}</h1>
      

      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description *</label>
              <input
                type="text"
                className="form-control"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="region" className="form-label">Région *</label>
              <input
                type="text"
                className="form-control"
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="d-flex justify-content-between">
              <Link to="/sp" className="btn btn-secondary">
                Annuler
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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

export default SPForm;
