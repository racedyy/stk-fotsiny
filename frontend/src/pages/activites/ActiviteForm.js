import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import activiteService from '../../services/activite.service';
import constanteService from '../../services/constante.service';
import Spinner from '../../components/common/Spinner';
import { useNotification } from '../../contexts/NotificationContext';

const ActiviteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    daty: new Date().toISOString().split('T')[0],
    description: '',
    priorite: '3',
    region: '',
    cotisation: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useNotification();
  const [constante, setConstante] = useState(null);
  const [cotisationAuto, setCotisationAuto] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer les constantes
        const constantes = await constanteService.getAllConstantes();
        if (constantes.length > 0) {
          setConstante(constantes[0]);
        }
        
        if (isEditMode) {
          const activiteData = await activiteService.getActiviteById(id);
          setFormData({
            daty: activiteData.daty ? new Date(activiteData.daty).toISOString().split('T')[0] : '',
            description: activiteData.description,
            priorite: activiteData.priorite.toString(),
            region: activiteData.region,
            cotisation: activiteData.cotisation
          });
          setCotisationAuto(false); // En mode édition, on ne force pas la cotisation automatique
        } else {
          // Pour un nouveau formulaire, vérifier s'il y a un paramètre de région dans l'URL
          const urlParams = new URLSearchParams(window.location.search);
          const regionParam = urlParams.get('region');
          
          if (regionParam) {
            setFormData(prevState => ({
              ...prevState,
              region: regionParam
            }));
          }
          
          // Définir la cotisation par défaut en fonction de la priorité
          if (constantes.length > 0) {
            const defaultPriorite = 3; // Priorité par défaut
            const cotisationValue = getCotisationFromPriorite(defaultPriorite, constantes[0]);
            setFormData(prevState => ({
              ...prevState,
              cotisation: cotisationValue
            }));
          }
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
  
  // Fonction pour calculer la cotisation en fonction de la priorité et des constantes
  const getCotisationFromPriorite = (priorite, constante) => {
    if (!constante) return '';
    
    const { cotisation_inf, cotisation_sup } = constante;
    const ratio = (priorite - 1) / 9; // Priorité de 1 à 10 normalisée entre 0 et 1
    const cotisation = cotisation_inf + ratio * (cotisation_sup - cotisation_inf);
    
    return Math.round(cotisation); // Arrondir à l'entier le plus proche
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'priorite' && cotisationAuto && constante) {
      // Si la priorité change et que la cotisation est automatique, mettre à jour la cotisation
      const newPriorite = parseInt(value);
      const newCotisation = getCotisationFromPriorite(newPriorite, constante);
      
      setFormData(prevState => ({
        ...prevState,
        [name]: value,
        cotisation: newCotisation
      }));
    } else {
      // Sinon, mettre à jour normalement
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
      
      // Si l'utilisateur modifie manuellement la cotisation, désactiver le mode automatique
      if (name === 'cotisation') {
        setCotisationAuto(false);
      }
    }
  };
  
  // Fonction pour réactiver le mode cotisation automatique
  const handleResetCotisation = () => {
    if (constante) {
      const priorite = parseInt(formData.priorite);
      const newCotisation = getCotisationFromPriorite(priorite, constante);
      
      setFormData(prevState => ({
        ...prevState,
        cotisation: newCotisation
      }));
      
      setCotisationAuto(true);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation de base
    if (!formData.daty || !formData.description || !formData.region || !formData.cotisation) {
      showError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    // Validation de la date (doit être supérieure à la date du jour)
    const dateActivite = new Date(formData.daty);
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates
    
    if (dateActivite < aujourdHui) {
      showError('La date de l\'activité doit être supérieure ou égale à la date du jour.');
      return;
    }
    
    // Validation de la priorité (doit être entre 1 et 10)
    const priorite = parseInt(formData.priorite);
    if (isNaN(priorite) || priorite < 1 || priorite > 10) {
      showError('La priorité doit être un nombre entier entre 1 et 10.');
      return;
    }
    
    // Validation de la cotisation (doit être un nombre positif et compris entre les valeurs de constante)
    const cotisation = parseFloat(formData.cotisation);
    if (isNaN(cotisation) || cotisation < 0) {
      showError('La cotisation doit être un montant valide (nombre positif).');
      return;
    }
    
    // Vérifier que la cotisation est comprise entre les valeurs min et max définies dans la table constante
    if (constante) {
      const { cotisation_inf, cotisation_sup } = constante;
      if (cotisation < cotisation_inf || cotisation > cotisation_sup) {
        showError(`La cotisation doit être comprise entre ${cotisation_inf} Ar et ${cotisation_sup} Ar.`);
        return;
      }
    }
    
    setSubmitting(true);

    
    try {
      const activiteData = {
        ...formData,
        priorite: priorite,
        cotisation: cotisation
      };
      
      if (isEditMode) {
        await activiteService.updateActivite(id, activiteData);
      } else {
        await activiteService.createActivite(activiteData);
      }
      
      showSuccess(`Activité ${isEditMode ? 'modifiée' : 'créée'} avec succès`);
      navigate('/activites');
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de l\'activité:', err);
      showError(err.response?.data?.error || 'Erreur lors de l\'enregistrement de l\'activité. Veuillez réessayer plus tard.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) return <Spinner text="Chargement des données..." />;
  
  return (
    <div className="activite-form">
      <h1 className="mb-4">{isEditMode ? 'Modifier une activité' : 'Ajouter une activité'}</h1>
      

      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="daty" className="form-label">Date *</label>
              <input
                type="date"
                className="form-control"
                id="daty"
                name="daty"
                value={formData.daty}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <small className="form-text text-muted">
                La date doit être supérieure ou égale à la date du jour
              </small>
            </div>
            
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description *</label>
              <textarea
                className="form-control"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                required
              ></textarea>
            </div>
            
            <div className="mb-3">
              <label htmlFor="priorite" className="form-label">Priorité (1-10) *</label>
              <input
                type="number"
                className="form-control"
                id="priorite"
                name="priorite"
                value={formData.priorite}
                onChange={handleChange}
                min="1"
                max="10"
                step="1"
                required
              />
              <small className="form-text text-muted">
                Entrez un nombre entier entre 1 et 10 (1 = moins prioritaire, 10 = très prioritaire)
              </small>
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
            
            <div className="mb-3">
              <label htmlFor="cotisation" className="form-label">Cotisation (Ar) *</label>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control"
                  id="cotisation"
                  name="cotisation"
                  value={formData.cotisation}
                  onChange={handleChange}
                  step="0.01"
                  required
                />
                {!cotisationAuto && (
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={handleResetCotisation}
                    title="Recalculer automatiquement la cotisation en fonction de la priorité"
                  >
                    <i className="bi bi-arrow-repeat"></i>
                  </button>
                )}
              </div>
              {constante && (
                <small className="form-text text-muted">
                  Valeurs de référence: Min: {constante.cotisation_inf} Ar, Max: {constante.cotisation_sup} Ar
                </small>
              )}
            </div>
            
            <div className="d-flex justify-content-between">
              <Link to="/activites" className="btn btn-secondary">
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

export default ActiviteForm;
