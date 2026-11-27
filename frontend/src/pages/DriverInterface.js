import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../auth/AuthContext';
import api from '../api/axios';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { 
  Power, 
  PowerOff, 
  MapPin, 
  Clock, 
  DollarSign, 
  Navigation, 
  Phone, 
  User,
  CheckCircle,
  XCircle,
  History,
  Car
} from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 48.8566,
  lng: 2.3522
};

function DriverInterface() {
  const { user } = useContext(AuthContext);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [position, setPosition] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [directions, setDirections] = useState(null);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });

  // Récupérer le profil conducteur
  useEffect(() => {
    const fetchDriverProfile = async () => {
      try {
        setLoading(true);
        const storedProfile = localStorage.getItem('driverProfile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          setDriverProfile(profile);
          setIsOnline(profile.status === 'EN_LIGNE');
        } else {
          const res = await api.get('/drivers');
          const driverData = res.data.find(driver => driver.user_id === user.id);
          if (driverData) {
            setDriverProfile(driverData);
            setIsOnline(driverData.status === 'EN_LIGNE');
            localStorage.setItem('driverProfile', JSON.stringify(driverData));
          } else {
            setError('Aucun profil conducteur trouvé');
          }
        }
      } catch (err) {
        console.error('Erreur récupération profil conducteur', err);
        setError('Erreur lors de la récupération du profil conducteur');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDriverProfile();
    }
  }, [user]);

  // Géolocalisation temps réel
  const startTracking = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newPosition = { lat: latitude, lng: longitude };
          setPosition(newPosition);
          sendPositionToServer(latitude, longitude);
        },
        async () => {
          const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          const data = await res.json();
          if (data && data.location) {
            const { lat, lng } = data.location;
            const newPosition = { lat, lng };
            setPosition(newPosition);
            sendPositionToServer(lat, lng);
          } else {
            setError('Impossible d\'obtenir votre position');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
 
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newPosition = { lat: latitude, lng: longitude };
          setPosition(newPosition);
          sendPositionToServer(latitude, longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
 
      setWatchId(id);
    } else {
      const fallback = async () => {
        const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (data && data.location) {
          const { lat, lng } = data.location;
          const newPosition = { lat, lng };
          setPosition(newPosition);
          sendPositionToServer(lat, lng);
        } else {
          setError('La géolocalisation n\'est pas supportée par votre navigateur');
        }
      };
      fallback();
    }
  }, [driverProfile]);

  const stopTracking = useCallback(() => {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  const sendPositionToServer = async (latitude, longitude) => {
    if (!driverProfile) return;

    try {
      await api.post('/positions', {
        driver_profile_id: driverProfile.id,
        latitude,
        longitude,
        vitesse: 0,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erreur d\'envoi de position:', err);
    }
  };

  // Gestion du statut en ligne/hors ligne
  const toggleOnlineStatus = async () => {
    if (!driverProfile) return;

    try {
      const newStatus = isOnline ? 'HORS_LIGNE' : 'EN_LIGNE';
      await api.put(`/drivers/${driverProfile.id}`, {
        status: newStatus
      });
      
      setIsOnline(!isOnline);
      const updatedProfile = { ...driverProfile, status: newStatus };
      setDriverProfile(updatedProfile);
      localStorage.setItem('driverProfile', JSON.stringify(updatedProfile));

      if (!isOnline) {
        startTracking();
      } else {
        stopTracking();
      }
    } catch (err) {
      console.error('Erreur changement de statut:', err);
      setError('Erreur lors du changement de statut');
    }
  };

  // Récupérer les courses
  const fetchRides = useCallback(async () => {
    if (!driverProfile) return;

    try {
      const response = await api.get(`/courses?driver_id=${driverProfile.id}`);
      const rides = response.data;
      
      const current = rides.find(ride => 
        ride.status === 'EN_COURS' || ride.status === 'ACCEPTEE'
      );
      setCurrentRide(current);
      
      const history = rides.filter(ride => 
        ride.status === 'TERMINEE' || ride.status === 'ANNULEE'
      ).slice(0, 10);
      setRideHistory(history);
      
      // Calculer les gains
      const today = new Date().toDateString();
      const todayRides = rides.filter(ride => 
        new Date(ride.created_at).toDateString() === today && ride.status === 'TERMINEE'
      );
      const todayEarnings = todayRides.reduce((sum, ride) => sum + (ride.prix || 0), 0);
      
      setEarnings(prev => ({ ...prev, today: todayEarnings }));
    } catch (err) {
      console.error('Erreur récupération courses:', err);
    }
  }, [driverProfile]);

  // Accepter une course
  const acceptRide = async (rideId) => {
    try {
      await api.put(`/courses/${rideId}`, {
        status: 'ACCEPTEE',
        driver_profile_id: driverProfile.id
      });
      fetchRides();
    } catch (err) {
      console.error('Erreur acceptation course:', err);
      setError('Erreur lors de l\'acceptation de la course');
    }
  };

  // Terminer une course
  const completeRide = async (rideId) => {
    try {
      await api.put(`/courses/${rideId}`, {
        status: 'TERMINEE'
      });
      setCurrentRide(null);
      fetchRides();
    } catch (err) {
      console.error('Erreur fin de course:', err);
      setError('Erreur lors de la finalisation de la course');
    }
  };

  useEffect(() => {
    if (driverProfile) {
      fetchRides();
      const interval = setInterval(fetchRides, 30000); // Actualiser toutes les 30 secondes
      return () => clearInterval(interval);
    }
  }, [driverProfile, fetchRides]);

  useEffect(() => {
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

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
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4">
        <Car size={64} className="text-red-500 mb-4" />
        <p className="text-red-500 mb-4 text-center">{error}</p>
        <button 
          onClick={() => window.location.href = '/drivers'}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition"
        >
          Créer un profil conducteur
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <div className="bg-[#1e293b] border-b border-[#334155] p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Car size={32} className="text-blue-500" />
            <div>
              <h1 className="text-xl font-bold">Interface Conducteur</h1>
              <p className="text-gray-400 text-sm">
                {driverProfile?.user?.name || 'Conducteur'} - {driverProfile?.car_model || 'Véhicule'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Gains aujourd'hui</p>
              <p className="text-lg font-bold text-green-400">{earnings.today.toFixed(2)} €</p>
            </div>
            
            <button
              onClick={toggleOnlineStatus}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition ${
                isOnline 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isOnline ? <PowerOff size={20} /> : <Power size={20} />}
              <span>{isOnline ? 'Se mettre hors ligne' : 'Se mettre en ligne'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte Google Maps */}
        <div className="lg:col-span-2">
          <div className="bg-[#1e293b] rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-[#334155]">
              <h2 className="text-lg font-semibold flex items-center">
                <MapPin size={20} className="mr-2 text-blue-500" />
                Votre position actuelle
              </h2>
            </div>
            
            <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={position || defaultCenter}
                zoom={15}
                options={{
                  styles: [
                    {
                      featureType: 'all',
                      elementType: 'geometry.fill',
                      stylers: [{ color: '#1e293b' }]
                    },
                    {
                      featureType: 'water',
                      elementType: 'geometry',
                      stylers: [{ color: '#0f172a' }]
                    }
                  ]
                }}
              >
                {position && (
                  <Marker
                    position={position}
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="20" cy="20" r="18" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
                          <circle cx="20" cy="20" r="8" fill="#ffffff"/>
                        </svg>
                      `),
                      scaledSize: new window.google.maps.Size(40, 40)
                    }}
                  />
                )}
                
                {directions && <DirectionsRenderer directions={directions} />}
              </GoogleMap>
            </LoadScript>
          </div>
        </div>

        {/* Panneau de contrôle */}
        <div className="space-y-6">
          {/* Course actuelle */}
          {currentRide ? (
            <div className="bg-[#1e293b] rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Navigation size={20} className="mr-2 text-green-500" />
                Course en cours
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Client:</span>
                  <span className="font-medium">{currentRide.user?.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Départ:</span>
                  <span className="text-sm">{currentRide.adresse_depart}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Arrivée:</span>
                  <span className="text-sm">{currentRide.adresse_arrivee}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Prix:</span>
                  <span className="font-bold text-green-400">{currentRide.prix} €</span>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => completeRide(currentRide.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition flex items-center justify-center"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Terminer
                  </button>
                  
                  <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition">
                    <Phone size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1e293b] rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Clock size={20} className="mr-2 text-yellow-500" />
                En attente de course
              </h3>
              
              <p className="text-gray-400 text-center py-8">
                {isOnline 
                  ? 'Vous êtes en ligne. En attente d\'une nouvelle course...' 
                  : 'Mettez-vous en ligne pour recevoir des courses'
                }
              </p>
            </div>
          )}

          {/* Statistiques */}
          <div className="bg-[#1e293b] rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign size={20} className="mr-2 text-green-500" />
              Gains
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Aujourd'hui:</span>
                <span className="font-bold text-green-400">{earnings.today.toFixed(2)} €</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Cette semaine:</span>
                <span className="font-bold">{earnings.week.toFixed(2)} €</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Ce mois:</span>
                <span className="font-bold">{earnings.month.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Historique */}
          <div className="bg-[#1e293b] rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <History size={20} className="mr-2 text-purple-500" />
                Historique
              </h3>
              
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-blue-400 hover:text-blue-300 text-sm transition"
              >
                {showHistory ? 'Masquer' : 'Voir tout'}
              </button>
            </div>
            
            {showHistory && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {rideHistory.length > 0 ? (
                  rideHistory.map((ride) => (
                    <div key={ride.id} className="border border-[#334155] rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">{ride.user?.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          ride.status === 'TERMINEE' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {ride.status}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-400 mb-1">
                        {ride.adresse_depart} → {ride.adresse_arrivee}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {new Date(ride.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-sm font-bold text-green-400">
                          {ride.prix} €
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">Aucune course dans l'historique</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications d'erreur */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center">
            <XCircle size={20} className="mr-2" />
            <span>{error}</span>
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
