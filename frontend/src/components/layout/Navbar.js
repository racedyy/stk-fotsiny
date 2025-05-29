import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">STK</Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Tableau de bord
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/personnes">
                Personnes
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/membres">
                Membres
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/activites">
                Activités
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/sp">
                sp
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/constantes">
                Paramètres
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
