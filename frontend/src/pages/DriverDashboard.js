import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import api from '../api/axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix pour les icônes Leaflet
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function DriverDashboard() {
  const { user } = useContext(AuthContext);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [position, setPosition] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  // Récupérer le profil chauffeur de l'utilisateur connecté
  useEffect(() => {
    const fetchDriverProfile = async () => {
      try {
        setLoading(true);
        
        // First try to get from localStorage
        const storedDriverProfile = localStorage.getItem('driverProfile');
        if (storedDriverProfile) {
          const driverData = JSON.parse(storedDriverProfile);
          setDriverProfile(driverData);
          setIsOnline(driverData.status === 'EN_LIGNE');
          setLoading(false);
          return;
        }
        
        // If not in localStorage, fetch from API
        const res = await api.get('/drivers');
        console.log('Drivers API response:', res.data);
        
        // Handle both array and paginated response
        const driversArray = Array.isArray(res.data) ? res.data : res.data.data || [];
        
        if (!user || !user.id) {
          setError('Utilisateur non connecté');
          setLoading(false);
          return;
        }
        
        const driverData = driversArray.find(driver => driver.user_id === user.id);
        
        if (driverData) {
          setDriverProfile(driverData);
          setIsOnline(driverData.status === 'EN_LIGNE');
          // Store in localStorage for future use
          localStorage.setItem('driverProfile', JSON.stringify(driverData));
        } else {
          setError('Aucun profil chauffeur trouvé pour cet utilisateur');
        }
      } catch (err) {
        console.error('Erreur récupération profil chauffeur', err);
        setError('Erreur lors de la récupération du profil chauffeur');
      } finally {
        setLoading(false);
      }
    };

    fetchDriverProfile();
  }, [user]);

  // Gérer le changement de statut (en ligne/hors ligne)
  const toggleOnlineStatus = async () => {
    if (!driverProfile) return;

    try {
      const newStatus = isOnline ? 'HORS_LIGNE' : 'EN_LIGNE';
      
      await api.put(`/drivers/${driverProfile.id}`, {
        status: newStatus
      });
      
      setIsOnline(!isOnline);
      setDriverProfile({ ...driverProfile, status: newStatus });

      // Si le chauffeur se met en ligne, commencer à suivre sa position
      if (newStatus === 'EN_LIGNE') {
        startTracking();
      } else {
        stopTracking();
      }
    } catch (err) {
      console.error('Erreur lors du changement de statut', err);
      setError('Erreur lors du changement de statut');
    }
  };

  // Commencer à suivre la position
  const startTracking = () => {
    if (navigator.geolocation) {
      // Obtenir la position initiale
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });
          sendPositionToServer(latitude, longitude);
        },
        (err) => {
          console.error('Erreur de géolocalisation:', err);
          setError('Impossible d\'obtenir votre position');
        }
      );

      // Suivre la position en continu
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });
          sendPositionToServer(latitude, longitude);
        },
        (err) => {
          console.error('Erreur de suivi de position:', err);
        }
      );

      setWatchId(id);
    } else {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
    }
  };

  // Arrêter le suivi de position
  const stopTracking = () => {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // Envoyer la position au serveur
  const sendPositionToServer = async (latitude, longitude) => {
    if (!driverProfile) return;

    try {
      await api.post('/positions', {
        driver_profile_id: driverProfile.id,
        latitude,
        longitude,
        vitesse: 0, // À améliorer avec la vitesse réelle si disponible
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erreur d\'envoi de position:', err);
    }
  };

  // Nettoyer le suivi à la fermeture du composant
  useEffect(() => {
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  if (loading) {
    return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <p>Vous devez d'abord créer un profil chauffeur pour accéder à cette page.</p>
        <button 
          onClick={() => window.location.href = '/drivers'}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition"
        >
          Créer un profil chauffeur
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Tableau de bord Chauffeur</h1>
        
        {driverProfile && (
          <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Profil de {driverProfile.user?.name || 'Chauffeur'}</h2>
                <p className="text-gray-400">Licence: {driverProfile.license_number}</p>
                <p className="text-gray-400">Véhicule: {driverProfile.car_model} ({driverProfile.car_plate})</p>
              </div>
              
              <div className="flex flex-col items-end">
                <span className={`px-3 py-1 rounded-full text-sm font-medium mb-2 ${isOnline ? 'bg-green-600' : 'bg-red-600'}`}>
                  {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
                </span>
                
                <button 
                  onClick={toggleOnlineStatus}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${isOnline 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isOnline ? 'Se mettre hors ligne' : 'Se mettre en ligne'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Votre position actuelle</h2>
          
          {position ? (
            <div className="h-[400px] rounded-lg overflow-hidden">
              <MapContainer 
                center={[position.lat, position.lng]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[position.lat, position.lng]}>
                  <Popup>
                    Votre position actuelle
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <div className="bg-[#334155] h-[400px] rounded-lg flex items-center justify-center">
              <p className="text-gray-400">
                {isOnline 
                  ? 'Récupération de votre position...' 
                  : 'Mettez-vous en ligne pour activer le suivi de position'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DriverDashboard;