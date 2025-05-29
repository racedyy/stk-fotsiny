import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Notification.css';

/**
 * Composant de notification pour afficher des messages à l'utilisateur
 * @param {Object} props - Propriétés du composant
 * @param {string} props.type - Type de notification ('success', 'error', 'info', 'warning')
 * @param {string} props.message - Message à afficher
 * @param {number} props.duration - Durée d'affichage en millisecondes (par défaut: 5000ms)
 * @param {function} props.onClose - Fonction appelée à la fermeture de la notification
 */
const Notification = ({ type = 'info', message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, message]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // Durée de l'animation de sortie
  };

  if (!isVisible || !message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <span className="text-success">✓</span>;
      case 'error':
        return <span className="text-danger">✗</span>;
      case 'warning':
        return <span className="text-warning">⚠</span>;
      case 'info':
      default:
        return <span className="text-info">ℹ</span>;
    }
  };

  const notificationElement = (
    <div className={`notification-container ${isExiting ? 'exit' : ''}`}>
      <div className={`notification notification-${type}`}>
        <div className="notification-icon">
          {getIcon()}
        </div>
        <div className="notification-content">
          <p>{message}</p>
        </div>
        <button className="notification-close" onClick={handleClose}>
          <span>&times;</span>
        </button>
      </div>
    </div>
  );

  return createPortal(notificationElement, document.body);
};

export default Notification;
