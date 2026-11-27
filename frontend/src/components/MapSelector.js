import React, { useState, useEffect, useRef } from 'react';
import { InfoWindow } from '@react-google-maps/api';

function MapSelector({ onChange }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [startMarker, setStartMarker] = useState(null);
  const [endMarker, setEndMarker] = useState(null);
  const [selecting, setSelecting] = useState('start'); // on commence par choisir départ
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [infoWindowPosition, setInfoWindowPosition] = useState(null);
  const [infoWindowContent, setInfoWindowContent] = useState('');

  useEffect(() => {
    if (!window.google) {
      console.error('Google Maps API non chargée');
      return;
    }

    const initialCenter = { lat: 36.8, lng: 10.18 };
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: initialCenter,
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
      ],
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });
    setMap(mapInstance);

    // Permettre de poser les marqueurs au clic
    mapInstance.addListener('click', (e) => {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };

      if (selecting === 'start') {
        if (startMarker) startMarker.setMap(null);
        const newStart = new window.google.maps.Marker({
          position: pos,
          map: mapInstance,
          label: 'D',
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
          }
        });
        
        // Ajouter un écouteur de clic sur le marqueur
        newStart.addListener('click', () => {
          setInfoWindowPosition(pos);
          setInfoWindowContent('Point de départ');
          setShowInfoWindow(true);
        });
        setStartMarker(newStart);
        setSelecting('end');

        // Remonter au parent
        onChange && onChange({ start: pos, end: endMarker ? endMarker.getPosition().toJSON() : null });
      } else if (selecting === 'end') {
        if (endMarker) endMarker.setMap(null);
        const newEnd = new window.google.maps.Marker({
          position: pos,
          map: mapInstance,
          label: 'A',
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }
        });
        
        // Ajouter un écouteur de clic sur le marqueur
        newEnd.addListener('click', () => {
          setInfoWindowPosition(pos);
          setInfoWindowContent('Point d\'arrivée');
          setShowInfoWindow(true);
        });
        setEndMarker(newEnd);
        setSelecting('start');

        // Remonter au parent
        onChange && onChange({ start: startMarker ? startMarker.getPosition().toJSON() : null, end: pos });
        
        // Calculer l'itinéraire si les deux points sont définis
        if (startMarker) {
          calculateRoute(startMarker.getPosition().toJSON(), pos, mapInstance);
        }
      }
    });
  }, [selecting, startMarker, endMarker, onChange]);
  
  // Fonction pour calculer l'itinéraire
  const calculateRoute = (start, end, mapInstance) => {
    if (!start || !end || !window.google) return;
    
    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: true, // Ne pas afficher les marqueurs par défaut
    });
    
    directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
          setDirections(directionsRenderer);
          
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

  return (
    <div>
      <p className="mb-2 text-white">
        Cliquez sur la carte pour choisir le point <b>{selecting === 'start' ? 'de départ (D)' : "d'arrivée (A)"}</b>.
      </p>
      
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
      
      <div ref={mapRef} style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden' }} />
      
      {/* InfoWindow pour afficher des informations sur les marqueurs */}
      {showInfoWindow && infoWindowPosition && map && (
        <div>
          {new window.google.maps.InfoWindow({
            content: `<div style="color: #000; padding: 5px;">${infoWindowContent}</div>`,
            position: infoWindowPosition
          }).open(map)}
        </div>
      )}
    </div>
  );
}

export default MapSelector;
