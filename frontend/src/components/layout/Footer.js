import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer>
      <p className="mb-0">
        &copy; {currentYear} STK - Application de Gestion d'Activités
      </p>
    </footer>
  );
};

export default Footer;
