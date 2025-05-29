import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import personneService from '../../services/personne.service';
import spService from '../../services/sp.service';
import Spinner from '../../components/common/Spinner';
import { useNotification } from '../../contexts/NotificationContext';

const PersonneForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dtn: '',
    sp: ''
  });
  
  const [spOptions, setSpOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useNotification();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Charger la liste des SP
        const spData = await spService.getAllSP();
        setSpOptions(spData);
        
        // Si en mode édition, charger les données de la personne
        if (isEditMode) {
          const personneData = await personneService.getPersonneById(id);
          setFormData({
            nom: personneData.nom,
            prenom: personneData.prenom,
            dtn: personneData.dtn ? new Date(personneData.dtn).toISOString().split('T')[0] : '',
            sp: personneData.sp || ''
          });
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        showError('Erreur lors du chargement des données. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
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
    if (!formData.nom || !formData.prenom || !formData.dtn) {
      showError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const personneData = {
        ...formData,
        sp: formData.sp || null // Convertir chaîne vide en null
      };
      
      if (isEditMode) {
        await personneService.updatePersonne(id, personneData);
      } else {
        await personneService.createPersonne(personneData);
      }
      
      showSuccess(`Personne ${isEditMode ? 'modifiée' : 'créée'} avec succès`);
      navigate('/personnes');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la personne:', err);
      showError(err.response?.data?.error || 'Erreur lors de l\'enregistrement de la personne. Veuillez réessayer plus tard.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) return <Spinner text="Chargement des données..." />;
  
  return (
    <div className="personne-form">
      <h1 className="mb-4">{isEditMode ? 'Modifier une personne' : 'Ajouter une personne'}</h1>
      

      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="nom" className="form-label">Nom *</label>
              <input
                type="text"
                className="form-control"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="prenom" className="form-label">Prénom *</label>
              <input
                type="text"
                className="form-control"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="dtn" className="form-label">Date de naissance *</label>
              <input
                type="date"
                className="form-control"
                id="dtn"
                name="dtn"
                value={formData.dtn}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="sp" className="form-label">sp</label>
              <select
                className="form-select"
                id="sp"
                name="sp"
                value={formData.sp}
                onChange={handleChange}
              >
                <option value="">-- Sélectionnez un sp --</option>
                {spOptions.map(sp => (
                  <option key={sp.id} value={sp.id}>
                    {sp.description} ({sp.region})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="d-flex justify-content-between">
              <Link to="/personnes" className="btn btn-secondary">
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

export default PersonneForm;
