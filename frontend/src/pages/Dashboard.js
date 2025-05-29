import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import activiteService from '../services/activite.service';
import membreService from '../services/membre.service';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activites, setActivites] = useState([]);
  const [membres, setMembres] = useState([]);
  const [stats, setStats] = useState({
    totalActivites: 0,
    totalMembres: 0,
    prochainesActivites: 0,
    activitesParRegion: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données des activités et des membres
        const [activitesData, membresData] = await Promise.all([
          activiteService.getAllActivites(),
          membreService.getAllMembres()
        ]);
        
        setActivites(activitesData);
        setMembres(membresData);
        
        // Calculer les statistiques
        const today = new Date();
        const prochainesActivites = activitesData.filter(act => new Date(act.daty) >= today);
        
        // Regrouper les activités par région
        const activitesParRegion = activitesData.reduce((acc, act) => {
          acc[act.region] = (acc[act.region] || 0) + 1;
          return acc;
        }, {});
        
        setStats({
          totalActivites: activitesData.length,
          totalMembres: membresData.length,
          prochainesActivites: prochainesActivites.length,
          activitesParRegion
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des données. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Récupérer les 5 prochaines activités
  const prochainesActivites = [...activites]
    .filter(act => new Date(act.daty) >= new Date())
    .sort((a, b) => new Date(a.daty) - new Date(b.daty))
    .slice(0, 5);
  
  // Récupérer les 5 derniers membres inscrits
  const derniersMembres = [...membres]
    .sort((a, b) => new Date(b.date_affiliation) - new Date(a.date_affiliation))
    .slice(0, 5);

  if (loading) return <Spinner text="Chargement du tableau de bord..." />;

  return (
    <div className="dashboard">
      <div className="dashboard-header mb-4">
        <h1 className="dashboard-title">Tableau de bord</h1>
        <p className="dashboard-subtitle">Bienvenue dans le système de gestion d'activités STK</p>
      </div>
      
      {error && <Alert type="danger" message={error} />}
      
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="stat-card">
            <div className="stat-card-body">
              <div className="stat-card-icon">
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="stat-card-content">
                <h2 className="stat-card-number">{stats.totalMembres}</h2>
                <p className="stat-card-title">Membres</p>
                <Link to="/membres" className="stat-card-link">Voir tous les membres <i className="bi bi-arrow-right"></i></Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="stat-card">
            <div className="stat-card-body">
              <div className="stat-card-icon">
                <i className="bi bi-calendar-event-fill"></i>
              </div>
              <div className="stat-card-content">
                <h2 className="stat-card-number">{stats.totalActivites}</h2>
                <p className="stat-card-title">Activités</p>
                <Link to="/activites" className="stat-card-link">Voir toutes les activités <i className="bi bi-arrow-right"></i></Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="stat-card">
            <div className="stat-card-body">
              <div className="stat-card-icon">
                <i className="bi bi-calendar-check-fill"></i>
              </div>
              <div className="stat-card-content">
                <h2 className="stat-card-number">{stats.prochainesActivites}</h2>
                <p className="stat-card-title">Prochaines activités</p>
                <Link to="/activites" className="stat-card-link">Voir le calendrier <i className="bi bi-arrow-right"></i></Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="stat-card actions-card">
            <div className="stat-card-body">
              <h5 className="actions-title">Actions rapides</h5>
              <div className="d-grid gap-2">
                <Link to="/activites/new" className="btn btn-primary"><i className="bi bi-plus-circle me-2"></i>Nouvelle activité</Link>
                <Link to="/personnes/new" className="btn btn-outline-primary"><i className="bi bi-person-plus me-2"></i>Nouvelle personne</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card dashboard-card">
            <div className="card-header">
              <div className="d-flex align-items-center">
                <i className="bi bi-calendar-event me-2"></i>
                <h5 className="mb-0">Prochaines activités</h5>
              </div>
            </div>
            <div className="card-body">
              {prochainesActivites.length > 0 ? (
                <div className="activity-list">
                  {prochainesActivites.map(activite => (
                    <div key={activite.id} className="activity-item">
                      <div className="activity-date">
                        <span className="day">{new Date(activite.daty).getDate()}</span>
                        <span className="month">{new Date(activite.daty).toLocaleString('fr-FR', { month: 'short' })}</span>
                      </div>
                      <div className="activity-details">
                        <h6 className="activity-title">{activite.description}</h6>
                        <span className="activity-region">{activite.region}</span>
                      </div>
                      <div className="activity-action">
                        <Link to={`/activites/${activite.id}`} className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-eye"></i>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="bi bi-calendar-x"></i>
                  <p>Aucune activité à venir</p>
                </div>
              )}
              <div className="card-footer text-end">
                <Link to="/activites" className="btn btn-primary">
                  <i className="bi bi-calendar3 me-2"></i>Toutes les activités
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card dashboard-card">
            <div className="card-header">
              <div className="d-flex align-items-center">
                <i className="bi bi-people me-2"></i>
                <h5 className="mb-0">Derniers membres inscrits</h5>
              </div>
            </div>
            <div className="card-body">
              {derniersMembres.length > 0 ? (
                <div className="member-list">
                  {derniersMembres.map(membre => (
                    <div key={membre.id} className="member-item">
                      <div className="member-avatar">
                        <div className="avatar-placeholder">
                          {membre.nom.charAt(0)}{membre.prenom.charAt(0)}
                        </div>
                      </div>
                      <div className="member-details">
                        <h6 className="member-name">{membre.nom} {membre.prenom}</h6>
                        <span className="member-date">Inscrit le {new Date(membre.date_affiliation).toLocaleDateString()}</span>
                      </div>
                      <div className="member-action">
                        <Link to={`/membres/edit/${membre.id}`} className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-person"></i>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="bi bi-people-fill"></i>
                  <p>Aucun membre inscrit</p>
                </div>
              )}
              <div className="card-footer text-end">
                <Link to="/membres" className="btn btn-primary">
                  <i className="bi bi-people-fill me-2"></i>Tous les membres
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-12 mb-4">
          <div className="card dashboard-card">
            <div className="card-header">
              <div className="d-flex align-items-center">
                <i className="bi bi-geo-alt me-2"></i>
                <h5 className="mb-0">Activités par région</h5>
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                {Object.entries(stats.activitesParRegion).map(([region, count]) => (
                  <div key={region} className="col-md-3 mb-3">
                    <div className="region-card">
                      <div className="region-icon">
                        <i className="bi bi-geo"></i>
                      </div>
                      <div className="region-content">
                        <h5 className="region-name">{region}</h5>
                        <h3 className="region-count">{count}</h3>
                        <p className="region-text">activités</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
