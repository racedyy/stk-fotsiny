import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import paiementService from '../../services/paiement.service';
import activiteService from '../../services/activite.service';
import membreService from '../../services/membre.service';
import presenceService from '../../services/presence.service';
import remiseService from '../../services/remise.service';
import './PaiementForm.css';

const PaiementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useNotification();
  const isEditMode = !!id;
  
  // Récupérer les paramètres de l'URL
  const queryParams = new URLSearchParams(location.search);
  const activiteIdFromUrl = queryParams.get('activite');
  const membreIdFromUrl = queryParams.get('membre');
  const personneIdFromUrl = queryParams.get('personne');
  const accompagnateurIdFromUrl = queryParams.get('accompagnateur');

  const [loading, setLoading] = useState(false);
  const [activites, setActivites] = useState([]);
  const [membres, setMembres] = useState([]);
  const [membrePresences, setMembrePresences] = useState([]);
  const [selectedActivite, setSelectedActivite] = useState(activiteIdFromUrl || '');
  const [selectedMembre, setSelectedMembre] = useState(membreIdFromUrl || '');
  const [selectedPersonne, setSelectedPersonne] = useState(personneIdFromUrl || '');
  const [selectedAccompagnateur, setSelectedAccompagnateur] = useState(accompagnateurIdFromUrl || '');
  const [formData, setFormData] = useState({
    id_presence_act: '',
    daty: new Date().toISOString().split('T')[0],
    montant: '',
    nbPersonnes: 0
  });
  
  // États pour les remises
  const [remises, setRemises] = useState([]);
  const [remiseApplicable, setRemiseApplicable] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  
  // Montant calculé avec remise éventuelle
  const [montantAvecRemise, setMontantAvecRemise] = useState(0);

  useEffect(() => {
    const fetchActivites = async () => {
      try {
        const data = await activiteService.getAllActivites();
        setActivites(data);
      } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
        showError('Erreur lors du chargement des activités');
      }
    };

    const fetchMembres = async () => {
      try {
        const data = await membreService.getAllMembres();
        setMembres(data);
      } catch (error) {
        console.error('Erreur lors du chargement des membres:', error);
        showError('Erreur lors du chargement des membres');
      }
    };
    
    const fetchRemises = async () => {
      try {
        const data = await remiseService.getAllRemises();
        setRemises(data);
      } catch (error) {
        console.error('Erreur lors du chargement des remises:', error);
        showError('Erreur lors du chargement des remises');
      }
    };

    fetchActivites();
    fetchMembres();
    fetchRemises();

    if (isEditMode) {
      const fetchPaiement = async () => {
        try {
          setLoading(true);
          const data = await paiementService.getPaiementById(id);
          setFormData({
            id_presence_act: data.id_presence_act,
            daty: new Date(data.daty).toISOString().split('T')[0],
            montant: data.montant,
            nbPersonnes: 0
          });
          setSelectedActivite(data.id_act);
          
          // Récupérer la présence pour obtenir le membre
          const presenceData = await presenceService.getPresenceById(data.id_presence_act);
          if (presenceData && presenceData.id_membre) {
            setSelectedMembre(presenceData.id_membre);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Erreur lors du chargement du paiement:', error);
          showError('Erreur lors du chargement du paiement');
          setLoading(false);
        }
      };

      fetchPaiement();
    }
  }, [id, isEditMode, showError]);

  useEffect(() => {
    if (selectedActivite && selectedMembre) {
      const fetchMembrePresences = async () => {
        try {
          // Récupérer les présences du membre pour cette activité
          const data = await presenceService.getPresencesByActivite(selectedActivite);
          const membrePresencesData = data.filter(p => p.id_membre === parseInt(selectedMembre));
          setMembrePresences(membrePresencesData);
          
          // Si une seule présence est trouvée, la sélectionner automatiquement
          if (membrePresencesData.length === 1) {
            setFormData(prevFormData => ({
              ...prevFormData,
              id_presence_act: membrePresencesData[0].id.toString()
            }));
          }
          
          // Calculer le nombre total de participants pour cette activité
          // Exclure le membre lui-même du décompte pour la remise
          setTotalParticipants(data.length - 1 + parseInt(formData.nbPersonnes || 0));
        } catch (error) {
          console.error('Erreur lors du chargement des présences du membre:', error);
          showError('Erreur lors du chargement des présences');
        }
      };
      
      fetchMembrePresences();
    } else {
      setMembrePresences([]);
    }
  }, [selectedActivite, selectedMembre, formData.nbPersonnes, showError]);

  // Déterminer la remise applicable en fonction du nombre total de participants
  useEffect(() => {
    if (remises.length > 0) {
      // Nombre total de participants pour la remise = participants existants (sans le membre) + nouvelles personnes anonymes
      const nbTotalParticipants = totalParticipants;
      
      // Trouver la remise applicable avec le plus grand nombre de personnes éligible
      const remiseApplicable = remises
        .filter(remise => remise.nb_personnes <= nbTotalParticipants)
        .sort((a, b) => b.nb_personnes - a.nb_personnes)[0] || null;
      
      setRemiseApplicable(remiseApplicable);
    }
  }, [remises, totalParticipants, formData.nbPersonnes]);
  
  // Calculer le montant avec remise éventuelle
  useEffect(() => {
    const montantBase = parseFloat(formData.montant) || 0;
    let montantFinal = montantBase;
    
    // Appliquer la remise si applicable
    if (remiseApplicable) {
      const remise = montantBase * (remiseApplicable.pourcentage / 100);
      montantFinal = montantBase - remise;
    }
    
    setMontantAvecRemise(montantFinal);
  }, [formData.montant, remiseApplicable]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleActiviteChange = (e) => {
    setSelectedActivite(e.target.value);
    setFormData({
      ...formData,
      id_presence_act: ''
    });
  };

  const handleMembreChange = (e) => {
    setSelectedMembre(e.target.value);
    setFormData({
      ...formData,
      id_presence_act: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMembre && !selectedPersonne) {
      showError('Veuillez sélectionner un participant');
      return;
    }
    
    // Vérifier si nous payons pour un membre ou une personne non-membre
    const estMembre = !!selectedMembre;
    
    // Si le membre n'est pas inscrit à l'activité, l'inscrire automatiquement
    if (estMembre && membrePresences.length === 0) {
      try {
        // Inscrire le membre à l'activité
        await presenceService.createPresenceMembre({
          id_membre: selectedMembre,
          id_act: selectedActivite
        });
        
        // Récupérer la nouvelle présence
        const presences = await presenceService.getPresencesByActivite(selectedActivite);
        const nouvelleMembrePresence = presences.find(p => 
          p.est_membre && p.id_membre === parseInt(selectedMembre)
        );
        
        if (!nouvelleMembrePresence) {
          showError('Erreur lors de l\'inscription automatique du membre à l\'activité');
          setLoading(false);
          return;
        }
        
        // Mettre à jour les présences du membre
        setMembrePresences([nouvelleMembrePresence]);
        showSuccess('Le membre a été automatiquement inscrit à l\'activité');
      } catch (error) {
        console.error('Erreur lors de l\'inscription automatique du membre:', error);
        showError('Erreur lors de l\'inscription automatique du membre à l\'activité');
        setLoading(false);
        return;
      }
    }
    
    try {
      setLoading(true);
      
      // 1. D'abord, créer les présences anonymes si nécessaire
      const nbPersonnes = parseInt(formData.nbPersonnes || 0);
      if (nbPersonnes > 0) {
        try {
          await presenceService.createMultipleAnonymousPresences({
            id_membre_accompagnateur: selectedMembre,
            id_act: selectedActivite,
            nombre: nbPersonnes
          });
          showSuccess(`${nbPersonnes} personne(s) anonyme(s) ajoutée(s) comme participants`);
        } catch (error) {
          console.error('Erreur lors de l\'ajout des personnes anonymes:', error);
          showError('Erreur lors de l\'ajout des personnes anonymes');
          setLoading(false);
          return;
        }
      }
      
      // 2. Ensuite, créer le paiement
      let id_presence_act;
      
      if (estMembre) {
        // Si c'est un membre, utiliser sa présence
        id_presence_act = membrePresences[0].id;
      } else {
        // Si c'est une personne non-membre, nous devons récupérer sa présence
        const presences = await presenceService.getPresencesByActivite(selectedActivite);
        const personnePresence = presences.find(p => 
          !p.est_membre && p.id_personne === parseInt(selectedPersonne)
        );
        
        if (!personnePresence) {
          showError('Présence non trouvée pour cette personne');
          setLoading(false);
          return;
        }
        
        id_presence_act = personnePresence.id;
      }
      
      // Préparer les données de paiement
      const paiementData = {
        id_presence_act: id_presence_act,
        daty: formData.daty,
        montant: montantAvecRemise // Utiliser le montant avec remise
      };

      if (isEditMode) {
        await paiementService.updatePaiement(id, paiementData);
        showSuccess('Paiement mis à jour avec succès');
      } else {
        if (estMembre) {
          // C'est un membre, donc utiliser createPaiementMembre
          await paiementService.createPaiementMembre(paiementData);
        } else {
          // C'est une personne non-membre, donc utiliser createPaiementPersonne
          await paiementService.createPaiementPersonne(paiementData);
        }
        showSuccess('Paiement créé avec succès');
      }
      
      navigate('/paiements');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du paiement:', error);
      showError('Erreur lors de l\'enregistrement du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="paiement-form">
      <h1>{isEditMode ? 'Modifier le paiement' : 'Nouveau paiement'}</h1>
      
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="activite" className="form-label">Activité</label>
            <select
              id="activite"
              className="form-select"
              value={selectedActivite}
              onChange={handleActiviteChange}
              disabled={isEditMode}
              required
            >
              <option value="">Sélectionner une activité</option>
              {activites.map(activite => (
                <option key={activite.id} value={activite.id}>
                  {new Date(activite.daty).toLocaleDateString()} - {activite.description} - {activite.cotisation} €
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="membre" className="form-label">Membre qui emmène des personnes</label>
            <select
              id="membre"
              className="form-select"
              value={selectedMembre}
              onChange={handleMembreChange}
              disabled={isEditMode || !selectedActivite}
              required
            >
              <option value="">Sélectionner un membre</option>
              {membres.map(membre => (
                <option key={membre.id} value={membre.id}>
                  {membre.nom} {membre.prenom}
                </option>
              ))}
            </select>
          </div>
          
          {membrePresences.length > 0 && (
            <div className="alert alert-info">
              <p><strong>Présence confirmée pour cette activité</strong></p>
              <p>Le membre {membres.find(m => m.id.toString() === selectedMembre)?.nom} {membres.find(m => m.id.toString() === selectedMembre)?.prenom} est bien inscrit à cette activité.</p>
            </div>
          )}
          
          {selectedActivite && selectedMembre && membrePresences.length === 0 && (
            <div className="alert alert-warning">
              <p><strong>Attention !</strong></p>
              <p>Ce membre n'est pas inscrit à cette activité. Veuillez d'abord l'inscrire à l'activité avant de procéder au paiement.</p>
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="daty" className="form-label">Date de paiement</label>
            <input
              type="date"
              className="form-control"
              id="daty"
              name="daty"
              value={formData.daty}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="montant" className="form-label">Montant</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              id="montant"
              name="montant"
              value={formData.montant}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="nbPersonnes" className="form-label">Nombre de personnes amenées (sans nom)</label>
            <input
              type="number"
              min="0"
              className="form-control"
              id="nbPersonnes"
              name="nbPersonnes"
              value={formData.nbPersonnes}
              onChange={handleChange}
            />
            <small className="form-text text-muted">
              Ces personnes seront enregistrées comme participants anonymes à l'activité.
            </small>
            <div className="form-text">
              <i className="bi bi-info-circle me-1"></i>
              <strong>Note:</strong> Les personnes non-membres ne paient pas individuellement. 
              C'est le membre qui paie le prix total de l'activité, mais des remises peuvent s'appliquer en fonction du nombre total de participants.
            </div>
          </div>
          
          {remises.length > 0 && (
            <div className="card mb-3">
              <div className="card-header bg-info text-white">
                <i className="bi bi-tag-fill me-2"></i>
                Remises disponibles
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>Nombre de participants</th>
                        <th>Pourcentage</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {remises.map(remise => (
                        <tr key={remise.id} className={remiseApplicable && remiseApplicable.id === remise.id ? 'table-success' : ''}>
                          <td>{remise.nb_personnes}+</td>
                          <td>{remise.pourcentage}%</td>
                          <td>{remise.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-2">
                  <strong>Nombre de personnes pour la remise: </strong>
                  <span className="badge bg-primary">
                    {totalParticipants}
                  </span>
                  <small className="ms-2 text-muted">(sans compter le membre)</small>
                  {remiseApplicable && (
                    <span className="ms-2 badge bg-success">
                      Remise applicable: {remiseApplicable.pourcentage}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {formData.montant && (
            <div className="alert alert-info">
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  <strong>Montant de base:</strong> {parseFloat(formData.montant).toLocaleString()} Ar
                </span>
                {remiseApplicable && (
                  <span className="badge bg-warning text-dark">
                    Remise: {remiseApplicable.pourcentage}%
                  </span>
                )}
              </div>
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <strong>Montant après remise:</strong>
                <span className="badge bg-success fs-5">
                  {montantAvecRemise.toLocaleString()} Ar
                </span>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/paiements')}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaiementForm;
