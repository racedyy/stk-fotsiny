import React, { useState, useEffect } from 'react';
import statistiqueService from '../../services/statistique.service';
import Spinner from '../../components/common/Spinner';
import { useNotification } from '../../contexts/NotificationContext';

const SituationActivitesSP = () => {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();
  
  // Initialiser les dates par défaut (mois en cours) et charger les données automatiquement
  useEffect(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const debutStr = firstDayOfMonth.toISOString().split('T')[0];
    const finStr = lastDayOfMonth.toISOString().split('T')[0];
    
    setDateDebut(debutStr);
    setDateFin(finStr);
    
    // Charger automatiquement les statistiques avec les dates par défaut
    loadStatistiques(debutStr, finStr);
  }, []);
  
  // Fonction pour charger les statistiques
  const loadStatistiques = async (debut, fin) => {
    if (!debut || !fin) {
      showError('Veuillez sélectionner les dates de début et de fin');
      return;
    }
    
    try {
      setLoading(true);
      
      const data = await statistiqueService.getStatistiquesActivitesBySP(debut, fin);
      setStatistiques(data);
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err);
      showError(err.response?.data?.error || 'Erreur lors de la récupération des statistiques. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };
  
  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    loadStatistiques(dateDebut, dateFin);
  };
  
  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Situation des Activités par sp</h2>
      
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Sélectionner la période</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label htmlFor="dateDebut" className="form-label">Date de début</label>
                <input
                  type="date"
                  className="form-control"
                  id="dateDebut"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="dateFin" className="form-label">Date de fin</label>
                <input
                  type="date"
                  className="form-control"
                  id="dateFin"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-4">
                <button type="submit" className="btn btn-primary w-100">
                  <i className="bi bi-search me-2"></i>
                  Actualiser
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {loading ? (
        <Spinner text="Chargement des statistiques..." />
      ) : statistiques ? (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-info">
              <strong>Période:</strong> Du {new Date(statistiques.dateDebut).toLocaleDateString()} au {new Date(statistiques.dateFin).toLocaleDateString()}
            </div>
          </div>
        </div>
      ) : null}
      
      {statistiques && (
        <>
          {/* Tableau des statistiques par sp */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Statistiques par sp</h5>
              <p className="card-text text-muted">Ce tableau montre les statistiques des activités regroupées par sp.</p>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-primary">
                    <tr>
                      <th>sp</th>
                      <th>Région</th>
                      <th>Nombre de personnes</th>
                      <th>Nombre d'activités</th>
                      <th>Nombre de participants</th>
                      <th>Montant initial</th>
                      <th>Remise</th>
                      <th>Montant à payer</th>
                      <th>Montant reçu</th>
                      <th>Reste à payer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistiques.servicePublics && statistiques.servicePublics.length > 0 ? (
                      statistiques.servicePublics.map((sp) => (
                        <tr key={sp.id}>
                          <td>{sp.description}</td>
                          <td>{sp.region}</td>
                          <td>
                            <span className="badge bg-info">{sp.nombrePersonnes || 0}</span>
                          </td>
                          <td>{sp.nombreActivites}</td>
                          <td>{sp.nombreParticipants}</td>
                          <td>
                            {(sp.montantInitial || sp.montantAPayer).toLocaleString()} Ar
                            {sp.remiseAppliquee > 0 && (
                              <span className="d-block small text-muted">
                                Sans remise
                              </span>
                            )}
                          </td>
                          <td>
                            {(sp.remiseAppliquee || 0).toLocaleString()} Ar
                            {sp.remiseAppliquee > 0 && sp.remisesDetails && (
                              <div className="mt-1">
                                {sp.remisesDetails.map((remise, idx) => (
                                  <span key={idx} className="badge bg-warning text-dark me-1 mb-1">
                                    {remise.pourcentage}% ({remise.nbParticipants} pers.)
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            {sp.montantAPayer.toLocaleString()} Ar
                            {sp.remiseAppliquee > 0 && (
                              <span className="d-block small text-success">
                                Après remise
                              </span>
                            )}
                          </td>
                          <td className="text-success">{sp.montantRecu.toLocaleString()} Ar</td>
                          <td className="text-danger">{sp.resteAPayer.toLocaleString()} Ar</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-3">
                          <div className="alert alert-warning mb-0">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Aucune donnée disponible pour la période sélectionnée.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="table-secondary fw-bold">
                    <tr>
                      <td colSpan="2">Total</td>
                      <td>
                        {statistiques.servicePublics ? statistiques.servicePublics.reduce((sum, sp) => sum + (sp.nombrePersonnes || 0), 0) : '0'}
                      </td>
                      <td>{statistiques.totaux ? statistiques.totaux.nombreActivites : '0'}</td>
                      <td>{statistiques.totaux ? statistiques.totaux.nombreParticipants : '0'}</td>
                      <td>{statistiques.totaux ? (statistiques.totaux.montantInitial || statistiques.totaux.montantAPayer).toLocaleString() : '0'} Ar</td>
                      <td>{statistiques.totaux ? (statistiques.totaux.remiseAppliquee || 0).toLocaleString() : '0'} Ar</td>
                      <td>{statistiques.totaux ? statistiques.totaux.montantAPayer.toLocaleString() : '0'} Ar</td>
                      <td className="text-success">{statistiques.totaux ? statistiques.totaux.montantRecu.toLocaleString() : '0'} Ar</td>
                      <td className="text-danger">{statistiques.totaux ? statistiques.totaux.resteAPayer.toLocaleString() : '0'} Ar</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          
          {/* Tableau des activités détaillées par sp */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Détail des Activités par sp</h5>
              <p className="card-text text-muted">Ce tableau montre le détail des activités pour chaque sp.</p>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-info">
                    <tr>
                      <th>sp</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Priorité</th>
                      <th>Cotisation</th>
                      <th>Nombre de participants</th>
                      <th>Montant initial</th>
                      <th>Remise</th>
                      <th>Montant à payer</th>
                      <th>Montant reçu</th>
                      <th>Reste à payer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistiques.activitesParSP && statistiques.activitesParSP.length > 0 ? (
                      statistiques.activitesParSP.map((activite) => (
                        <tr key={activite.id}>
                          <td>{activite.spDescription || activite.servicePublic}</td>
                          <td>{new Date(activite.date).toLocaleDateString()}</td>
                          <td>{activite.description}</td>
                          <td>
                            <span className={`badge bg-${getPriorityColor(activite.priorite)}`}>
                              {activite.priorite}/10
                            </span>
                          </td>
                          <td>{activite.cotisation.toLocaleString()} Ar</td>
                          <td>{activite.nombreParticipants}</td>
                          <td>
                            {(activite.montantInitial || (activite.cotisation * activite.nombreParticipants)).toLocaleString()} Ar
                            {(activite.remiseAppliquee > 0 || (activite.montantInitial && activite.montantInitial !== activite.montantAPayer)) && (
                              <span className="d-block small text-muted">
                                Sans remise
                              </span>
                            )}
                          </td>
                          <td>
                            {(activite.remiseAppliquee || 0).toLocaleString()} Ar
                            {activite.remiseAppliquee > 0 && activite.remisesDetails && (
                              <div className="mt-1">
                                {activite.remisesDetails.map((remise, idx) => (
                                  <span key={idx} className="badge bg-warning text-dark me-1 mb-1">
                                    {remise.pourcentage}% ({remise.nbParticipants} pers.)
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            {activite.montantAPayer.toLocaleString()} Ar
                            {(activite.remiseAppliquee > 0 || (activite.montantInitial && activite.montantInitial !== activite.montantAPayer)) && (
                              <span className="d-block small text-success">
                                Après remise
                              </span>
                            )}
                          </td>
                          <td className="text-success">{activite.montantRecu.toLocaleString()} Ar</td>
                          <td className="text-danger">{activite.resteAPayer.toLocaleString()} Ar</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center py-3">
                          <div className="alert alert-warning mb-0">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Aucune activité disponible pour la période sélectionnée.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Fonction utilitaire pour déterminer la couleur en fonction de la priorité
const getPriorityColor = (priority) => {
  if (priority >= 8) return 'danger';
  if (priority >= 5) return 'warning';
  if (priority >= 3) return 'info';
  return 'success';
};

export default SituationActivitesSP;
