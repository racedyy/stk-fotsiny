import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h3 className="sidebar-title">STK</h3>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {collapsed ? '→' : '←'}
        </button>
      </div>
      
      <div className="sidebar-menu">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="bi bi-speedometer2"></i>
          <span>Tableau de bord</span>
        </NavLink>
        
        <NavLink to="/personnes" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="bi bi-people"></i>
          <span>Personnes</span>
        </NavLink>
        
        <NavLink to="/membres" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="bi bi-person-badge"></i>
          <span>Membres</span>
        </NavLink>
        
        <NavLink to="/activites" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="bi bi-calendar-event"></i>
          <span>Activités</span>
        </NavLink>
        
        <NavLink to="/sp" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="bi bi-building"></i>
          <span>sp</span>
        </NavLink>
        
        <NavLink to="/paiements" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="bi bi-cash-coin"></i>
          <span>Paiements</span>
        </NavLink>
        
        <NavLink to="/remises" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="bi bi-percent"></i>
          <span>Remises</span>
        </NavLink>
        
        <NavLink to="/constantes" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="bi bi-gear"></i>
          <span>Paramètres</span>
        </NavLink>
        
        <NavLink to="/statistiques/situation-activites-membres" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="bi bi-calendar-event"></i>
          <span>Stats par activités</span>
        </NavLink>
        
        <NavLink to="/statistiques/situation-activites-personnes" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="bi bi-people"></i>
          <span>Stats par personnes</span>
        </NavLink>
        
        <NavLink to="/statistiques/situation-activites-sp" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="bi bi-building"></i>
          <span>Stats par SP</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
