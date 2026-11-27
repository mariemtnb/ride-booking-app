import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import api from '../api/axios';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import {
  Power,
  PowerOff,
  Navigation,
  DollarSign,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle,
  XCircle,
  User,
  Car,
  History,
  Receipt,
  Settings,
  LogOut,
  AlertCircle,
  Navigation2
} from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 48.8566,
  lng: 2.3522
};

function DriverInterface() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [driverProfile, setDriverProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(defaultCenter);
  const [watchId, setWatchId] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [pendingRides, setPendingRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    todayEarnings: 0,
    todayRides: 0,
    rating: 0,
    totalRides: 0
  });

  // Récupérer le profil conducteur
  useEffect(() => {
    const fetchDriverProfile = async () => {
      try {
        // First check localStorage
        const storedProfile = localStorage.getItem('driverProfile');
        if (storedProfile) {
          const profileData = JSON.parse(storedProfile);
          setDriverProfile(profileData);
          setLoading(false);
          return;
        }
        
        // Check if user is available
        const storedUser = localStorage.getItem('user');
        const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);
        
        if (!currentUser || !currentUser.id) {
          setError('Utilisateur non connecté. Veuillez vous connecter.');
          setLoading(false);
          return;
        }
        
        // Fetch from API
        const res = await api.get('/drivers');
        console.log('Drivers response for interface:', res.data);
        
        // Handle both array and paginated response
        const driversArray = Array.isArray(res.data) ? res.data : res.data.data || [];
        const driverData = driversArray.find(driver => driver.user_id === currentUser.id);
        
        if (driverData) {
          setDriverProfile(driverData);
          localStorage.setItem('driverProfile', JSON.stringify(driverData));
        } else {
          setError('Aucun profil chauffeur trouvé. Veuillez créer un profil chauffeur d\'abord.');
        }
      } catch (err) {
        console.error('Erreur récupération profil conducteur', err);
        setError('Erreur lors de la récupération du profil conducteur: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDriverProfile();
    } else {
      setLoading(false);
      setError('Veuillez vous connecter d\'abord.');
    }
  }, [user]);

  // Récupérer les statistiques
  useEffect(() => {
    const fetchStats = async () => {
      if (!driverProfile) return;

      try {
        const response = await api.get(`/courses?driver_id=${driverProfile.id}`);
        const rides = response.data;
        
        const today = new Date().toDateString();
        const todayRides = rides.filter(ride => 
          new Date(ride.created_at).toDateString() === today
        );
        
        const completedRides = rides.filter(ride => ride.status === 'TERMINEE');
        const todayCompletedRides = todayRides.filter(ride => ride.status === 'TERMINEE');
        
        setStats({
          todayEarnings: todayCompletedRides.reduce((sum, ride) => sum + (ride.prix * 0.85 || 0), 0),
          todayRides: todayCompletedRides.length,
          rating: driverProfile.rating || 0,
          totalRides: completedRides.length
        });
      } catch (err) {
        console.error('Erreur récupération statistiques:', err);
      }
    };

    fetchStats();
  }, [driverProfile]);

  // Géolocalisation en temps réel
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      const fallback = async () => {
        const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (data && data.location) {
          const coords = { lat: data.location.lat, lng: data.location.lng };
          setCurrentPosition(coords);
          if (isOnline && driverProfile) {
            try {
              await api.post('/positions', {
                driver_profile_id: driverProfile.id,
                latitude: coords.lat,
                longitude: coords.lng,
                vitesse: 0,
                timestamp: new Date().toISOString()
              });
            } catch {}
          }
        } else {
          setError('La géolocalisation n\'est pas supportée par ce navigateur');
        }
      };
      fallback();
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    const successCallback = async (position) => {
      const newPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      setCurrentPosition(newPosition);
      
      // Envoyer la position au serveur si en ligne
      if (isOnline && driverProfile) {
        try {
          await api.post('/positions', {
            driver_profile_id: driverProfile.id,
            latitude: newPosition.lat,
            longitude: newPosition.lng,
            vitesse: position.coords.speed || 0,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error('Erreur envoi position:', err);
        }
      }
    };

    const errorCallback = async (error) => {
      setError('Erreur de géolocalisation: ' + error.message);
      try {
        const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (data && data.location) {
          const coords = { lat: data.location.lat, lng: data.location.lng };
          setCurrentPosition(coords);
          if (isOnline && driverProfile) {
            try {
              await api.post('/positions', {
                driver_profile_id: driverProfile.id,
                latitude: coords.lat,
                longitude: coords.lng,
                vitesse: 0,
                timestamp: new Date().toISOString()
              });
            } catch {}
          }
        }
      } catch {}
    };

    const id = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );
    
    setWatchId(id);
  }, [isOnline, driverProfile]);

  const stopLocationTracking = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Gestion du statut en ligne/hors ligne
  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      
      if (newStatus) {
        // Mettre en ligne
        startLocationTracking();
        await api.put(`/drivers/${driverProfile.id}`, {
          ...driverProfile,
          status: 'DISPONIBLE'
        });
      } else {
        // Mettre hors ligne
        stopLocationTracking();
        await api.put(`/drivers/${driverProfile.id}`, {
          ...driverProfile,
          status: 'INDISPONIBLE'
        });
      }
      
      setIsOnline(newStatus);
    } catch (err) {
      console.error('Erreur changement statut:', err);
      setError('Erreur lors du changement de statut');
    }
  };

  // Récupérer les courses en attente
  useEffect(() => {
    const fetchPendingRides = async () => {
      if (!isOnline || !driverProfile) return;

      try {
        const response = await api.get('/courses?status=EN_ATTENTE');
        setPendingRides(response.data);
      } catch (err) {
        console.error('Erreur récupération courses:', err);
      }
    };

    const interval = setInterval(fetchPendingRides, 5000); // Vérifier toutes les 5 secondes
    return () => clearInterval(interval);
  }, [isOnline, driverProfile]);

  // Accepter une course
  const acceptRide = async (rideId) => {
    try {
      await api.put(`/courses/${rideId}`, {
        status: 'ACCEPTEE',
        driver_id: driverProfile.id
      });
      
      // Récupérer les détails de la course
      const response = await api.get(`/courses/${rideId}`);
      setCurrentRide(response.data);
      setPendingRides(prev => prev.filter(ride => ride.id !== rideId));
    } catch (err) {
      console.error('Erreur acceptation course:', err);
      setError('Erreur lors de l\'acceptation de la course');
    }
  };

  // Refuser une course
  const declineRide = async (rideId) => {
    setPendingRides(prev => prev.filter(ride => ride.id !== rideId));
  };

  // Terminer une course
  const completeRide = async () => {
    if (!currentRide) return;

    try {
      await api.put(`/courses/${currentRide.id}`, {
        status: 'TERMINEE'
      });
      
      setCurrentRide(null);
      // Actualiser les statistiques
      window.location.reload();
    } catch (err) {
      console.error('Erreur fin de course:', err);
      setError('Erreur lors de la finalisation de la course');
    }
  };

  const handleLogout = () => {
    stopLocationTracking();
    localStorage.removeItem('driverProfile');
    logout();
    navigate('/driver-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Chargement de l'interface conducteur...</p>
        </div>
      </div>
    );
  }

  if (error && !driverProfile) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
        <div className="text-center text-white max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-bold mb-4">Erreur d'accès</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/drivers')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
            >
              Créer un profil chauffeur
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition"
            >
              Se reconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <div className="bg-[#1e293b] border-b border-[#334155] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Car size={24} className="text-blue-500" />
              <h1 className="text-xl font-bold">Interface Conducteur</h1>
            </div>
            
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/driver-history')}
              className="p-2 bg-[#334155] hover:bg-[#475569] rounded-lg transition"
              title="Historique"
            >
              <History size={20} />
            </button>
            
            <button
              onClick={() => navigate('/driver-receipts')}
              className="p-2 bg-[#334155] hover:bg-[#475569] rounded-lg transition"
              title="Reçus"
            >
              <Receipt size={20} />
            </button>
            
            <button
              onClick={handleLogout}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
              title="Déconnexion"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-[#1e293b] border-r border-[#334155] flex flex-col">
          {/* Profil conducteur */}
          <div className="p-4 border-b border-[#334155]">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold">{driverProfile?.user?.name}</h3>
                <p className="text-sm text-gray-400">{driverProfile?.car_model}</p>
                <p className="text-xs text-gray-500">{driverProfile?.car_plate}</p>
              </div>
            </div>
            
            {/* Bouton en ligne/hors ligne */}
            <button
              onClick={toggleOnlineStatus}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition ${
                isOnline 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isOnline ? <PowerOff size={20} /> : <Power size={20} />}
              <span>{isOnline ? 'Mettre hors ligne' : 'Mettre en ligne'}</span>
            </button>
          </div>

          {/* Statistiques */}
          <div className="p-4 border-b border-[#334155]">
            <h4 className="font-semibold mb-3">Statistiques du jour</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign size={16} className="text-green-400" />
                  <span className="text-sm">Gains</span>
                </div>
                <span className="font-medium text-green-400">{stats.todayEarnings.toFixed(2)} €</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Car size={16} className="text-blue-400" />
                  <span className="text-sm">Courses</span>
                </div>
                <span className="font-medium">{stats.todayRides}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm">Note</span>
                </div>
                <span className="font-medium">{stats.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Course actuelle */}
          {currentRide && (
            <div className="p-4 border-b border-[#334155]">
              <h4 className="font-semibold mb-3 text-blue-400">Course en cours</h4>
              <div className="bg-[#334155] rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm">{currentRide.user?.name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin size={16} className="text-green-400" />
                  <span className="text-sm">{currentRide.adresse_depart}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Navigation size={16} className="text-red-400" />
                  <span className="text-sm">{currentRide.adresse_arrivee}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <DollarSign size={16} className="text-yellow-400" />
                  <span className="text-sm font-medium">{currentRide.prix} €</span>
                </div>
                
                <button
                  onClick={completeRide}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition mt-3"
                >
                  Terminer la course
                </button>
              </div>
            </div>
          )}

          {/* Courses en attente */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h4 className="font-semibold mb-3">Courses disponibles ({pendingRides.length})</h4>
              
              {pendingRides.length > 0 ? (
                <div className="space-y-3">
                  {pendingRides.map((ride) => (
                    <div key={ride.id} className="bg-[#334155] rounded-lg p-3">
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <User size={14} className="text-gray-400" />
                          <span className="text-sm">{ride.user?.name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <MapPin size={14} className="text-green-400" />
                          <span className="text-xs">{ride.adresse_depart}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Navigation size={14} className="text-red-400" />
                          <span className="text-xs">{ride.adresse_arrivee}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSign size={14} className="text-yellow-400" />
                            <span className="text-sm font-medium">{ride.prix} €</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-xs">{ride.distance} km</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => acceptRide(ride.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-xs font-medium transition flex items-center justify-center space-x-1"
                        >
                          <CheckCircle size={12} />
                          <span>Accepter</span>
                        </button>
                        
                        <button
                          onClick={() => declineRide(ride.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs font-medium transition flex items-center justify-center space-x-1"
                        >
                          <XCircle size={12} />
                          <span>Refuser</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Car size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune course disponible</p>
                  {!isOnline && (
                    <p className="text-xs mt-1">Mettez-vous en ligne pour recevoir des courses</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carte */}
        <div className="flex-1 relative">
          <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={currentPosition}
              zoom={15}
              options={{
                styles: [
                  {
                    featureType: 'all',
                    elementType: 'geometry.fill',
                    stylers: [{ color: '#1e293b' }]
                  },
                  {
                    featureType: 'all',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#ffffff' }]
                  },
                  {
                    featureType: 'road',
                    elementType: 'geometry',
                    stylers: [{ color: '#334155' }]
                  },
                  {
                    featureType: 'water',
                    elementType: 'geometry',
                    stylers: [{ color: '#0f172a' }]
                  }
                ]
              }}
            >
              {/* Marqueur position actuelle */}
              <Marker
                position={currentPosition}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="#ffffff" stroke-width="2"/>
                      <circle cx="16" cy="16" r="4" fill="#ffffff"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(32, 32)
                }}
                title="Votre position"
              />
              
              {/* Marqueurs des courses */}
              {pendingRides.map((ride) => (
                <Marker
                  key={ride.id}
                  position={{
                    lat: parseFloat(ride.latitude_depart) || defaultCenter.lat,
                    lng: parseFloat(ride.longitude_depart) || defaultCenter.lng
                  }}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="12" fill="#10B981" stroke="#ffffff" stroke-width="2"/>
                        <path d="M16 8L20 12H18V20H14V12H12L16 8Z" fill="#ffffff"/>
                      </svg>
                    `),
                    scaledSize: new window.google.maps.Size(32, 32)
                  }}
                  title={`Course vers ${ride.adresse_arrivee}`}
                />
              ))}
            </GoogleMap>
          </LoadScript>
          
          {/* Bouton de recentrage */}
          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                  setCurrentPosition({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  });
                });
              }
            }}
            className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition"
            title="Recentrer sur ma position"
          >
            <Navigation2 size={20} />
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="fixed bottom-4 left-4 bg-red-500/90 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="absolute top-2 right-2 text-white hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default DriverInterface;
