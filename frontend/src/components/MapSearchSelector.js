import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  InfoWindow,
  useJsApiLoader,
} from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const centerDefault = {
  lat: 36.8065,
  lng: 10.1815,
};

function MapSearchSelector({ onChange }) {
  const [startPosition, setStartPosition] = useState(null);
  const [endPosition, setEndPosition] = useState(null);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [mapCenter, setMapCenter] = useState(centerDefault);
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [infoWindowPosition, setInfoWindowPosition] = useState(null);
  const [infoWindowContent, setInfoWindowContent] = useState('');

  const startInputRef = useRef(null);
  const endInputRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  });

  // 🌍 Fonction pour récupérer l’adresse à partir de lat/lng
  const fetchAddressFromCoords = async (lat, lng, type) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.status === 'OK') {
        const address = data.results[0]?.formatted_address || 'Adresse inconnue';
        type === 'start' ? setStartAddress(address) : setEndAddress(address);
      }
    } catch (err) {
      console.error('Erreur reverse geocoding:', err);
    }
  };

  const geocodeAddress = async (query, type) => {
    if (!query) return;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      const loc = data.results?.[0]?.geometry?.location;
      if (!loc) return;
      const coords = { lat: loc.lat, lng: loc.lng };
      if (type === 'start') {
        setStartPosition(coords);
        setMapCenter(coords);
        setStartAddress(data.results?.[0]?.formatted_address || query);
      } else {
        setEndPosition(coords);
        setEndAddress(data.results?.[0]?.formatted_address || query);
      }
      const newStart = type === 'start' ? coords : startPosition;
      const newEnd = type === 'end' ? coords : endPosition;
      if (onChange) {
        onChange({ start: newStart, end: newEnd });
      }
      if (newStart && newEnd) {
        calculateRoute(newStart, newEnd);
      }
    } catch (err) {
      console.error('Erreur geocoding adresse:', err);
    }
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setStartPosition(coords);
          setMapCenter(coords);
          fetchAddressFromCoords(coords.lat, coords.lng, 'start');
          if (onChange) onChange({ start: coords, end: endPosition });
          if (endPosition) {
            calculateRoute(coords, endPosition);
          }
        },
        async () => {
          const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          const data = await res.json();
          if (data && data.location) {
            const coords = { lat: data.location.lat, lng: data.location.lng };
            setStartPosition(coords);
            setMapCenter(coords);
            fetchAddressFromCoords(coords.lat, coords.lng, 'start');
            if (onChange) onChange({ start: coords, end: endPosition });
            if (endPosition) {
              calculateRoute(coords, endPosition);
            }
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };
  
  // Calculer l'itinéraire entre deux points
  const calculateRoute = (start, end) => {
    if (!start || !end) return;
    
    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          
          // Extraire la distance et la durée
          const route = result.routes[0];
          if (route && route.legs[0]) {
            setDistance(route.legs[0].distance.text);
            setDuration(route.legs[0].duration.text);
          }
        } else {
          console.error(`Erreur de calcul d'itinéraire: ${status}`);
        }
      }
    );
  };
  
  // Afficher les informations sur un marqueur
  const handleMarkerClick = (position, isStart) => {
    setInfoWindowPosition(position);
    setInfoWindowContent(isStart ? `Point de départ: ${startAddress}` : `Point d'arrivée: ${endAddress}`);
    setShowInfoWindow(true);
  };

  // Recalculer l'itinéraire quand les positions changent
  useEffect(() => {
    if (startPosition && endPosition) {
      calculateRoute(startPosition, endPosition);
    }
  }, [startPosition, endPosition]);

  if (loadError) return <p className="text-red-500">Erreur de chargement de la carte.</p>;
  if (!isLoaded) return <p className="text-gray-300">Chargement de la carte...</p>;

  return (
    <>
      <div className="mb-4 flex items-center space-x-2">
        <input
          ref={startInputRef}
          type="text"
          placeholder="Lieu de départ"
          onKeyDown={(e) => {
            if (e.key === 'Enter') geocodeAddress(e.currentTarget.value, 'start');
          }}
          onBlur={(e) => geocodeAddress(e.currentTarget.value, 'start')}
          className="w-11/12 px-3 py-2 rounded-md bg-[#334155] border border-[#475569] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleUseMyLocation}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
          type="button"
        >
          📍 Utiliser ma position
        </button>
      </div>

      {startAddress && (
        <p className="text-sm text-green-400 mb-2">📍 Adresse départ : {startAddress}</p>
      )}

      <div className="mb-4">
        <input
          ref={endInputRef}
          type="text"
          placeholder="Lieu d’arrivée"
          onKeyDown={(e) => {
            if (e.key === 'Enter') geocodeAddress(e.currentTarget.value, 'end');
          }}
          onBlur={(e) => geocodeAddress(e.currentTarget.value, 'end')}
          className="w-full px-3 py-2 rounded-md bg-[#334155] border border-[#475569] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {endAddress && (
        <p className="text-sm text-green-400 mb-4">📍 Adresse arrivée : {endAddress}</p>
      )}

      {/* Afficher la distance et la durée si disponibles */}
      {distance && duration && (
        <div className="bg-[#1e293b] p-3 rounded-md mb-4 flex justify-between">
          <div className="text-white">
            <span className="font-bold">Distance:</span> {distance}
          </div>
          <div className="text-white">
            <span className="font-bold">Durée estimée:</span> {duration}
          </div>
        </div>
      )}
      
      <GoogleMap 
        mapContainerStyle={containerStyle} 
        center={mapCenter} 
        zoom={14}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#242f3e' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#242f3e' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#746855' }]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#17263c' }]
            }
          ]
        }}
      >
        {startPosition && (
          <Marker 
            position={startPosition} 
            onClick={() => handleMarkerClick(startPosition, true)}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
            }}
          />
        )}
        
        {endPosition && (
          <Marker 
            position={endPosition} 
            onClick={() => handleMarkerClick(endPosition, false)}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }}
          />
        )}
        
        {showInfoWindow && infoWindowPosition && (
          <InfoWindow
            position={infoWindowPosition}
            onCloseClick={() => setShowInfoWindow(false)}
          >
            <div style={{ color: '#000', padding: '5px' }}>
              {infoWindowContent}
            </div>
          </InfoWindow>
        )}
        
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
      </GoogleMap>
    </>
  );
}

export default MapSearchSelector;
