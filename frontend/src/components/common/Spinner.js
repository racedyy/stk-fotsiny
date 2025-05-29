import React from 'react';

const Spinner = ({ size, text }) => {
  return (
    <div className="text-center my-3">
      <div 
        className={`spinner-border text-primary ${size ? `spinner-border-${size}` : ''}`} 
        role="status"
      >
        <span className="visually-hidden">Chargement...</span>
      </div>
      {text && <p className="mt-2">{text}</p>}
    </div>
  );
};

Spinner.defaultProps = {
  text: 'Chargement...'
};

export default Spinner;
