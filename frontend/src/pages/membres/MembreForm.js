import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import membreService from '../../services/membre.service';
import personneService from '../../services/personne.service';
import Spinner from '../../components/common/Spinner';
import { useNotification } from '../../contexts/NotificationContext';

const MembreForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    id_personne: '',
    date_affiliation: new Date().toISOString().split('T')[0]
  });
  
  const [personnes, setPersonnes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useNotification();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Charger la liste des personnes qui ne sont pas déjà membres
        const personnesData = await personneService.getAllPersonnes();
        
        // Si en mode édition, charger les données du membre
        if (isEditMode) {
          const membreData = await membreService.getMembreById(id);
          setFormData({
            id_personne: membreData.id,
            date_affiliation: membreData.date_affiliation ? new Date(membreData.date_affiliation).toISOString().split('T')[0] : ''
          });
          
          // En mode édition, on n'a pas besoin de filtrer les personnes
          setPersonnes(personnesData);
        } else {
          // En mode création, on récupère tous les membres pour filtrer les personnes
          const membresData = await membreService.getAllMembres();
          const membreIds = membresData.map(membre => membre.id);
          
          // Filtrer les personnes qui ne sont pas déjà membres
          const personnesNonMembres = personnesData.filter(personne => !membreIds.includes(personne.id));
          setPersonnes(personnesNonMembres);
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
    if (!formData.id_personne || !formData.date_affiliation) {
      showError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (isEditMode) {
        await membreService.updateMembre(id, { date_affiliation: formData.date_affiliation });
      } else {
        await membreService.createMembre(formData);
      }
      
      showSuccess(`Membre ${isEditMode ? 'modifié' : 'créé'} avec succès`);
      navigate('/membres');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du membre:', err);
      
      // Afficher un message d'erreur plus précis si possible
      if (err.response && err.response.data && err.response.data.error) {
        showError(err.response.data.error);
      } else {
        showError('Erreur lors de l\'enregistrement du membre. Veuillez réessayer plus tard.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) return <Spinner text="Chargement des données..." />;
  
  return (
    <div className="membre-form">
      <h1 className="mb-4">{isEditMode ? 'Modifier un membre' : 'Ajouter un membre'}</h1>
      

      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {!isEditMode && (
              <div className="mb-3">
                <label htmlFor="id_personne" className="form-label">Personne *</label>
                <select
                  className="form-select"
                  id="id_personne"
                  name="id_personne"
                  value={formData.id_personne}
                  onChange={handleChange}
                  required
                  disabled={isEditMode}
                >
                  <option value="">-- Sélectionnez une personne --</option>
                  {personnes.map(personne => (
                    <option key={personne.id} value={personne.id}>
                      {personne.nom} {personne.prenom} ({new Date(personne.dtn).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                {personnes.length === 0 && !isEditMode && (
                  <div className="form-text text-warning">
                    Aucune personne disponible. Toutes les personnes sont déjà membres ou aucune personne n'a été créée.
                    <Link to="/personnes/new" className="ms-2">
                      Créer une nouvelle personne
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            <div className="mb-3">
              <label htmlFor="date_affiliation" className="form-label">Date d'affiliation *</label>
              <input
                type="date"
                className="form-control"
                id="date_affiliation"
                name="date_affiliation"
                value={formData.date_affiliation}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="d-flex justify-content-between">
              <Link to="/membres" className="btn btn-secondary">
                Annuler
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || (personnes.length === 0 && !isEditMode)}
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

export default MembreForm;
