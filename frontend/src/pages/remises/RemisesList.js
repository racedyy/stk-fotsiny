import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import remiseService from '../../services/remise.service';
import { useNotification } from '../../contexts/NotificationContext';

const RemisesList = () => {
  const [remises, setRemises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useNotification();

  // Charger les remises au chargement de la page
  useEffect(() => {
    loadRemises();
  }, []);

  // Fonction pour charger les remises
  const loadRemises = async () => {
    try {
      setLoading(true);
      const data = await remiseService.getAllRemises();
      setRemises(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des remises:', err);
      setError('Erreur lors du chargement des remises. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer une remise
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette remise ?')) {
      try {
        await remiseService.deleteRemise(id);
        showSuccess('Remise supprimée avec succès');
        loadRemises(); // Recharger la liste après suppression
      } catch (err) {
        console.error('Erreur lors de la suppression de la remise:', err);
        showError('Erreur lors de la suppression de la remise');
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2>Liste des Remises</h2>
          <Link to="/remises/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i> Nouvelle Remise
          </Link>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {remises.length === 0 ? (
            <div className="alert alert-info">
              Aucune remise n'a été trouvée. Cliquez sur "Nouvelle Remise" pour en créer une.
            </div>
          ) : (
            <table className="table table-striped table-bordered table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre de Personnes</th>
                  <th>Pourcentage</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {remises.map((remise) => (
                  <tr key={remise.id}>
                    <td>{remise.id}</td>
                    <td>{remise.nb_personnes}</td>
                    <td>{parseFloat(remise.pourcentage).toFixed(2)}%</td>
                    <td>{remise.description}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Link 
                          to={`/remises/edit/${remise.id}`} 
                          className="btn btn-warning"
                          title="Modifier"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDelete(remise.id)}
                          title="Supprimer"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemisesList;
