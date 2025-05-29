import React from 'react';

const Alert = ({ type, message, onClose }) => {
  if (!message) return null;
  
  // Convertir les sauts de ligne en balises <br>
  const formattedMessage = message.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < message.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
      {formattedMessage}
      {onClose && (
        <button 
          type="button" 
          className="btn-close" 
          onClick={onClose}
          aria-label="Close"
        ></button>
      )}
    </div>
  );
};

Alert.defaultProps = {
  type: 'info',
  onClose: null
};

export default Alert;
