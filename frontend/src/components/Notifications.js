import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Bell, Trash2, CheckCircle, Filter, BarChart3, AlertTriangle, Clock, ExternalLink } from 'lucide-react';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    lu: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showStats, setShowStats] = useState(false);

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });
      
      const response = await api.get(`/notifications?${params}`);
      setNotifications(response.data.data);
      setCurrentPage(response.data.current_page);
      setTotalPages(response.data.last_page);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des notifications.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/notifications/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques');
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, lu: true, date_lecture: new Date().toISOString() } : n
        )
      );
      fetchStats(); // Mettre à jour les statistiques
    } catch (err) {
      console.error(err);
      alert("Impossible de marquer la notification comme lue.");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(n => ({ ...n, lu: true, date_lecture: new Date().toISOString() }))
      );
      fetchStats();
      alert('Toutes les notifications ont été marquées comme lues');
    } catch (err) {
      console.error(err);
      alert("Impossible de marquer toutes les notifications comme lues.");
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      return;
    }
    
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchStats();
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer la notification.");
    }
  };

  const deleteReadNotifications = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications lues ?')) {
      return;
    }
    
    try {
      await api.delete('/notifications/delete-read');
      setNotifications(prev => prev.filter(n => !n.lu));
      fetchStats();
      alert('Toutes les notifications lues ont été supprimées');
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer les notifications lues.");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-500 bg-gray-100',
      medium: 'text-blue-500 bg-blue-100',
      high: 'text-orange-500 bg-orange-100',
      urgent: 'text-red-500 bg-red-100'
    };
    return colors[priority] || 'text-gray-500 bg-gray-100';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent') return <AlertTriangle size={16} />;
    if (priority === 'high') return <Clock size={16} />;
    return <Bell size={16} />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchNotifications(currentPage);
    fetchStats();
  }, [filters, currentPage]);

  if (loading && notifications.length === 0) {
    return <p className="text-center text-white">Chargement des notifications...</p>;
  }
  
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 text-white font-sans">
      {/* En-tête avec titre et statistiques */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Bell className="text-blue-500" size={32} />
          Mes Notifications
        </h2>
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          <BarChart3 size={18} />
          {showStats ? 'Masquer' : 'Statistiques'}
        </button>
      </div>

      {/* Panneau de statistiques */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 p-6 bg-[#1e293b] rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.total || 0}</div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.unread || 0}</div>
            <div className="text-sm text-gray-400">Non lues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{stats.urgent || 0}</div>
            <div className="text-sm text-gray-400">Urgentes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.today || 0}</div>
            <div className="text-sm text-gray-400">Aujourd'hui</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.this_week || 0}</div>
            <div className="text-sm text-gray-400">Cette semaine</div>
          </div>
        </div>
      )}

      {/* Filtres et actions */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-[#1e293b] rounded-lg">
        <div className="flex items-center gap-2">
          <Filter size={18} />
          <span className="text-sm font-medium">Filtres:</span>
        </div>
        
        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="px-3 py-1 bg-[#0f172a] border border-gray-600 rounded text-sm"
        >
          <option value="">Toutes priorités</option>
          <option value="urgent">Urgente</option>
          <option value="high">Élevée</option>
          <option value="medium">Moyenne</option>
          <option value="low">Faible</option>
        </select>

        <select
          value={filters.lu}
          onChange={(e) => handleFilterChange('lu', e.target.value)}
          className="px-3 py-1 bg-[#0f172a] border border-gray-600 rounded text-sm"
        >
          <option value="">Toutes</option>
          <option value="false">Non lues</option>
          <option value="true">Lues</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="px-3 py-1 bg-[#0f172a] border border-gray-600 rounded text-sm"
        >
          <option value="">Tous types</option>
          <option value="nouvelle_course">Nouvelle course</option>
          <option value="course_acceptee">Course acceptée</option>
          <option value="course_terminee">Course terminée</option>
          <option value="course_annulee">Course annulée</option>
          <option value="paiement">Paiement</option>
          <option value="urgence">Urgence</option>
        </select>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition"
          >
            <CheckCircle size={16} />
            Tout marquer lu
          </button>
          <button
            onClick={deleteReadNotifications}
            className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition"
          >
            <Trash2 size={16} />
            Supprimer lues
          </button>
        </div>
      </div>

      {/* Liste des notifications */}
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-gray-400 text-lg">Aucune notification pour le moment.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-6 rounded-lg shadow-lg transition-all border-l-4 ${
                  notification.lu 
                    ? 'bg-[#1e293b] border-l-gray-500' 
                    : 'bg-[#1e293b] border-l-blue-500 ring-1 ring-blue-500/20'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                      {getPriorityIcon(notification.priority)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-white">
                        {notification.titre}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                          {notification.priority?.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {notification.type?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {formatDate(notification.date_envoi || notification.created_at)}
                    </span>
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {notification.message && (
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {notification.message}
                  </p>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {!notification.lu && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition"
                      >
                        <CheckCircle size={16} />
                        Marquer comme lue
                      </button>
                    )}
                    {notification.action_url && (
                      <a
                        href={notification.action_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition"
                      >
                        <ExternalLink size={16} />
                        Action
                      </a>
                    )}
                  </div>
                  
                  {notification.lu && notification.date_lecture && (
                    <span className="text-xs text-gray-500">
                      Lu le {formatDate(notification.date_lecture)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition"
              >
                Précédent
              </button>
              
              <span className="text-gray-400">
                Page {currentPage} sur {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Notifications;
