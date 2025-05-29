import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import constanteService from '../../services/constante.service';
import Spinner from '../../components/common/Spinner';
import { useNotification } from '../../contexts/NotificationContext';

const ConstanteForm = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    id: '',
    cotisation_inf: '',
    cotisation_sup: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useNotification();
  
  useEffect(() => {
    fetchConstantes();
  }, []);
  
  const fetchConstantes = async () => {
    try {
      setLoading(true);
      const data = await constanteService.getAllConstantes();
      
      if (data.length > 0) {
        // Si des constantes existent déjà, on prend la première (normalement il n'y en a qu'une)
        setFormData({
          id: data[0].id,
          cotisation_inf: data[0].cotisation_inf,
          cotisation_sup: data[0].cotisation_sup
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des constantes:', err);
      showError('Erreur lors du chargement des constantes. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };
  
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
    if (!formData.cotisation_inf || !formData.cotisation_sup) {
      showError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    // Validation des valeurs
    const cotisationInf = parseFloat(formData.cotisation_inf);
    const cotisationSup = parseFloat(formData.cotisation_sup);
    
    if (cotisationInf >= cotisationSup) {
      showError('La cotisation inférieure doit être strictement inférieure à la cotisation supérieure.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const constanteData = {
        cotisation_inf: cotisationInf,
        cotisation_sup: cotisationSup
      };
      
      if (formData.id) {
        // Mise à jour
        await constanteService.updateConstante(formData.id, constanteData);
        showSuccess('Paramètres mis à jour avec succès');
      } else {
        // Création
        const result = await constanteService.createConstante(constanteData);
        setFormData(prevState => ({
          ...prevState,
          id: result.id
        }));
        showSuccess('Paramètres enregistrés avec succès');
      }
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des constantes:', err);
      showError(err.response?.data?.error || 'Erreur lors de l\'enregistrement des constantes. Veuillez réessayer plus tard.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) return <Spinner text="Chargement des paramètres..." />;
  
  return (
    <div className="constante-form">
      <h1 className="mb-4">Paramètres de cotisation</h1>
      

      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="cotisation_inf" className="form-label">Cotisation inférieure (Ar) *</label>
              <input
                type="number"
                className="form-control"
                id="cotisation_inf"
                name="cotisation_inf"
                value={formData.cotisation_inf}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              <div className="form-text">
                Montant minimum de cotisation pour les activités.
              </div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="cotisation_sup" className="form-label">Cotisation supérieure (Ar) *</label>
              <input
                type="number"
                className="form-control"
                id="cotisation_sup"
                name="cotisation_sup"
                value={formData.cotisation_sup}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              <div className="form-text">
                Montant maximum de cotisation pour les activités.
              </div>
            </div>
            
            <div className="d-flex justify-content-end">
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

export default ConstanteForm;
