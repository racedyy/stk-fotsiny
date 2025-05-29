import React, { useState, useEffect } from 'react';
import statistiqueService from '../../services/statistique.service';
import spService from '../../services/sp.service';
import Spinner from '../../components/common/Spinner';
import { useNotification } from '../../contexts/NotificationContext';

const SituationActivitesMembres = () => {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(false);
  const [spList, setSpList] = useState([]);
  const [loadingSp, setLoadingSp] = useState(false);
  const [filtreSp, setFiltreSp] = useState('');
  const [filtreGlobal, setFiltreGlobal] = useState(false);
  const [activitesFiltered, setActivitesFiltered] = useState([]);
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
    
    // Charger la liste des SP
    loadSpList();
    
    // Charger automatiquement les statistiques avec les dates par défaut
    loadStatistiques(debutStr, finStr);
  }, []);
  
  // Charger la liste des SP
  const loadSpList = async () => {
    try {
      setLoadingSp(true);
      const data = await spService.getAllSP();
      setSpList(data);
      setLoadingSp(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des SP:', err);
      showError(err.response?.data?.error || 'Erreur lors de la récupération des SP. Veuillez réessayer plus tard.');
      setLoadingSp(false);
    }
  };
  
  // Fonction pour charger les statistiques
  const loadStatistiques = async (debut, fin) => {
    if (!debut || !fin) {
      showError('Veuillez sélectionner les dates de début et de fin');
      return;
    }
    
    try {
      setLoading(true);
      
      const data = await statistiqueService.getStatistiquesByDateRange(debut, fin);
      setStatistiques(data);
      
      // Initialiser les activités filtrées avec toutes les activités
      if (data && data.statistiquesParActivite) {
        setActivitesFiltered(data.statistiquesParActivite);
      }
      
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
  
  // Appliquer les filtres sur les activités
  useEffect(() => {
    if (statistiques && statistiques.statistiquesParActivite) {
      let filtered = [...statistiques.statistiquesParActivite];
      
      // Si le filtre global est activé, on affiche toutes les activités
      // Si désactivé, on applique le filtre par SP
      
      // Appliquer le filtre par SP seulement si le filtre global n'est pas activé
      if (!filtreGlobal && filtreSp !== '') {
        // Trouver le SP sélectionné
        const selectedSp = spList.find(sp => sp.id === parseInt(filtreSp));
        if (selectedSp) {
          filtered = filtered.filter(activite => 
            // Filtrer par région du SP
            activite.region === selectedSp.region
          );
        }
      }
      
      setActivitesFiltered(filtered);
    }
  }, [filtreGlobal, filtreSp, statistiques]);
  
  // Basculer le filtre global
  const toggleFiltreGlobal = () => {
    setFiltreGlobal(!filtreGlobal);
  };
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setFiltreGlobal(false);
    setFiltreSp('');
  };
  
  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Situation des Activités et Membres</h2>
      

      
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
          
          {/* Tableau des statistiques par région */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Statistiques par région</h5>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-primary">
                    <tr>
                      <th>Région</th>
                      <th>Nombre d'activités</th>
                      <th>Membres</th>
                      <th>Non-membres</th>
                      <th>Total présences</th>
                      <th>Montant initial</th>
                      <th>Remise</th>
                      <th>Montant à payer</th>
                      <th>Montant reçu</th>
                      <th>Reste à payer</th>
                      <th>Taux de recouvrement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistiques.statistiquesParRegion && statistiques.statistiquesParRegion.map((region, index) => {
                      const montantInitial = parseFloat(region.montantInitial || 0);
                      const remiseAppliquee = parseFloat(region.remiseAppliquee || 0);
                      const totalAPayer = parseFloat(region.totalAPayer || 0);
                      const totalPaye = parseFloat(region.totalPaye || 0);
                      const resteAPayer = Math.max(0, totalAPayer - totalPaye);
                      const tauxRecouvrement = totalAPayer > 0 ? (totalPaye / totalAPayer) * 100 : 0;
                      const hasRemises = remiseAppliquee > 0;
                      
                      return (
                        <tr key={index}>
                          <td>{region.region}</td>
                          <td>{region.nombre_activites}</td>
                          <td>
                            <span className="badge bg-primary">{region.nbMembres || 0}</span>
                          </td>
                          <td>
                            <span className="badge bg-secondary">{region.nbNonMembres || 0}</span>
                          </td>
                          <td>
                            <span className="badge bg-info">{region.nombre_presences}</span>
                          </td>
                          <td>
                            {montantInitial.toLocaleString()} Ar
                            {hasRemises && (
                              <span className="d-block small text-muted">
                                Sans remise
                              </span>
                            )}
                          </td>
                          <td>
                            {remiseAppliquee.toLocaleString()} Ar
                            {hasRemises && region.remisesDetails && (
                              <div className="mt-1">
                                {region.remisesDetails.map((remise, idx) => (
                                  <span key={idx} className="badge bg-warning text-dark me-1 mb-1">
                                    {remise.pourcentage}% ({remise.nbParticipants} pers.)
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            {totalAPayer.toLocaleString()} Ar
                            {hasRemises && (
                              <span className="d-block small text-success">
                                Après remise
                              </span>
                            )}
                          </td>
                          <td className="text-success">{totalPaye.toLocaleString()} Ar</td>
                          <td className="text-danger">{resteAPayer.toLocaleString()} Ar</td>
                          <td>
                            <div className="progress" style={{ height: '20px' }}>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: `${tauxRecouvrement}%` }}
                                aria-valuenow={tauxRecouvrement} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              >
                                {Math.round(tauxRecouvrement)}%
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Tableau des statistiques par activité */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Statistiques par activité</h5>
              
              {/* Filtres */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <button 
                    className={`btn ${filtreGlobal ? 'btn-success' : 'btn-outline-primary'}`}
                    type="button"
                    onClick={toggleFiltreGlobal}
                  >
                    <i className="bi bi-globe me-1"></i>
                    {filtreGlobal ? 'Global activé' : 'Global'}
                  </button>
                  <small className="text-muted ms-2">
                    (Affiche toutes les activités, même inactives)
                  </small>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={filtreSp}
                    onChange={(e) => setFiltreSp(e.target.value)}
                  >
                    <option value="">Tous les SP</option>
                    {spList.map(sp => (
                      <option key={sp.id} value={sp.id}>
                        {sp.description} ({sp.region})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={resetFilters}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Réinitialiser les filtres
                  </button>
                </div>
              </div>
              
              {/* Afficher le nombre de résultats */}
              <div className="alert alert-info">
                <strong>{activitesFiltered.length}</strong> activités trouvées
                {(filtreGlobal || filtreSp) && " (filtrées)"}
                {filtreGlobal && <>
                  <br/>
                  <small>Filtre global actif : Affichage de toutes les activités</small>
                </>}
              </div>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-primary">
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Région</th>
                      <th>Cotisation</th>
                      <th>Membres</th>
                      <th>Non-membres</th>
                      <th>Total</th>
                      <th>Montant initial</th>
                      <th>Remise</th>
                      <th>Montant à payer</th>
                      <th>Montant reçu</th>
                      <th>Reste à payer</th>
                      <th>Taux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activitesFiltered.map((activite) => {
                      const cotisation = parseFloat(activite.cotisation || 0);
                      const nombreParticipants = parseInt(activite.nombre_participants || 0);
                      const montantInitial = parseFloat(activite.montantInitial || 0);
                      const remiseAppliquee = parseFloat(activite.remiseAppliquee || 0);
                      const totalAPayer = parseFloat(activite.totalAPayer || 0);
                      const totalPaye = parseFloat(activite.totalPaye || 0);
                      const resteAPayer = parseFloat(activite.resteAPayer || 0);
                      const tauxRecouvrement = totalAPayer > 0 ? (totalPaye / totalAPayer) * 100 : 0;
                      const hasRemises = remiseAppliquee > 0;
                      
                      return (
                        <tr key={activite.id}>
                          <td>{new Date(activite.daty).toLocaleDateString()}</td>
                          <td>{activite.description}</td>
                          <td>{activite.region}</td>
                          <td>{cotisation.toLocaleString()} Ar</td>
                          <td>
                            <span className="badge bg-primary">{activite.nbMembres || 0}</span>
                          </td>
                          <td>
                            <span className="badge bg-secondary">{activite.nbNonMembres || 0}</span>
                          </td>
                          <td>
                            <span className="badge bg-info">{nombreParticipants}</span>
                          </td>
                          <td>
                            {montantInitial.toLocaleString()} Ar
                            {hasRemises && (
                              <span className="d-block small text-muted">
                                Sans remise
                              </span>
                            )}
                          </td>
                          <td>
                            {remiseAppliquee.toLocaleString()} Ar
                            {hasRemises && activite.remisesDetails && (
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
                            {totalAPayer.toLocaleString()} Ar
                            {hasRemises && (
                              <span className="d-block small text-success">
                                Après remise
                              </span>
                            )}
                          </td>
                          <td className="text-success">{totalPaye.toLocaleString()} Ar</td>
                          <td className="text-danger">{resteAPayer.toLocaleString()} Ar</td>
                          <td>
                            <div className="progress" style={{ height: '20px' }}>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: `${tauxRecouvrement}%` }}
                                aria-valuenow={tauxRecouvrement} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              >
                                {Math.round(tauxRecouvrement)}%
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

export default SituationActivitesMembres;
