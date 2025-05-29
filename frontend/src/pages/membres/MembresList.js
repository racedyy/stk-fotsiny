import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import membreService from '../../services/membre.service';
import Spinner from '../../components/common/Spinner';
import { useNotification } from '../../contexts/NotificationContext';

const MembresList = () => {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMembres();
  }, []);

  const fetchMembres = async () => {
    try {
      setLoading(true);
      const data = await membreService.getAllMembres();
      setMembres(data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des membres:', err);
      showError('Erreur lors du chargement des membres. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ? Cette action ne supprimera pas la personne de la base de données.')) {
      try {
        await membreService.deleteMembre(id);
        setMembres(membres.filter(membre => membre.id !== id));
        showSuccess('Membre supprimé avec succès');
      } catch (err) {
        console.error('Erreur lors de la suppression du membre:', err);
        showError('Erreur lors de la suppression du membre. Veuillez réessayer plus tard.');
      }
    }
  };

  const filteredMembres = membres.filter(membre => {
    const fullName = `${membre.nom} ${membre.prenom}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  if (loading) return <Spinner text="Chargement des membres..." />;

  return (
    <div className="membres-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Liste des membres</h1>
        <Link to="/membres/new" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>Ajouter un membre
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
              placeholder="Rechercher un membre..."
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

      {filteredMembres.length === 0 ? (
        <div className="alert alert-info">
          Aucun membre trouvé.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Date de naissance</th>
                <th>Date d'affiliation</th>
                <th>sp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembres.map(membre => (
                <tr key={membre.id}>
                  <td>{membre.id}</td>
                  <td>{membre.nom}</td>
                  <td>{membre.prenom}</td>
                  <td>{new Date(membre.dtn).toLocaleDateString()}</td>
                  <td>{new Date(membre.date_affiliation).toLocaleDateString()}</td>
                  <td>{membre.sp_description || '-'}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <Link 
                        to={`/membres/edit/${membre.id}`} 
                        className="btn btn-outline-primary"
                        title="Modifier"
                      >
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(membre.id)}
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
        </div>
      )}
    </div>
  );
};

export default MembresList;
