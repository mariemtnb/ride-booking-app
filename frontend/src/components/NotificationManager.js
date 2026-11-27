import React, { useState, useEffect, useContext } from 'react';
import NotificationToast from './NotificationToast';
import { AuthContext } from '../auth/AuthContext';
import api from '../api/axios';

const NotificationManager = () => {
  const [toasts, setToasts] = useState([]);
  const { isLoggedIn } = useContext(AuthContext);
  const [lastNotificationId, setLastNotificationId] = useState(null);

  // Vérifier les nouvelles notifications toutes les 10 secondes
  useEffect(() => {
    if (!isLoggedIn) return;

    // Attendre un délai pour s'assurer que l'authentification est bien établie
    const initialDelay = setTimeout(() => {
      const checkNewNotifications = async () => {
      try {
        const response = await api.get('/notifications', {
          params: {
            page: 1,
            per_page: 5,
            lu: false // Seulement les non lues
          }
        });

        const notifications = response.data.data || response.data;
        
        if (notifications.length > 0) {
          const latestNotification = notifications[0];
          
          // Si c'est une nouvelle notification (différente de la dernière affichée)
          if (lastNotificationId !== latestNotification.id) {
            // Afficher seulement la plus récente
            showToast(latestNotification);
            setLastNotificationId(latestNotification.id);
          }
        }
        } catch (error) {
          console.error('Erreur lors de la vérification des nouvelles notifications:', error);
        }
      };

      // Vérification initiale
      checkNewNotifications();
      
      // Vérification périodique
      const interval = setInterval(checkNewNotifications, 10000);
      
      return () => clearInterval(interval);
    }, 1000); // Délai de 1 seconde pour s'assurer que l'auth est établie
    
    return () => clearTimeout(initialDelay);
  }, [isLoggedIn, lastNotificationId]);

  const showToast = (notification) => {
    const toastId = Date.now();
    const newToast = {
      id: toastId,
      notification,
      duration: getDurationByPriority(notification.priority)
    };

    setToasts(prev => {
      // Limiter à 3 toasts maximum
      const filtered = prev.slice(-2);
      return [...filtered, newToast];
    });
  };

  const getDurationByPriority = (priority) => {
    switch (priority) {
      case 'urgent': return 10000; // 10 secondes
      case 'high': return 7000;   // 7 secondes
      case 'medium': return 5000; // 5 secondes
      case 'low': return 4000;    // 4 secondes
      default: return 5000;       // 5 secondes par défaut
    }
  };

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 1000 - index
          }}
        >
          <NotificationToast
            notification={toast.notification}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationManager;