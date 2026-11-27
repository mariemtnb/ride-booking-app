import React, { useState, useEffect } from 'react';
import { X, Bell, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

const NotificationToast = ({ notification, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Progression de la barre
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    // Auto-fermeture
    const closeTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
      clearInterval(progressInterval);
    };
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const getIcon = (type, priority) => {
    if (priority === 'urgent') return <AlertTriangle className="text-red-400" size={20} />;
    
    switch (type) {
      case 'course_acceptee':
      case 'course_terminee':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'course_annulee':
        return <AlertTriangle className="text-red-400" size={20} />;
      case 'paiement':
        return <Info className="text-blue-400" size={20} />;
      case 'nouvelle_course':
        return <Clock className="text-yellow-400" size={20} />;
      default:
        return <Bell className="text-blue-400" size={20} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-900/20';
      case 'high': return 'border-l-orange-500 bg-orange-900/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-900/20';
      case 'low': return 'border-l-green-500 bg-green-900/20';
      default: return 'border-l-blue-500 bg-blue-900/20';
    }
  };

  if (!notification) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-96 max-w-sm transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`bg-[#1e293b] border-l-4 rounded-lg shadow-2xl overflow-hidden ${
          getPriorityColor(notification.priority)
        }`}
      >
        {/* Barre de progression */}
        <div className="h-1 bg-gray-700">
          <div
            className="h-full bg-blue-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              {getIcon(notification.type, notification.priority)}
              <div>
                <h4 className="font-semibold text-white text-sm">
                  {notification.titre}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    notification.priority === 'urgent' ? 'bg-red-600 text-white' :
                    notification.priority === 'high' ? 'bg-orange-600 text-white' :
                    notification.priority === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {notification.priority?.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {notification.type?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {notification.message && (
            <p className="text-gray-300 text-sm mb-3 leading-relaxed">
              {notification.message}
            </p>
          )}

          {notification.action_url && (
            <a
              href={notification.action_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs transition"
            >
              Voir détails
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;