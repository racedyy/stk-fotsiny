import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import personneService from '../../services/personne.service';
import Spinner from '../../components/common/Spinner';
import { useNotification } from '../../contexts/NotificationContext';

const PersonnesList = () => {
  const [personnes, setPersonnes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPersonnes();
  }, []);

  const fetchPersonnes = async () => {
    try {
      setLoading(true);
      const data = await personneService.getAllPersonnes();
      setPersonnes(data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des personnes:', err);
      showError('Erreur lors du chargement des personnes. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };

  const [personneToDelete, setPersonneToDelete] = useState(null);

  const confirmDelete = (personne) => {
    setPersonneToDelete(personne);
  };

  const handleDelete = async () => {
    if (!personneToDelete) return;
    
    try {
      await personneService.deletePersonne(personneToDelete.id);
      setPersonnes(personnes.filter(personne => personne.id !== personneToDelete.id));
      showSuccess(`${personneToDelete.nom} ${personneToDelete.prenom} a été supprimé(e) avec succès`);
      setPersonneToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression de la personne:', err);
      showError('Erreur lors de la suppression de la personne. Veuillez réessayer plus tard.');
    }
  };

  const cancelDelete = () => {
    setPersonneToDelete(null);
  };

  const filteredPersonnes = personnes.filter(personne => {
    const fullName = `${personne.nom} ${personne.prenom}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  if (loading) return <Spinner text="Chargement des personnes..." />;

  return (
    <div className="personnes-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Liste des personnes</h1>
        <Link to="/personnes/new" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>Ajouter une personne
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
              placeholder="Rechercher une personne..."
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

      {filteredPersonnes.length === 0 ? (
        <div className="alert alert-info">
          Aucune personne trouvée.
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
                <th>sp</th>
                <th>Région</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersonnes.map(personne => (
                <tr key={personne.id}>
                  <td>{personne.id}</td>
                  <td>{personne.nom}</td>
                  <td>{personne.prenom}</td>
                  <td>{new Date(personne.dtn).toLocaleDateString()}</td>
                  <td>{personne.sp_description || '-'}</td>
                  <td>{personne.sp_region || '-'}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <Link 
                        to={`/personnes/edit/${personne.id}`} 
                        className="btn btn-outline-primary"
                        title="Modifier"
                      >
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => confirmDelete(personne)}
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

export default PersonnesList;
