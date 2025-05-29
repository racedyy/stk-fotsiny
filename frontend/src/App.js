import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Contexte de notification
import { NotificationProvider } from './contexts/NotificationContext';

// Composants de mise en page
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';

// Pages
import Dashboard from './pages/Dashboard';
import PersonnesList from './pages/personnes/PersonnesList';
import PersonneForm from './pages/personnes/PersonneForm';
import MembresList from './pages/membres/MembresList';
import MembreForm from './pages/membres/MembreForm';
import ActivitesList from './pages/activites/ActivitesList';
import ActiviteForm from './pages/activites/ActiviteForm';
import ActiviteDetails from './pages/activites/ActiviteDetails';
import SPList from './pages/sp/SPList';
import SPForm from './pages/sp/SPForm';
import SPDetails from './pages/sp/SPDetails';
import ConstanteForm from './pages/constantes/ConstanteForm';
import SituationActivitesMembres from './pages/statistiques/SituationActivitesMembres';
import SituationActivitesPersonnes from './pages/statistiques/SituationActivitesPersonnes';
import SituationActivitesSP from './pages/statistiques/SituationActivitesSP';
import PaiementsList from './pages/paiements/PaiementsList';
import PaiementForm from './pages/paiements/PaiementForm';
import RemisesList from './pages/remises/RemisesList';
import RemiseForm from './pages/remises/RemiseForm';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="app-container">
          <Sidebar />
          <div className="content-container">
            <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              
              <Route path="/personnes" element={<PersonnesList />} />
              <Route path="/personnes/new" element={<PersonneForm />} />
              <Route path="/personnes/edit/:id" element={<PersonneForm />} />
              
              <Route path="/membres" element={<MembresList />} />
              <Route path="/membres/new" element={<MembreForm />} />
              <Route path="/membres/edit/:id" element={<MembreForm />} />
              
              <Route path="/activites" element={<ActivitesList />} />
              <Route path="/activites/new" element={<ActiviteForm />} />
              <Route path="/activites/edit/:id" element={<ActiviteForm />} />
              <Route path="/activites/:id" element={<ActiviteDetails />} />
              
              <Route path="/sp" element={<SPList />} />
              <Route path="/sp/new" element={<SPForm />} />
              <Route path="/sp/edit/:id" element={<SPForm />} />
              <Route path="/sp/:id" element={<SPDetails />} />
              
              <Route path="/constantes" element={<ConstanteForm />} />
              
              <Route path="/paiements" element={<PaiementsList />} />
              <Route path="/paiements/new" element={<PaiementForm />} />
              <Route path="/paiements/edit/:id" element={<PaiementForm />} />
              
              <Route path="/remises" element={<RemisesList />} />
              <Route path="/remises/new" element={<RemiseForm />} />
              <Route path="/remises/edit/:id" element={<RemiseForm />} />
              
              <Route path="/statistiques/situation-activites-membres" element={<SituationActivitesMembres />} />
              <Route path="/statistiques/situation-activites-personnes" element={<SituationActivitesPersonnes />} />
              <Route path="/statistiques/situation-activites-sp" element={<SituationActivitesSP />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </main>
            <Footer />
          </div>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;
