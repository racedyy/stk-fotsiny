import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import activiteService from '../../services/activite.service';
import spService from '../../services/sp.service';
import Spinner from '../../components/common/Spinner';
import { useNotification } from '../../contexts/NotificationContext';

const ActivitesList = () => {
  const [activites, setActivites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showError, showSuccess } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterPriorite, setFilterPriorite] = useState('');
  const [regions, setRegions] = useState([]);
  const [spList, setSpList] = useState([]);
  const [loadingSp, setLoadingSp] = useState(false);
  const [filtreSp, setFiltreSp] = useState('');
  const [filtreGlobal, setFiltreGlobal] = useState(false);

  useEffect(() => {
    fetchActivites();
    loadSpList();
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

  const fetchActivites = async () => {
    try {
      setLoading(true);
      // Utiliser la nouvelle méthode pour récupérer les activités avec les informations de paiement
      const data = await activiteService.getAllActivitesWithPayments();
      setActivites(data);
      
      // Extraire les régions uniques pour le filtre
      const uniqueRegions = [...new Set(data.map(activite => activite.region))];
      setRegions(uniqueRegions);
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des activités:', err);
      showError('Erreur lors du chargement des activités. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
      try {
        await activiteService.deleteActivite(id);
        setActivites(activites.filter(activite => activite.id !== id));
        showSuccess('Activité supprimée avec succès');
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'activité:', err);
        showError(err.response?.data?.error || 'Erreur lors de la suppression de l\'activité. Veuillez réessayer plus tard.');
      }
    }
  };

  const filteredActivites = activites.filter(activite => {
    const matchesSearch = activite.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = filterRegion === '' || activite.region === filterRegion;
    
    // Filtrage par priorité
    let matchesPriorite = true;
    if (filterPriorite !== '') {
      const prioriteRange = filterPriorite.split('-');
      if (prioriteRange.length === 2) {
        const minPriorite = parseInt(prioriteRange[0]);
        const maxPriorite = parseInt(prioriteRange[1]);
        matchesPriorite = activite.priorite >= minPriorite && activite.priorite <= maxPriorite;
      } else {
        matchesPriorite = activite.priorite === parseInt(filterPriorite);
      }
    }
    
    // Filtrage par SP
    let matchesSp = true;
    if (!filtreGlobal && filtreSp !== '') {
      // Trouver le SP sélectionné
      const selectedSp = spList.find(sp => sp.id === parseInt(filtreSp));
      if (selectedSp) {
        matchesSp = activite.region === selectedSp.region;
      }
    }
    
    return matchesSearch && matchesRegion && matchesPriorite && matchesSp;
  });

  // Trier les activités par date (les plus récentes en premier)
  const sortedActivites = [...filteredActivites].sort((a, b) => {
    return new Date(b.daty) - new Date(a.daty);
  });

  if (loading) return <Spinner text="Chargement des activités..." />;

  return (
    <div className="activites-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Liste des activités</h1>
        <Link to="/activites/new" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>Ajouter une activité
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher une activité..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
              >
                <option value="">Toutes les régions</option>
                {regions.map((region, index) => (
                  <option key={index} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filterPriorite}
                onChange={(e) => setFilterPriorite(e.target.value)}
              >
                <option value="">Toutes les priorités</option>
                <option value="1-3">Basse (1-3)</option>
                <option value="4-7">Moyenne (4-7)</option>
                <option value="8-10">Haute (8-10)</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
              </select>
            </div>
            <div className="col-md-2">
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
            <div className="col-md-2">
              <button 
                className={`btn ${filtreGlobal ? 'btn-success' : 'btn-outline-primary'} w-100`}
                type="button"
                onClick={() => setFiltreGlobal(!filtreGlobal)}
              >
                <i className="bi bi-globe me-1"></i>
                {filtreGlobal ? 'Global activé' : 'Global'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="alert alert-info mb-4">
        <strong>{sortedActivites.length}</strong> activités trouvées
        {(filtreGlobal || filtreSp || searchTerm || filterRegion || filterPriorite) && " (filtrées)"}
        {filtreGlobal && <>
          <br/>
          <small>Filtre global actif : Affichage de toutes les activités</small>
        </>}
      </div>
      
      {sortedActivites.length === 0 ? (
        <div className="alert alert-warning">
          Aucune activité trouvée.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Date</th>
                <th>Région</th>
                <th>Priorité</th>
                <th>Membres</th>
                <th>Non-membres</th>
                <th>Total</th>
                <th>Cotisation</th>
                <th>Remise</th>
                <th>Total payé</th>
                <th>Reste à payer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedActivites.map(activite => (
                <tr key={activite.id}>
                  <td>{activite.id}</td>
                  <td>{activite.description}</td>
                  <td>{new Date(activite.daty).toLocaleDateString()}</td>
                  <td>{activite.region}</td>
                  <td>
                    <span className={`badge bg-${getPriorityColor(activite.priorite)}`}>
                      {activite.priorite}/10
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-primary">{activite.nbMembres || 0}</span>
                  </td>
                  <td>
                    <span className="badge bg-secondary">{activite.nbNonMembres || 0}</span>
                  </td>
                  <td>
                    <span className="badge bg-info">{activite.nbTotalParticipants || 0}</span>
                  </td>
                  <td>
                    {activite.cotisation.toLocaleString()} Ar
                    {activite.pourcentageRemise > 0 && (
                      <span className="d-block small text-muted">
                        Montant initial
                      </span>
                    )}
                  </td>
                  <td>
                    {activite.pourcentageRemise > 0 ? (
                      <>
                        <span className="badge bg-warning text-dark">
                          {activite.pourcentageRemise}% ({activite.nbPersonnesPourRemise} pers.)
                        </span>
                        <span className="d-block small text-muted mt-1">
                          {Math.round(activite.cotisation * (activite.pourcentageRemise / 100)).toLocaleString()} Ar
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="text-success">{activite.totalPaye.toLocaleString()} Ar</td>
                  <td className="text-danger">
                    {activite.resteAPayer.toLocaleString()} Ar
                    {activite.pourcentageRemise > 0 && (
                      <span className="d-block small text-success">
                        Après remise
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex">
                      <Link to={`/activites/${activite.id}`} className="btn btn-sm btn-outline-info me-2">
                        <i className="bi bi-eye"></i>
                      </Link>
                      <Link to={`/activites/edit/${activite.id}`} className="btn btn-sm btn-outline-primary me-2">
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(activite.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
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

export default ActivitesList;
