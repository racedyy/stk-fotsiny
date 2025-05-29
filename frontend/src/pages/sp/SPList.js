import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import spService from '../../services/sp.service';
import Spinner from '../../components/common/Spinner';
import { useNotification } from '../../contexts/NotificationContext';

const SPList = () => {
  const [sps, setSps] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSPs();
  }, []);

  const fetchSPs = async () => {
    try {
      setLoading(true);
      const data = await spService.getAllSP();
      setSps(data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des services publics:', err);
      showError('Erreur lors du chargement des services publics. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce sp ?')) {
      try {
        await spService.deleteSP(id);
        setSps(sps.filter(sp => sp.id !== id));
        showSuccess('sp supprimé avec succès');
      } catch (err) {
        console.error('Erreur lors de la suppression du sp:', err);
        showError('Erreur lors de la suppression du sp. Veuillez réessayer plus tard.');
      }
    }
  };

  const filteredSPs = sps.filter(sp => {
    return sp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sp.region.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return <Spinner text="Chargement des services publics..." />;

  return (
    <div className="sp-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Liste des services publics</h1>
        <Link to="/sp/new" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>Ajouter un sp
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
              placeholder="Rechercher un sp..."
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

      {filteredSPs.length === 0 ? (
        <div className="alert alert-info">
          Aucun sp trouvé.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Région</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSPs.map(sp => (
                <tr key={sp.id}>
                  <td>{sp.id}</td>
                  <td>{sp.description}</td>
                  <td>{sp.region}</td>
                  <td>
                    <div className="d-flex">
                      <Link to={`/sp/${sp.id}`} className="btn btn-sm btn-outline-info me-2">
                        <i className="bi bi-eye"></i>
                      </Link>
                      <Link to={`/sp/edit/${sp.id}`} className="btn btn-sm btn-outline-primary me-2">
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(sp.id)}
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

export default SPList;
