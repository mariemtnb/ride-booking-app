import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    coursesCount: 0,
    driversCount: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);

  // Charger user depuis localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    try {
      if (!userData || userData === 'undefined') {
        navigate('/login');
        return;
      }
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (err) {
      console.error('Erreur de parsing userData :', err);
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

  // Charger stats depuis backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Vérifier si l'utilisateur est authentifié
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Aucun token trouvé, redirection vers login');
          navigate('/login');
          return;
        }
        
        try {
          const coursesRes = await api.get('/courses');
          console.log('Courses response:', coursesRes);
          
          const driversRes = await api.get('/drivers');
          console.log('Drivers response:', driversRes);
          
          const notificationsRes = await api.get('/notifications');
          console.log('Notifications response:', notificationsRes);
          
          // Gérer la pagination Laravel pour les notifications
          const notificationsData = notificationsRes.data.data || notificationsRes.data || [];
          
          setStats({
            coursesCount: coursesRes.data.length || 0,
            driversCount: driversRes.data.length || 0,
            unreadNotifications: Array.isArray(notificationsData) ? notificationsData.filter(n => !n.lu).length : 0,
          });
        } catch (apiError) {
          console.error('Erreur API spécifique:', apiError.response?.status, apiError.response?.data, apiError.message);
          if (apiError.response?.status === 401) {
            console.error('Session expirée, redirection vers login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Erreur générale chargement stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [navigate]);

  // Fonction pour créer des notifications de test
  const createTestNotification = async (priority = 'medium', type = 'info') => {
    try {
      const testNotifications = {
        urgent: {
          titre: '🚨 Notification Urgente',
          message: 'Ceci est une notification de test avec priorité urgente. Action immédiate requise!',
          type: 'urgence',
          priority: 'urgent',
          action_url: '/notifications'
        },
        medium: {
          titre: '📢 Notification Normale',
          message: 'Ceci est une notification de test avec priorité normale. Informations importantes.',
          type: 'info',
          priority: 'medium'
        },
        nouvelle_course: {
          titre: '🚗 Nouvelle Course Disponible',
          message: 'Une nouvelle course est disponible dans votre zone. Acceptez-la rapidement!',
          type: 'nouvelle_course',
          priority: 'high',
          action_url: '/courses'
        }
      };

      const notificationData = type === 'nouvelle_course' ? 
        testNotifications.nouvelle_course : 
        testNotifications[priority];

      const response = await api.post('/notifications', notificationData);
      
      if (response.status === 201) {
        console.log('Notification de test créée avec succès');
        // Actualiser les stats
        const notificationsRes = await api.get('/notifications');
        const notificationsData = notificationsRes.data.data || notificationsRes.data || [];
        setStats(prev => ({
          ...prev,
          unreadNotifications: Array.isArray(notificationsData) ? notificationsData.filter(n => !n.lu).length : 0
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la création de la notification de test:', error);
    }
  };

  if (!user) {
    return <p className="text-center text-white">Chargement...</p>;
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-white">
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Bienvenue, {user.name} 👋</h1>

        {loading ? (
          <p className="text-gray-400">Chargement des statistiques...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Courses" value={stats.coursesCount} />
            <StatCard title="Chauffeurs" value={stats.driversCount} />
            <StatCard title="Notifications non lues" value={stats.unreadNotifications} />
          </div>
        )}

        <section className="mt-10">
          <h3 className="text-2xl font-semibold mb-4">Accès rapides</h3>
          <div className="flex flex-wrap gap-4">
            <QuickBtn label="Mon Profil" onClick={() => navigate('/profile')} />
            <QuickBtn label="Gérer Chauffeurs" onClick={() => navigate('/drivers')} />
            <QuickBtn label="Gérer Courses" onClick={() => navigate('/courses')} />
            <QuickBtn label="Notifications" onClick={() => navigate('/notifications')} />
          </div>
        </section>

        <section className="mt-10">
          <h3 className="text-2xl font-semibold mb-4">Test du système de notifications</h3>
          <div className="flex flex-wrap gap-4">
            <QuickBtn 
              label="Créer notification urgente" 
              onClick={() => createTestNotification('urgent')} 
            />
            <QuickBtn 
              label="Créer notification normale" 
              onClick={() => createTestNotification('medium')} 
            />
            <QuickBtn 
              label="Créer notification course" 
              onClick={() => createTestNotification('high', 'nouvelle_course')} 
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-[#1e293b] p-6 rounded-xl shadow hover:shadow-lg transition duration-200">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function QuickBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-white shadow"
    >
      {label}
    </button>
  );
}

export default Home;
