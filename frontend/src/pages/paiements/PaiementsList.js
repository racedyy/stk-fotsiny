import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import paiementService from '../../services/paiement.service';
import { useNotification } from '../../contexts/NotificationContext';
import './PaiementsList.css';

const PaiementsList = () => {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchPaiements();
  }, []);

  const fetchPaiements = async () => {
    try {
      setLoading(true);
      const data = await paiementService.getAllPaiements();
      setPaiements(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      showError('Erreur lors du chargement des paiements');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      try {
        await paiementService.deletePaiement(id);
        setPaiements(paiements.filter(paiement => paiement.id !== id));
        showSuccess('Paiement supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression du paiement:', error);
        showError('Erreur lors de la suppression du paiement');
      }
    }
  };

  const filteredPaiements = paiements.filter(paiement => {
    const searchString = searchTerm.toLowerCase();
    return (
      paiement.nom?.toLowerCase().includes(searchString) ||
      paiement.prenom?.toLowerCase().includes(searchString) ||
      paiement.activite_description?.toLowerCase().includes(searchString) ||
      paiement.montant?.toString().includes(searchString)
    );
  });

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
    <div className="paiements-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Liste des paiements</h1>
        <Link to="/paiements/new" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>Ajouter un paiement
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher un paiement..."
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
      </div>

      {filteredPaiements.length === 0 ? (
        <div className="alert alert-info">
          Aucun paiement trouvé.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Activité</th>
                <th>Personne</th>
                <th>Statut</th>
                <th>Montant</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaiements.map(paiement => (
                <tr key={paiement.id}>
                  <td>{paiement.id}</td>
                  <td>{new Date(paiement.daty).toLocaleDateString()}</td>
                  <td>
                    {paiement.activite_description} 
                    <br />
                    <small className="text-muted">
                      {new Date(paiement.activite_date).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    {paiement.nom} {paiement.prenom}
                  </td>
                  <td>
                    <span className={`badge ${paiement.est_membre ? 'bg-primary' : 'bg-secondary'}`}>
                      {paiement.est_membre ? 'Membre' : 'Non-membre'}
                    </span>
                  </td>
                  <td className="text-end">
                    {parseFloat(paiement.montant).toFixed(2)} €
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <Link 
                        to={`/paiements/edit/${paiement.id}`} 
                        className="btn btn-outline-primary"
                        title="Modifier"
                      >
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(paiement.id)}
                        title="Supprimer"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-info">
                <td colSpan="5" className="text-end fw-bold">Total:</td>
                <td className="text-end fw-bold">
                  {filteredPaiements
                    .reduce((total, paiement) => total + parseFloat(paiement.montant), 0)
                    .toFixed(2)} €
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaiementsList;
