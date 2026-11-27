import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import api from '../api/axios';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  User, 
  Star,
  Filter,
  Download,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function DriverRideHistory() {
  const { user } = useContext(AuthContext);
  const [driverProfile, setDriverProfile] = useState(null);
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [ridesPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalRides: 0,
    totalEarnings: 0,
    averageRating: 0,
    completedRides: 0
  });

  // Récupérer le profil conducteur
  useEffect(() => {
    const fetchDriverProfile = async () => {
      try {
        const storedProfile = localStorage.getItem('driverProfile');
        if (storedProfile) {
          setDriverProfile(JSON.parse(storedProfile));
        } else if (user && user.id) {
          const res = await api.get('/drivers');
          console.log('Drivers response for history:', res.data);
          
          // Handle both array and paginated response
          const driversArray = Array.isArray(res.data) ? res.data : res.data.data || [];
          const driverData = driversArray.find(driver => driver.user_id === user.id);
          
          if (driverData) {
            setDriverProfile(driverData);
            localStorage.setItem('driverProfile', JSON.stringify(driverData));
          } else {
            setError('Aucun profil conducteur trouvé');
          }
        }
      } catch (err) {
        console.error('Erreur récupération profil conducteur', err);
        setError('Erreur lors de la récupération du profil conducteur');
      }
    };

    fetchDriverProfile();
  }, [user]);

  // Récupérer l'historique des courses
  useEffect(() => {
    const fetchRideHistory = async () => {
      if (!driverProfile) return;

      try {
        setLoading(true);
        const response = await api.get('/courses');
        console.log('Courses response:', response.data);
        
        // Handle both array and paginated response
        const coursesArray = Array.isArray(response.data) ? response.data : response.data.data || [];
        
        // Filter rides for this specific driver
        const driverRides = coursesArray.filter(ride => 
          ride.driver_profile_id === driverProfile.id || 
          ride.driver_id === driverProfile.id
        );
        
        setRides(driverRides);
        setFilteredRides(driverRides);
        
        // Calculer les statistiques
        const completedRides = driverRides.filter(ride => ride.status === 'TERMINEE');
        const totalEarnings = completedRides.reduce((sum, ride) => sum + (ride.prix || 0), 0);
        const averageRating = completedRides.length > 0 
          ? completedRides.reduce((sum, ride) => sum + (ride.rating || 0), 0) / completedRides.length 
          : 0;
        
        setStats({
          totalRides: driverRides.length,
          totalEarnings,
          averageRating,
          completedRides: completedRides.length
        });
      } catch (err) {
        console.error('Erreur récupération historique:', err);
        setError('Erreur lors de la récupération de l\'historique');
      } finally {
        setLoading(false);
      }
    };

    fetchRideHistory();
  }, [driverProfile]);

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...rides];

    // Filtre par statut
    if (filters.status !== 'all') {
      filtered = filtered.filter(ride => ride.status === filters.status);
    }

    // Filtre par date
    if (filters.dateFrom) {
      filtered = filtered.filter(ride => 
        new Date(ride.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(ride => 
        new Date(ride.created_at) <= new Date(filters.dateTo)
      );
    }

    // Filtre par recherche
    if (filters.search) {
      filtered = filtered.filter(ride => 
        ride.user?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        ride.adresse_depart?.toLowerCase().includes(filters.search.toLowerCase()) ||
        ride.adresse_arrivee?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredRides(filtered);
    setCurrentPage(1);
  }, [filters, rides]);

  // Pagination
  const indexOfLastRide = currentPage * ridesPerPage;
  const indexOfFirstRide = indexOfLastRide - ridesPerPage;
  const currentRides = filteredRides.slice(indexOfFirstRide, indexOfLastRide);
  const totalPages = Math.ceil(filteredRides.length / ridesPerPage);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Client', 'Départ', 'Arrivée', 'Prix', 'Statut', 'Note'].join(','),
      ...filteredRides.map(ride => [
        new Date(ride.created_at).toLocaleDateString(),
        ride.user?.name || '',
        ride.adresse_depart || '',
        ride.adresse_arrivee || '',
        ride.prix || 0,
        ride.status || '',
        ride.rating || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique_courses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'TERMINEE': return 'bg-green-500/20 text-green-400';
      case 'ANNULEE': return 'bg-red-500/20 text-red-400';
      case 'EN_COURS': return 'bg-blue-500/20 text-blue-400';
      case 'ACCEPTEE': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'TERMINEE': return 'Terminée';
      case 'ANNULEE': return 'Annulée';
      case 'EN_COURS': return 'En cours';
      case 'ACCEPTEE': return 'Acceptée';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Historique des courses</h1>
          <p className="text-gray-400">Consultez toutes vos courses passées et vos statistiques</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1e293b] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total courses</p>
                <p className="text-2xl font-bold">{stats.totalRides}</p>
              </div>
              <Calendar className="text-blue-500" size={32} />
            </div>
          </div>
          
          <div className="bg-[#1e293b] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Courses terminées</p>
                <p className="text-2xl font-bold text-green-400">{stats.completedRides}</p>
              </div>
              <MapPin className="text-green-500" size={32} />
            </div>
          </div>
          
          <div className="bg-[#1e293b] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Gains totaux</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.totalEarnings.toFixed(2)} €</p>
              </div>
              <DollarSign className="text-yellow-500" size={32} />
            </div>
          </div>
          
          <div className="bg-[#1e293b] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Note moyenne</p>
                <p className="text-2xl font-bold text-purple-400">{stats.averageRating.toFixed(1)}</p>
              </div>
              <Star className="text-purple-500" size={32} />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-[#1e293b] rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Filter size={20} className="mr-2" />
              Filtres
            </h2>
            
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Download size={16} />
              <span>Exporter CSV</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="TERMINEE">Terminées</option>
                <option value="ANNULEE">Annulées</option>
                <option value="EN_COURS">En cours</option>
                <option value="ACCEPTEE">Acceptées</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Date de début</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Date de fin</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Recherche</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Client, départ, arrivée..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Liste des courses */}
        <div className="bg-[#1e293b] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[#334155]">
            <h2 className="text-lg font-semibold">Courses ({filteredRides.length})</h2>
          </div>
          
          {currentRides.length > 0 ? (
            <div className="divide-y divide-[#334155]">
              {currentRides.map((ride) => (
                <div key={ride.id} className="p-6 hover:bg-[#334155]/30 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <User size={16} className="text-gray-400" />
                          <span className="font-medium">{ride.user?.name || 'Client inconnu'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-400">
                            {new Date(ride.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                          {getStatusText(ride.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Départ</p>
                          <p className="text-sm">{ride.adresse_depart || 'Adresse non spécifiée'}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Arrivée</p>
                          <p className="text-sm">{ride.adresse_arrivee || 'Adresse non spécifiée'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <DollarSign size={16} className="text-green-400" />
                            <span className="font-bold text-green-400">{ride.prix || 0} €</span>
                          </div>
                          
                          {ride.rating && (
                            <div className="flex items-center space-x-1">
                              <Star size={16} className="text-yellow-400" />
                              <span className="text-yellow-400">{ride.rating}</span>
                            </div>
                          )}
                        </div>
                        
                        {ride.distance && (
                          <div className="text-sm text-gray-400">
                            {ride.distance} km
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Calendar size={48} className="text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Aucune course trouvée</p>
              <p className="text-sm text-gray-500">Modifiez vos filtres pour voir plus de résultats</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-4 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center space-x-2 px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#334155] transition"
            >
              <ChevronLeft size={16} />
              <span>Précédent</span>
            </button>
            
            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-10 h-10 rounded-lg font-medium transition ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1e293b] border border-[#334155] hover:bg-[#334155]'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-2 px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#334155] transition"
            >
              <span>Suivant</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <p>{error}</p>
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

export default DriverRideHistory;