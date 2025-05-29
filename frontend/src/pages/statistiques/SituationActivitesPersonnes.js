import React, { useState, useEffect } from 'react';
import statistiqueService from '../../services/statistique.service';
import Spinner from '../../components/common/Spinner';
import { useNotification } from '../../contexts/NotificationContext';

const SituationActivitesPersonnes = () => {
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
      
      const data = await statistiqueService.getStatistiquesPersonnes(debut, fin);
      
      // Calculer les montants pour les membres uniquement (sans les personnes tierces)
      if (data.membres && data.personnes) {
        // Créer un mapping des paiements par personne
        const paiementsParPersonne = {};
        data.personnes.forEach(personne => {
          if (personne.membreAccompagnateur) {
            const membreId = personne.membreAccompagnateur.id;
            if (!paiementsParPersonne[membreId]) {
              paiementsParPersonne[membreId] = [];
            }
            paiementsParPersonne[membreId].push({
              montantAPayer: personne.montantAPayer || 0,
              montantPaye: personne.montantPaye || 0
            });
          }
        });
        
        // Ajouter les montants des personnes tierces à chaque membre
        data.membres.forEach(membre => {
          membre.personnesTierces = paiementsParPersonne[membre.id] || [];
          membre.montantPersonnesTiercesAPayer = membre.personnesTierces.reduce((sum, p) => sum + p.montantAPayer, 0);
          membre.montantPersonnesTiercesPaye = membre.personnesTierces.reduce((sum, p) => sum + p.montantPaye, 0);
          
          // Calculer les montants pour le membre uniquement
          // Pour le montant à payer, nous devons utiliser le montant total à payer pour les activités du membre
          // Le backend nous fournit déjà ce montant dans membre.montantAPayer
          membre.montantMembreAPayer = membre.montantAPayer;
          
          // Pour le montant payé, nous utilisons le montant total reçu moins les paiements des personnes tierces
          membre.montantMembrePaye = membre.montantRecu - membre.montantPersonnesTiercesPaye;
          
          membre.montantMembreResteAPayer = Math.max(0, membre.montantMembreAPayer - membre.montantMembrePaye);
          
          console.log(`Membre ${membre.nom} ${membre.prenom}:`, {
            nombreActivites: membre.nombreActivites,
            montantAPayer: membre.montantAPayer,
            montantRecu: membre.montantRecu,
            montantPersonnesTiercesAPayer: membre.montantPersonnesTiercesAPayer,
            montantPersonnesTiercesPaye: membre.montantPersonnesTiercesPaye,
            montantMembreAPayer: membre.montantMembreAPayer,
            montantMembrePaye: membre.montantMembrePaye,
            montantMembreResteAPayer: membre.montantMembreResteAPayer
          });
        });
      }
      
      console.log('Données statistiques avec calculs pour membres uniquement:', data);
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
      <h2 className="mb-4">Situation des Activités par Personne</h2>
      

      
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
          {/* Tableau des statistiques par membre avec les personnes qu'ils ont amenées */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Statistiques par Membre (incluant les personnes amenées)</h5>
              <p className="card-text text-muted">Ce tableau montre les statistiques des membres et l'argent des personnes qu'ils ont amenées qui ont payé.</p>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-primary">
                    <tr>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Nombre d'activités</th>
                      <th>Activités</th>
                      <th>Personnes tierces</th>
                      <th>Montant initial</th>
                      <th>Remise</th>
                      <th>Montant à payer</th>
                      <th>Montant reçu</th>
                      <th>Reste à payer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistiques.membres && statistiques.membres.map((membre) => {
                      // Vérifier si des remises ont été appliquées
                      const hasRemises = membre.remisesAppliquees && membre.remisesAppliquees.length > 0;
                      
                      return (
                        <tr key={membre.id}>
                          <td>{membre.nom}</td>
                          <td>{membre.prenom}</td>
                          <td>{membre.nombreActivites}</td>
                          <td>
                            {statistiques.activitesParMembre && statistiques.activitesParMembre
                              .filter(act => act.membreId === membre.id)
                              .map(act => act.description)
                              .join(', ')}
                          </td>
                          <td>{membre.nombrePersonnesTierces}</td>
                          <td>
                            {membre.montantSansRemise ? membre.montantSansRemise.toLocaleString() : '0'} Ar
                            {hasRemises && (
                              <span className="d-block small text-muted">
                                Sans remise
                              </span>
                            )}
                          </td>
                          <td>
                            {membre.montantRemise ? membre.montantRemise.toLocaleString() : '0'} Ar
                            {hasRemises && (
                              <div className="mt-1">
                                {membre.remisesAppliquees.map((remise, index) => (
                                  <span key={index} className="badge bg-warning text-dark me-1 mb-1">
                                    {remise.pourcentage}% ({remise.nbParticipants} pers.)
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            {membre.montantAPayer.toLocaleString()} Ar
                            {hasRemises && (
                              <span className="d-block small text-success">
                                Après remise
                              </span>
                            )}
                          </td>
                          <td className="text-success">{membre.montantRecu.toLocaleString()} Ar</td>
                          <td className="text-danger">{membre.resteAPayer.toLocaleString()} Ar</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="table-secondary fw-bold">
                    <tr>
                      <td colSpan="2">Total</td>
                      <td>{statistiques.totaux.nombreActivites}</td>
                      <td></td>
                      <td>{statistiques.totaux.nombrePersonnesTierces}</td>
                      <td>
                        {statistiques.membres ? statistiques.membres.reduce((sum, membre) => sum + (membre.montantSansRemise || 0), 0).toLocaleString() : '0'} Ar
                      </td>
                      <td>
                        {statistiques.membres ? statistiques.membres.reduce((sum, membre) => sum + (membre.montantRemise || 0), 0).toLocaleString() : '0'} Ar
                      </td>
                      <td>{statistiques.totaux.montantAPayer.toLocaleString()} Ar</td>
                      <td className="text-success">{statistiques.totaux.montantRecu.toLocaleString()} Ar</td>
                      <td className="text-danger">{statistiques.totaux.resteAPayer.toLocaleString()} Ar</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          
          {/* Nouveau tableau des statistiques par membre uniquement */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Statistiques par Membre uniquement</h5>
              <p className="card-text text-muted">Ce tableau montre uniquement les statistiques des membres sans inclure les personnes qu'ils ont amenées.</p>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-success">
                    <tr>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Nombre d'activités</th>
                      <th>Activités</th>
                      <th>Prix moyen activité</th>
                      <th>Montant à payer</th>
                      <th>Montant payé</th>
                      <th>Reste à payer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistiques.membres && statistiques.membres.map((membre) => {
                      // Calculer le prix moyen des activités pour le membre uniquement
                      const prixMoyenActivite = membre.nombreActivites > 0 
                        ? Math.round(membre.montantMembreAPayer / membre.nombreActivites) 
                        : 0;
                      
                      return (
                        <tr key={`membre-only-${membre.id}`}>
                          <td>{membre.nom}</td>
                          <td>{membre.prenom}</td>
                          <td>{membre.nombreActivites}</td>
                          <td>
                            {statistiques.activitesParMembre && statistiques.activitesParMembre
                              .filter(act => act.membreId === membre.id)
                              .map(act => act.description)
                              .join(', ')}
                          </td>
                          <td>{prixMoyenActivite.toLocaleString()} Ar</td>
                          <td>{membre.montantMembreAPayer.toLocaleString()} Ar</td>
                          <td className="text-success">{membre.montantMembrePaye.toLocaleString()} Ar</td>
                          <td className="text-danger">{membre.montantMembreResteAPayer.toLocaleString()} Ar</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="table-secondary fw-bold">
                    <tr>
                      <td colSpan="2">Total Membres uniquement</td>
                      <td>{statistiques.totaux.nombreActivites}</td>
                      <td></td>
                      <td>
                        {statistiques.membres && statistiques.totaux.nombreActivites > 0 
                          ? Math.round(statistiques.membres.reduce((sum, membre) => sum + membre.montantMembreAPayer, 0) / statistiques.totaux.nombreActivites).toLocaleString()
                          : '0'} Ar
                      </td>
                      <td>
                        {statistiques.membres ? statistiques.membres.reduce((sum, membre) => sum + membre.montantMembreAPayer, 0).toLocaleString() : '0'} Ar
                      </td>
                      <td className="text-success">
                        {statistiques.membres ? statistiques.membres.reduce((sum, membre) => sum + membre.montantMembrePaye, 0).toLocaleString() : '0'} Ar
                      </td>
                      <td className="text-danger">
                        {statistiques.membres ? statistiques.membres.reduce((sum, membre) => sum + membre.montantMembreResteAPayer, 0).toLocaleString() : '0'} Ar
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          

          
          {/* Tableau des statistiques par personne uniquement */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Statistiques par Personne</h5>
              <p className="card-text text-muted">Ce tableau montre uniquement les statistiques des personnes non-membres.</p>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-info">
                    <tr>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Nombre d'activités</th>
                      <th>Membre accompagnateur</th>
                      <th>Montant à payer</th>
                      <th>Montant payé</th>
                      <th>Reste à payer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistiques.personnes && statistiques.personnes.length > 0 ? (
                      statistiques.personnes.map((personne) => (
                        <tr key={personne.id}>
                          <td>{personne.nom}</td>
                          <td>{personne.prenom}</td>
                          <td>{personne.nombreActivites}</td>
                          <td>{personne.membreAccompagnateur ? `${personne.membreAccompagnateur.nom} ${personne.membreAccompagnateur.prenom}` : 'N/A'}</td>
                          <td>{personne.montantAPayer.toLocaleString()} Ar</td>
                          <td className="text-success">{personne.montantPaye.toLocaleString()} Ar</td>
                          <td className="text-danger">{personne.resteAPayer.toLocaleString()} Ar</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-3">
                          <div className="alert alert-warning mb-0">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Les données des personnes ne sont pas disponibles. Le backend doit être mis à jour pour fournir ces informations.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="table-secondary fw-bold">
                    <tr>
                      <td colSpan="3">Total</td>
                      <td></td>
                      <td>{statistiques.totauxPersonnes ? statistiques.totauxPersonnes.montantAPayer.toLocaleString() : '0'} Ar</td>
                      <td className="text-success">{statistiques.totauxPersonnes ? statistiques.totauxPersonnes.montantPaye.toLocaleString() : '0'} Ar</td>
                      <td className="text-danger">{statistiques.totauxPersonnes ? statistiques.totauxPersonnes.resteAPayer.toLocaleString() : '0'} Ar</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SituationActivitesPersonnes;
