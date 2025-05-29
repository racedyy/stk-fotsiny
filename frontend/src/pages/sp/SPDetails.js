import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import spService from '../../services/sp.service';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';

const SPDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [sp, setSp] = useState(null);
  const [activites, setActivites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('situation');
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    fetchSPDetails();
  }, [id]);
  
  const fetchSPDetails = async () => {
    try {
      setLoading(true);
      const spData = await spService.getSPById(id);
      setSp(spData);
      
      // Récupérer les activités liées à ce SP
      const activitesData = await spService.getActivitesBySP(id);
      setActivites(activitesData);
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des détails du SP:', err);
      setError('Erreur lors du chargement des détails du SP. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };
  
  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      // Tableau des mois en français
      const mois = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
      ];
      // Formatage manuel: jour mois année
      const jour = date.getDate().toString().padStart(2, '0');
      const moisNom = mois[date.getMonth()];
      const annee = date.getFullYear();
      return `${jour} ${moisNom} ${annee}`;
    } catch (error) {
      return dateString;
    }
  };
  
  if (loading) return <Spinner text="Chargement des détails du sp..." />;
  
  if (!sp) {
    return (
      <div className="alert alert-warning">
        sp non trouvé. <Link to="/sp">Retour à la liste</Link>
      </div>
    );
  }
  
  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Détails du sp</h2>
        <div>
          <Link to="/sp" className="btn btn-outline-secondary me-2">
            <i className="bi bi-arrow-left"></i> Retour
          </Link>
          <Link to={`/sp/edit/${id}`} className="btn btn-primary me-2">
            <i className="bi bi-pencil"></i> Modifier
          </Link>
        </div>
      </div>
      
      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}
      {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p className="card-text">
                <strong>Description:</strong> {sp.description}
              </p>
              <p className="card-text">
                <strong>Région:</strong> {sp.region}
              </p>
            </div>
            <div className="col-md-6">
              <p className="card-text">
                <strong>Activités:</strong> {activites.length} au total
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'situation' ? 'active' : ''}`}
                onClick={() => setActiveTab('situation')}
              >
                Situation
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'activites' ? 'active' : ''}`}
                onClick={() => setActiveTab('activites')}
              >
                Activités ({activites.length})
              </button>
            </li>
          </ul>
        </div>
        
        <div className="card-body">
          {activeTab === 'situation' && (
            <>
              <h5 className="card-title">Situation géographique</h5>
              <div className="row">
                <div className="col-md-12">
                  <div className="card bg-light mb-3">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-2 text-muted">Région</h6>
                      <p className="card-text fs-5">{sp.region}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <div className="card bg-light mb-3">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-2 text-muted">Description</h6>
                      <p className="card-text fs-5">{sp.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'activites' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Liste des activités</h5>
                <Link 
                  to={`/activites/new?region=${encodeURIComponent(sp.region)}`} 
                  className="btn btn-success btn-sm"
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Ajouter une activité
                </Link>
              </div>
              
              {activites.length === 0 ? (
                <div className="alert alert-info">
                  Aucune activité pour ce sp.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Date</th>
                        <th>Priorité</th>
                        <th>Cotisation</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activites.map(activite => (
                        <tr key={activite.id}>
                          <td>{activite.description}</td>
                          <td>{formatDate(activite.daty)}</td>
                          <td>
                            <span className={`badge bg-${getPriorityColor(activite.priorite)}`}>
                              {activite.priorite}/10
                            </span>
                          </td>
                          <td>{activite.cotisation.toLocaleString()} Ar</td>
                          <td>
                            <Link to={`/activites/${activite.id}`} className="btn btn-sm btn-info me-2">
                              <i className="bi bi-eye"></i>
                            </Link>
                            <Link to={`/activites/edit/${activite.id}`} className="btn btn-sm btn-primary me-2">
                              <i className="bi bi-pencil"></i>
                            </Link>
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
    </div>
  );
};

// Fonction pour déterminer la couleur de la priorité
const getPriorityColor = (priority) => {
  if (priority >= 8) return 'danger';
  if (priority >= 5) return 'warning';
  return 'success';
};

export default SPDetails;
