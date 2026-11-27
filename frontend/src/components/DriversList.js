import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { User, Car, Phone, MapPin, Clock } from 'lucide-react';

function DriversList() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/drivers');
        console.log('Drivers response:', response.data);
        
        // Handle both array and paginated response
        const driversData = Array.isArray(response.data) 
          ? response.data 
          : response.data.data || [];
        
        setDrivers(driversData);
        setError('');
      } catch (err) {
        console.error('Erreur lors de la récupération des chauffeurs:', err);
        setError('Erreur lors du chargement des chauffeurs');
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'EN_LIGNE':
        return 'bg-green-500';
      case 'EN_COURSE':
        return 'bg-blue-500';
      case 'HORS_LIGNE':
        return 'bg-gray-500';
      case 'INACTIF':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'EN_LIGNE':
        return 'En ligne';
      case 'EN_COURSE':
        return 'En course';
      case 'HORS_LIGNE':
        return 'Hors ligne';
      case 'INACTIF':
        return 'Inactif';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white text-xl">
          <Clock className="animate-spin inline-block mr-2" size={24} />
          Chargement...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Tableau des Chauffeurs</h1>
        
        {drivers.length === 0 ? (
          <div className="bg-[#1e293b] rounded-lg p-8 text-center">
            <User className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-400 text-lg">Aucun chauffeur trouvé</p>
          </div>
        ) : (
          <div className="bg-[#1e293b] rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#334155]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Chauffeur
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Véhicule
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Permis
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#475569]">
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-[#2d3748] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <User className="text-white" size={20} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {driver.user?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {driver.user?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-white">
                          <Car className="mr-2 text-gray-400" size={16} />
                          <div>
                            <div className="text-sm font-medium">{driver.car_model || 'N/A'}</div>
                            <div className="text-sm text-gray-400">{driver.car_plate || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-white">
                          <Phone className="mr-2 text-gray-400" size={16} />
                          <span className="text-sm">{driver.phone_number || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${
                          getStatusColor(driver.status)
                        }`}>
                          <span className="w-2 h-2 rounded-full bg-white mr-1.5 opacity-75"></span>
                          {getStatusText(driver.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {driver.license_number || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Total: {drivers.length} chauffeur{drivers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DriversList;