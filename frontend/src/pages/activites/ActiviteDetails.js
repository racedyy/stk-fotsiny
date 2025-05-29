import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import activiteService from '../../services/activite.service';
import personneService from '../../services/personne.service';
import paiementService from '../../services/paiement.service';
import membreService from '../../services/membre.service';
import presenceService from '../../services/presence.service';
import remiseService from '../../services/remise.service';
import Spinner from '../../components/common/Spinner';

import { useNotification } from '../../contexts/NotificationContext';

const ActiviteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activite, setActivite] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [personnes, setPersonnes] = useState([]);
  const [membres, setMembres] = useState([]);
  const [remises, setRemises] = useState([]);
  const [remiseApplicable, setRemiseApplicable] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useNotification();
  
  const [activeTab, setActiveTab] = useState('participants');
  
  // États pour l'ajout de participants
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [participantType, setParticipantType] = useState('membre');
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [selectedMembreId, setSelectedMembreId] = useState('');
  
  // Nous n'avons plus besoin de stocker les relations dans un état local
  // car elles sont maintenant gérées directement dans la base de données
  
  // États pour l'ajout de paiements
  const [showAddPaiement, setShowAddPaiement] = useState(false);
  const [paiementType, setPaiementType] = useState('membre');
  const [selectedPayeurId, setSelectedPayeurId] = useState('');
  const [paiementDate, setPaiementDate] = useState(new Date().toISOString().split('T')[0]);
  const [paiementMontant, setPaiementMontant] = useState('');
  
  useEffect(() => {
    fetchData();
  }, [id]);
  
  // Nous n'avons plus besoin de sauvegarder les relations dans le localStorage
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données de l'activité, des participants, des paiements et des remises
      const [activiteData, participantsData, paiementsData, personnesData, membresData, remisesData] = await Promise.all([
        activiteService.getActiviteById(id),
        activiteService.getParticipants(id),
        activiteService.getPaiements(id),
        personneService.getAllPersonnes(),
        membreService.getAllMembres(),
        remiseService.getAllRemises()
      ]);
      
      setActivite(activiteData);
      setParticipants(participantsData);
      setPaiements(paiementsData);
      setPersonnes(personnesData);
      setMembres(membresData);
      setRemises(remisesData);
      
      // Déterminer la remise applicable en fonction du nombre de participants
      const nbParticipants = participantsData.length;
      const remiseApplicable = remisesData
        .filter(remise => remise.nb_personnes <= nbParticipants)
        .sort((a, b) => b.nb_personnes - a.nb_personnes)[0] || null;
      
      setRemiseApplicable(remiseApplicable);
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      showError('Erreur lors du chargement des données. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };
  
  const handleAddParticipant = async () => {
    if (!selectedParticipantId) {
      showError('Veuillez sélectionner un participant.');
      return;
    }
    
    // Pour les personnes non-membres, un accompagnateur est obligatoire
    if (participantType === 'personne' && !selectedMembreId) {
      showError('Veuillez sélectionner un membre accompagnateur. Une personne non-membre doit obligatoirement être accompagnée par un membre.');
      return;
    }
    
    try {
      let nouvellePresence;
      
      if (participantType === 'membre') {
        // Ajouter un membre comme participant
        nouvellePresence = await presenceService.createPresenceMembre({
          id_membre: selectedParticipantId,
          id_act: id
        });
      } else {
        // Ajouter un participant non-membre (personne) avec le membre accompagnateur
        const response = await presenceService.createPresencePersonne({
          id_personne: selectedParticipantId,
          id_act: id,
          id_membre_accompagnateur: selectedMembreId
        });
        
        // Mettre à jour la liste des participants
        setParticipants([...participants, response]);
        
        // Trouver le membre accompagnateur pour le message de succès
        const membreAccompagnateur = participants.find(p => p.est_membre && p.id_membre === parseInt(selectedMembreId));
        const personneAjoutee = personnes.find(p => p.id === parseInt(selectedParticipantId));
        
        if (membreAccompagnateur && personneAjoutee) {
          showSuccess(`${personneAjoutee.nom} ${personneAjoutee.prenom} a été ajouté(e) comme participant(e), amené(e) par ${membreAccompagnateur.nom} ${membreAccompagnateur.prenom}`);
        } else {
          showSuccess(`${response.nom} ${response.prenom} a été ajouté(e) comme participant(e)`);
        }
        
        // Réinitialiser le formulaire
        setSelectedParticipantId('');
        setSelectedMembreId('');
        setShowAddParticipant(false);
        
        showSuccess('Participant ajouté avec succès');
      }
      
      // Rafraîchir les données
      const participantsData = await activiteService.getParticipants(id);
      setParticipants(participantsData);
      
      showSuccess('Participant ajouté avec succès');
    } catch (err) {
      console.error('Erreur lors de l\'ajout du participant:', err);
      
      if (err.response && err.response.data && err.response.data.error) {
        showError(err.response.data.error);
      } else {
        showError('Erreur lors de l\'ajout du participant. Veuillez réessayer plus tard.');
      }
    }
  };
  
  const handleDeleteParticipant = async (presenceId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce participant ?')) {
      try {
        await presenceService.deletePresence(presenceId);
        
        // Rafraîchir les données
        const participantsData = await activiteService.getParticipants(id);
        setParticipants(participantsData);
        
        showSuccess('Participant supprimé avec succès');
      } catch (err) {
        console.error('Erreur lors de la suppression du participant:', err);
        showError('Erreur lors de la suppression du participant. Veuillez réessayer plus tard.');
      }
    }
  };
  
  const handleAddPaiement = async () => {
    if (!selectedPayeurId || !paiementDate || !paiementMontant) {
      showError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    // Vérifier que le montant ne dépasse pas le solde restant à payer
    const montantPaye = getMontantPayeParParticipant(
      selectedPayeurId,
      paiementType === 'membre'
    );
    const soldeRestant = activite.cotisation - montantPaye;
    
    if (parseFloat(paiementMontant) > soldeRestant) {
      // Afficher un message d'erreur plus détaillé
      showError(
        `ERREUR: Montant trop élevé! \n\n` +
        `Le montant saisi (${parseFloat(paiementMontant).toLocaleString()} Ar) dépasse le solde restant à payer (${soldeRestant.toLocaleString()} Ar). \n\n` +
        `Cotisation totale: ${activite.cotisation.toLocaleString()} Ar \n` +
        `Déjà payé: ${montantPaye.toLocaleString()} Ar \n` +
        `Reste à payer: ${soldeRestant.toLocaleString()} Ar`
      );
      return;
    }
    
    try {
      if (paiementType === 'membre') {
        await paiementService.createPaiementMembre({
          id_membre: selectedPayeurId,
          id_act: id,
          daty: paiementDate,
          montant: parseFloat(paiementMontant)
        });
      } else {
        // Pour une personne non-membre, trouver le membre qui l'accompagne
        const personneParticipant = participants.find(p => !p.est_membre && p.id_personne === parseInt(selectedPayeurId));
        
        if (!personneParticipant || !personneParticipant.id_membre_accompagnateur) {
          showError('Impossible de trouver le membre accompagnateur pour cette personne. Veuillez réessayer.');
          return;
        }
        
        await paiementService.createPaiementPersonne({
          id_personne: selectedPayeurId,
          id_act: id,
          daty: paiementDate,
          montant: parseFloat(paiementMontant),
          id_membre_accompagnateur: personneParticipant.id_membre_accompagnateur
        });
      }
      
      // Rafraîchir les données
      const paiementsData = await activiteService.getPaiements(id);
      setPaiements(paiementsData);
      
      // Réinitialiser le formulaire
      setSelectedPayeurId('');
      setPaiementDate(new Date().toISOString().split('T')[0]);
      setPaiementMontant('');
      setShowAddPaiement(false);
      
      showSuccess('Paiement ajouté avec succès');
    } catch (err) {
      console.error('Erreur lors de l\'ajout du paiement:', err);
      
      // Vérifier si l'erreur est liée au dépassement du montant de cotisation
      if (err.response && err.response.data && err.response.data.error && 
          err.response.data.error.includes('dépasse le solde restant')) {
        
        const { montantTotalPaye, cotisation, soldeRestant } = err.response.data;
        
        showError(
          `ERREUR: Montant trop élevé! \n\n` +
          `Le montant saisi dépasse le solde restant à payer. \n\n` +
          `Cotisation totale: ${cotisation?.toLocaleString() || 'N/A'} Ar \n` +
          `Total déjà payé: ${montantTotalPaye?.toLocaleString() || 'N/A'} Ar \n` +
          `Reste à payer: ${soldeRestant?.toLocaleString() || '0'} Ar \n\n` +
          `Impossible d'ajouter un paiement qui ferait dépasser le montant total de la cotisation.`
        );
      } else {
        showError('Erreur lors de l\'ajout du paiement. Veuillez réessayer plus tard.');
      }
    }
  };
  
  const handleDeletePaiement = async (paiementId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      try {
        await paiementService.deletePaiement(paiementId);
        
        // Rafraîchir les données
        const paiementsData = await activiteService.getPaiements(id);
        setPaiements(paiementsData);
        
        showSuccess('Paiement supprimé avec succès');
      } catch (err) {
        console.error('Erreur lors de la suppression du paiement:', err);
        showError('Erreur lors de la suppression du paiement. Veuillez réessayer plus tard.');
      }
    }
  };
  
  const handleDeleteActivite = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette activité ? Cette action supprimera également tous les participants et paiements associés.')) {
      try {
        await activiteService.deleteActivite(id);
        navigate('/activites');
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'activité:', err);
        showError('Erreur lors de la suppression de l\'activité. Veuillez réessayer plus tard.');
      }
    }
  };
  
  // Fonction pour calculer le montant total payé par un participant
  const getMontantPayeParParticipant = (participantId, estMembre) => {
    // Filtrer les paiements pour ce participant
    const paiementsParticipant = paiements.filter(paiement => {
      if (estMembre) {
        return paiement.id_membre === participantId;
      } else {
        return paiement.id_personne === participantId;
      }
    });
    
    // Calculer le total des paiements
    return paiementsParticipant.reduce((total, paiement) => total + parseFloat(paiement.montant), 0);
  };
  
  // Vérifier si un participant a complètement payé sa cotisation
  const aCompletementPaye = (participantId, estMembre) => {
    if (!activite) return false;
    
    const montantPaye = getMontantPayeParParticipant(participantId, estMembre);
    return montantPaye >= activite.cotisation;
  };
  
  // Filtrer les personnes qui ne sont pas déjà participants et qui ne sont pas déjà membres
  const filteredPersonnes = personnes.filter(personne => {
    // Vérifier si la personne n'est pas déjà participante
    const notParticipant = !participants.some(participant => 
      participant.id_personne === personne.id
    );
    
    // Vérifier si la personne n'est pas déjà membre
    const notMembre = !membres.some(membre => 
      membre.id === personne.id
    );
    
    // Retourner true seulement si la personne n'est ni participante ni membre
    return notParticipant && notMembre;
  });
  
  // Filtrer les membres qui ne sont pas déjà participants
  const filteredMembres = membres.filter(membre => {
    return !participants.some(participant => 
      participant.id_membre === membre.id
    );
  });
  
  // Filtrer les participants qui n'ont pas encore complètement payé leur cotisation
  const participantsAvecPaiementDu = participants.filter(participant => {
    return !aCompletementPaye(
      participant.est_membre ? participant.id_membre : participant.id_personne,
      participant.est_membre
    );
  });
  
  // Calculer le total des paiements pour cette activité
  const totalPaiements = paiements.reduce((total, paiement) => total + parseFloat(paiement.montant), 0);
  
  // Calculer le montant total des cotisations (cotisation fixe par activité, pas par participant)
  const totalCotisationsSansRemise = activite ? activite.cotisation : 0;
  
  // Appliquer la remise si applicable
  const totalCotisations = remiseApplicable ? 
    calculerMontantApresRemise(totalCotisationsSansRemise, remiseApplicable) : 
    totalCotisationsSansRemise;
  
  // Calculer le reste à payer (ne peut pas être négatif)
  const resteAPayer = Math.max(0, totalCotisations - totalPaiements);
  
  // Calculer le nombre de membres et de non-membres présents
  const nombreMembresPresents = participants.filter(p => p.est_membre).length;
  const nombreNonMembresPresents = participants.filter(p => !p.est_membre).length;
  
  if (loading) return <Spinner text="Chargement des détails de l'activité..." />;
  
  if (!activite) {
    return (
      <div className="alert alert-danger">
        Activité non trouvée. <Link to="/activites">Retour à la liste des activités</Link>
      </div>
    );
  }
  
  return (
    <div className="activite-details">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Détails de l'activité</h1>
        <div>
          <Link to={`/activites/edit/${id}`} className="btn btn-primary me-2">
            <i className="bi bi-pencil me-1"></i>Modifier
          </Link>
          <button className="btn btn-danger" onClick={handleDeleteActivite}>
            <i className="bi bi-trash me-1"></i>Supprimer
          </button>
        </div>
      </div>
      

      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h5 className="card-title">{activite.description}</h5>
              <p className="card-text">
                <strong>Date:</strong> {new Date(activite.daty).toLocaleDateString()}
              </p>
              <p className="card-text">
                <strong>Région:</strong> {activite.region}
              </p>
            </div>
            <div className="col-md-6">
              <p className="card-text">
                <strong>Priorité:</strong> <span className={`badge bg-${getPriorityColor(activite.priorite)} ms-2`}>Niveau {activite.priorite}/10</span>
              </p>
              <p className="card-text">
                <strong>Cotisation:</strong> {activite.cotisation} Ar
              </p>
              <p className="card-text">
                <strong>Participants:</strong> {participants.length} au total
                <span className="ms-2 badge bg-primary">{nombreMembresPresents} membres</span>
                <span className="ms-2 badge bg-secondary">{nombreNonMembresPresents} non-membres</span>
              </p>
              <p className="card-text">
                <strong>Cotisation totale:</strong>
                {remiseApplicable ? (
                  <>
                    <span className="ms-2 text-decoration-line-through">{totalCotisationsSansRemise.toLocaleString()} Ar</span>
                    <span className="ms-2 badge bg-success">{totalCotisations.toLocaleString()} Ar</span>
                    <span className="ms-2 badge bg-warning text-dark">
                      <i className="bi bi-tag-fill me-1"></i>
                      Remise de {remiseApplicable.pourcentage}%
                    </span>
                  </>
                ) : (
                  <span className="ms-2">{totalCotisations.toLocaleString()} Ar</span>
                )}
              </p>
              <p className="card-text">
                <strong>Paiements:</strong>
                <span className="ms-2 badge bg-success">{totalPaiements.toLocaleString()} Ar reçus</span>
                <span className="ms-2 badge bg-danger">{resteAPayer.toLocaleString()} Ar restants</span>
                <span className="ms-2 badge bg-info">{totalPaiements > 0 ? Math.round((totalPaiements / totalCotisations) * 100) : 0}% payés</span>
              </p>
              {remiseApplicable && (
                <p className="card-text">
                  <strong>Détails de la remise:</strong>
                  <span className="ms-2 badge bg-warning text-dark">
                    <i className="bi bi-tag-fill me-1"></i>
                    {remiseApplicable.pourcentage}% pour {remiseApplicable.nb_personnes}+ participants
                  </span>
                  <span className="ms-2 text-muted">{remiseApplicable.description}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'participants' ? 'active' : ''}`}
                onClick={() => setActiveTab('participants')}
              >
                Participants ({participants.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'paiements' ? 'active' : ''}`}
                onClick={() => setActiveTab('paiements')}
              >
                Paiements ({paiements.length})
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {activeTab === 'participants' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Liste des participants</h5>
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => setShowAddParticipant(!showAddParticipant)}
                >
                  {showAddParticipant ? 'Annuler' : 'Ajouter un participant'}
                </button>
              </div>
              
              {showAddParticipant && (
                <div className="card mb-3">
                  <div className="card-body">
                    <h6 className="card-title">Ajouter un participant</h6>
                    
                    <div className="mb-3">
                      <label className="form-label">Type de participant</label>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="participantType"
                          id="typeMembre"
                          value="membre"
                          checked={participantType === 'membre'}
                          onChange={() => {
                            setParticipantType('membre');
                            setSelectedParticipantId('');
                          }}
                        />
                        <label className="form-check-label" htmlFor="typeMembre">
                          Membre participant directement
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="participantType"
                          id="typePersonne"
                          value="personne"
                          checked={participantType === 'personne'}
                          onChange={() => {
                            setParticipantType('personne');
                            setSelectedParticipantId('');
                          }}
                        />
                        <label className="form-check-label" htmlFor="typePersonne">
                          Personne non-membre amenée par un membre
                        </label>
                      </div>
                    </div>
                    
                    {participantType === 'membre' && (
                      <div className="mb-3">
                        <label className="form-label">Sélectionnez un membre</label>
                        <select
                          className="form-select"
                          value={selectedParticipantId}
                          onChange={(e) => setSelectedParticipantId(e.target.value)}
                        >
                          <option value="">-- Sélectionnez un membre --</option>
                          {filteredMembres.map(membre => (
                            <option key={membre.id} value={membre.id}>
                              {membre.nom} {membre.prenom}
                            </option>
                          ))}
                        </select>
                        {filteredMembres.length === 0 && (
                          <div className="form-text text-warning">
                            Tous les membres sont déjà participants ou aucun membre n'a été créé.
                          </div>
                        )}
                      </div>
                    )}
                    
                    {participantType === 'personne' && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">Sélectionnez une personne non-membre</label>
                          <select
                            className="form-select"
                            value={selectedParticipantId}
                            onChange={(e) => setSelectedParticipantId(e.target.value)}
                          >
                            <option value="">-- Sélectionnez une personne --</option>
                            {filteredPersonnes.map(personne => (
                              <option key={personne.id} value={personne.id}>
                                {personne.nom} {personne.prenom}
                              </option>
                            ))}
                          </select>
                          {filteredPersonnes.length === 0 && (
                            <div className="form-text text-warning">
                              Toutes les personnes sont déjà participants ou aucune personne n'a été créée.
                            </div>
                          )}
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">Membre qui amène cette personne <span className="text-danger">*</span></label>
                          <select
                            className="form-select"
                            value={selectedMembreId}
                            onChange={(e) => setSelectedMembreId(e.target.value)}
                            required
                          >
                            <option value="">-- Sélectionnez un membre --</option>
                            {participants.filter(p => p.est_membre).map(membre => (
                              <option key={membre.id_membre} value={membre.id_membre}>
                                {membre.nom} {membre.prenom}
                              </option>
                            ))}
                          </select>
                          <div className="form-text text-danger">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Une personne non-membre doit obligatoirement être accompagnée par un membre participant.
                          </div>
                        </div>
                        
                        {participants.filter(p => p.est_membre).length === 0 && (
                          <div className="alert alert-warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Aucun membre ne participe encore à cette activité. Vous pouvez quand même ajouter une personne non-membre.
                          </div>
                        )}
                      </>
                    )}
                    
                    
                    <button
                      className="btn btn-primary"
                      onClick={handleAddParticipant}
                      disabled={!selectedParticipantId}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              )}
              
              {participants.length === 0 ? (
                <div className="alert alert-info">
                  Aucun participant pour cette activité.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Type</th>
                        <th>Informations</th>
                        <th>Paiement</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* D'abord afficher les membres */}
                      {participants.filter(p => p.est_membre).map(participant => {
                        // Compter combien de personnes ce membre amène
                        const personnesAmenees = participants.filter(p => 
                          !p.est_membre && p.id_membre_accompagnateur === participant.id_membre
                        ).length;
                        
                        // Vérifier si le membre a payé
                        const membrePaiements = paiements.filter(p => 
                          p.est_membre && p.id_membre === participant.id_membre
                        );
                        const membreTotalPaye = membrePaiements.reduce((total, p) => total + parseFloat(p.montant), 0);
                        const membreAPaye = membreTotalPaye > 0;
                          
                        return (
                          <tr key={participant.id} className="table-light">
                            <td>{participant.nom}</td>
                            <td>{participant.prenom}</td>
                            <td>
                              <span className="badge bg-primary">Membre</span>
                            </td>
                            <td>
                              {personnesAmenees > 0 ? (
                                <span className="badge bg-info">
                                  <i className="bi bi-people me-1"></i>
                                  Amène {personnesAmenees} personne(s)
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {membreAPaye ? (
                                <span className="badge bg-success">
                                  <i className="bi bi-check-circle me-1"></i>
                                  {membreTotalPaye.toLocaleString()} Ar
                                </span>
                              ) : (
                                <span className="badge bg-danger">
                                  <i className="bi bi-x-circle me-1"></i>
                                  Non payé
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <Link
                                  to={`/paiements/new?activite=${activite.id}&membre=${participant.id_membre}`}
                                  className="btn btn-sm btn-outline-success"
                                  title="Ajouter un paiement"
                                >
                                  <i className="bi bi-cash"></i>
                                </Link>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteParticipant(participant.id)}
                                  title="Supprimer le participant"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                      }
                      
                      {/* Ensuite afficher les non-membres */}
                      {participants.filter(p => !p.est_membre).map(participant => {
                        // Vérifier si la personne a payé
                        const personnePaiements = paiements.filter(p => 
                          !p.est_membre && p.id_personne === participant.id_personne
                        );
                        const personneTotalPaye = personnePaiements.reduce((total, p) => total + parseFloat(p.montant), 0);
                        const personneAPaye = personneTotalPaye > 0;
                        
                        return (
                          <tr key={participant.id}>
                            <td>{participant.nom}</td>
                            <td>{participant.prenom}</td>
                            <td>
                              <span className="badge bg-secondary">Non-membre</span>
                            </td>
                            <td>
                              {participant.id_membre_accompagnateur ? (
                                <span className="text-success">
                                  <i className="bi bi-person-check me-1"></i>
                                  Amené(e) par {participant.nom_accompagnateur} {participant.prenom_accompagnateur}
                                </span>
                              ) : (
                                <span className="badge bg-warning text-dark">
                                  <i className="bi bi-exclamation-triangle me-1"></i>
                                  Accompagnateur non spécifié
                                </span>
                              )}
                            </td>
                            <td>
                              {personneAPaye ? (
                                <span className="badge bg-success">
                                  <i className="bi bi-check-circle me-1"></i>
                                  {personneTotalPaye.toLocaleString()} Ar
                                </span>
                              ) : (
                                <span className="badge bg-danger">
                                  <i className="bi bi-x-circle me-1"></i>
                                  Non payé
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <Link
                                  to={`/paiements/new?activite=${activite.id}&personne=${participant.id_personne}&accompagnateur=${participant.id_membre_accompagnateur}`}
                                  className="btn btn-sm btn-outline-success"
                                  title="Ajouter un paiement"
                                >
                                  <i className="bi bi-cash"></i>
                                </Link>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteParticipant(participant.id)}
                                  title="Supprimer le participant"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'paiements' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Liste des paiements</h5>
                {resteAPayer > 0 ? (
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => setShowAddPaiement(!showAddPaiement)}
                  >
                    {showAddPaiement ? 'Annuler' : 'Ajouter un paiement'}
                  </button>
                ) : (
                  <span className="badge bg-success">
                    <i className="bi bi-check-circle me-1"></i>
                    Cotisation entièrement payée
                  </span>
                )}
              </div>
              
              <div className="row mb-3">
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title">Total cotisations</h6>
                      <h4 className="card-text text-primary">
                        {totalCotisations.toLocaleString()} Ar
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title">Total payé</h6>
                      <h4 className="card-text text-success">
                        {totalPaiements.toLocaleString()} Ar
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title">Reste à payer</h6>
                      <h4 className="card-text text-danger">
                        {resteAPayer.toLocaleString()} Ar
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
              
              {showAddPaiement && (
                <div className="card mb-3">
                  <div className="card-body">
                    <h6 className="card-title">Ajouter un paiement</h6>
                    <div className="mb-3">
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="paiementType"
                          id="paiementTypeMembre"
                          value="membre"
                          checked={paiementType === 'membre'}
                          onChange={() => {
                            setPaiementType('membre');
                            setSelectedPayeurId('');
                          }}
                        />
                        <label className="form-check-label" htmlFor="paiementTypeMembre">
                          Membre
                        </label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="paiementType"
                          id="paiementTypePersonne"
                          value="personne"
                          checked={paiementType === 'personne'}
                          onChange={() => {
                            setPaiementType('personne');
                            setSelectedPayeurId('');
                          }}
                        />
                        <label className="form-check-label" htmlFor="paiementTypePersonne">
                          Personne non-membre
                        </label>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="payeur" className="form-label">Payeur *</label>
                      <select
                        className="form-select"
                        id="payeur"
                        value={selectedPayeurId}
                        onChange={(e) => setSelectedPayeurId(e.target.value)}
                        required
                      >
                        <option value="">-- Sélectionnez un {paiementType === 'membre' ? 'membre' : 'personne'} --</option>
                        {paiementType === 'membre' ? (
                          // Filtrer les membres participants qui n'ont pas encore complètement payé
                          participants
                            .filter(p => p.est_membre && !aCompletementPaye(p.id_membre, true))
                            .map(p => (
                              <option key={p.id_membre} value={p.id_membre}>
                                {p.nom} {p.prenom} - {getMontantPayeParParticipant(p.id_membre, true)}/{activite.cotisation} Ar payé
                              </option>
                            ))
                        ) : (
                          // Filtrer les personnes non-membres participantes qui n'ont pas encore complètement payé
                          participants
                            .filter(p => !p.est_membre && !aCompletementPaye(p.id_personne, false))
                            .map(p => (
                              <option key={p.id_personne} value={p.id_personne}>
                                {p.nom} {p.prenom} - {getMontantPayeParParticipant(p.id_personne, false)}/{activite.cotisation} Ar payé
                              </option>
                            ))
                        )}
                      </select>
                      {paiementType === 'membre' && participants.filter(p => p.est_membre && !aCompletementPaye(p.id_membre, true)).length === 0 && (
                        <div className="form-text text-success mt-2">
                          <i className="bi bi-check-circle me-1"></i>
                          Tous les membres participants ont complètement payé leur cotisation.
                        </div>
                      )}
                      {paiementType === 'personne' && participants.filter(p => !p.est_membre && !aCompletementPaye(p.id_personne, false)).length === 0 && (
                        <div className="form-text text-success mt-2">
                          <i className="bi bi-check-circle me-1"></i>
                          Toutes les personnes non-membres participantes ont complètement payé leur cotisation.
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="paiementDate" className="form-label">Date du paiement *</label>
                      <input
                        type="date"
                        className="form-control"
                        id="paiementDate"
                        value={paiementDate}
                        onChange={(e) => setPaiementDate(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="paiementMontant" className="form-label">Montant (Ar) *</label>
                      <input
                        type="number"
                        className="form-control"
                        id="paiementMontant"
                        value={paiementMontant}
                        onChange={(e) => setPaiementMontant(e.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <button
                      className="btn btn-primary"
                      onClick={handleAddPaiement}
                      disabled={!selectedPayeurId || !paiementDate || !paiementMontant}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              )}
              
              {paiements.length === 0 ? (
                <div className="alert alert-info">
                  Aucun paiement pour cette activité.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Payeur</th>
                        <th>Type</th>
                        <th>Montant</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paiements.map(paiement => (
                        <tr key={paiement.id}>
                          <td>{new Date(paiement.daty).toLocaleDateString()}</td>
                          <td>{paiement.nom} {paiement.prenom}</td>
                          <td>
                            {paiement.est_membre ? (
                              <span className="badge bg-primary">Membre</span>
                            ) : (
                              <span className="badge bg-secondary">Non-membre</span>
                            )}
                          </td>
                          <td>{parseFloat(paiement.montant).toLocaleString()} Ar</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeletePaiement(paiement.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="d-flex justify-content-between">
        <Link to="/activites" className="btn btn-secondary">
          Retour à la liste
        </Link>
      </div>
    </div>
  );
};

// Fonction pour calculer le montant après remise
const calculerMontantApresRemise = (montant, remise) => {
  if (!remise) return montant;
  
  const pourcentageRemise = remise.pourcentage;
  const montantRemise = (montant * pourcentageRemise) / 100;
  return montant - montantRemise;
};

// Fonction pour déterminer la couleur en fonction de la priorité
const getPriorityColor = (priorite) => {
  const priority = parseInt(priorite);
  
  // Priorité de 1 à 10 (1 = plus basse, 10 = plus haute)
  if (priority >= 8) {
    return 'danger'; // Rouge pour les priorités très hautes (8-10)
  } else if (priority >= 6) {
    return 'warning'; // Orange pour les priorités hautes (6-7)
  } else if (priority >= 4) {
    return 'primary'; // Bleu pour les priorités moyennes (4-5)
  } else if (priority >= 2) {
    return 'info'; // Bleu clair pour les priorités basses (2-3)
  } else {
    return 'success'; // Vert pour les priorités très basses (1)
  }
};

export default ActiviteDetails;
