import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import api from '../api/axios';
import { 
  Receipt, 
  Download, 
  Eye, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  Clock,
  FileText,
  Printer,
  Mail,
  Filter
} from 'lucide-react';

function DriverReceipts() {
  const { user } = useContext(AuthContext);
  const [driverProfile, setDriverProfile] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    search: ''
  });

  // Récupérer le profil conducteur
  useEffect(() => {
    const fetchDriverProfile = async () => {
      try {
        const storedProfile = localStorage.getItem('driverProfile');
        if (storedProfile) {
          setDriverProfile(JSON.parse(storedProfile));
          return;
        }
        
        const res = await api.get('/drivers');
        const driverData = res.data.find(driver => driver.user_id === user?.id);
        if (driverData) {
          setDriverProfile(driverData);
          localStorage.setItem('driverProfile', JSON.stringify(driverData));
        } else {
          setError('Aucun profil chauffeur trouvé.');
        }
      } catch (err) {
        console.error('Erreur récupération profil conducteur', err);
        setError('Erreur lors de la récupération du profil conducteur: ' + (err.response?.data?.message || err.message));
      }
    };

    if (user) {
      fetchDriverProfile();
    } else {
      setError('Veuillez vous connecter d\'abord.');
      setLoading(false);
    }
  }, [user]);

  // Récupérer les reçus
  useEffect(() => {
    const fetchReceipts = async () => {
      if (!driverProfile) return;

      try {
        setLoading(true);
        const response = await api.get(`/courses?driver_id=${driverProfile.id}&status=TERMINEE`);
        const completedRides = response.data;
        
        // Transformer les courses en reçus
        const receiptData = completedRides.map(ride => ({
          id: ride.id,
          receiptNumber: `REC-${ride.id.toString().padStart(6, '0')}`,
          date: ride.created_at,
          client: ride.user,
          departure: ride.adresse_depart,
          arrival: ride.adresse_arrivee,
          distance: ride.distance || 0,
          duration: ride.duree || 0,
          basePrice: ride.prix_base || 0,
          totalPrice: ride.prix || 0,
          commission: (ride.prix || 0) * 0.15, // 15% de commission
          earnings: (ride.prix || 0) * 0.85, // 85% pour le conducteur
          paymentMethod: ride.mode_paiement || 'Carte bancaire',
          status: ride.status,
          rating: ride.rating || null
        }));
        
        setReceipts(receiptData);
        setFilteredReceipts(receiptData);
      } catch (err) {
        console.error('Erreur récupération reçus:', err);
        setError('Erreur lors de la récupération des reçus');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [driverProfile]);

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...receipts];

    // Filtre par mois et année
    filtered = filtered.filter(receipt => {
      const receiptDate = new Date(receipt.date);
      return receiptDate.getMonth() + 1 === filters.month && 
             receiptDate.getFullYear() === filters.year;
    });

    // Filtre par recherche
    if (filters.search) {
      filtered = filtered.filter(receipt => 
        receipt.client?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        receipt.receiptNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        receipt.departure?.toLowerCase().includes(filters.search.toLowerCase()) ||
        receipt.arrival?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredReceipts(filtered);
  }, [filters, receipts]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const viewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setShowModal(true);
  };

  const downloadReceipt = (receipt) => {
    // Générer un reçu PDF (simulation)
    const receiptContent = generateReceiptContent(receipt);
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu_${receipt.receiptNumber}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReceipt = (receipt) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateReceiptHTML(receipt));
    printWindow.document.close();
    printWindow.print();
  };

  const generateReceiptContent = (receipt) => {
    return `
===========================================
              REÇU DE COURSE
===========================================

Numéro de reçu: ${receipt.receiptNumber}
Date: ${new Date(receipt.date).toLocaleDateString('fr-FR')}
Heure: ${new Date(receipt.date).toLocaleTimeString('fr-FR')}

-------------------------------------------
INFORMATIONS COURSE
-------------------------------------------
Client: ${receipt.client?.name || 'N/A'}
Départ: ${receipt.departure}
Arrivée: ${receipt.arrival}
Distance: ${receipt.distance} km
Durée: ${receipt.duration} min

-------------------------------------------
DÉTAILS FINANCIERS
-------------------------------------------
Prix de base: ${receipt.basePrice.toFixed(2)} €
Prix total: ${receipt.totalPrice.toFixed(2)} €
Commission plateforme: ${receipt.commission.toFixed(2)} €
Vos gains: ${receipt.earnings.toFixed(2)} €
Mode de paiement: ${receipt.paymentMethod}

-------------------------------------------
CONDUCTEUR
-------------------------------------------
Nom: ${driverProfile?.user?.name || 'N/A'}
Véhicule: ${driverProfile?.car_model || 'N/A'}
Immatriculation: ${driverProfile?.car_plate || 'N/A'}

===========================================
        Merci pour votre service!
===========================================
    `;
  };

  const generateReceiptHTML = (receipt) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Reçu ${receipt.receiptNumber}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .section { margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 1.2em; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>REÇU DE COURSE</h1>
            <p>Numéro: ${receipt.receiptNumber}</p>
            <p>Date: ${new Date(receipt.date).toLocaleDateString('fr-FR')} ${new Date(receipt.date).toLocaleTimeString('fr-FR')}</p>
        </div>
        
        <div class="section">
            <h3>Informations Course</h3>
            <div class="row"><span>Client:</span><span>${receipt.client?.name || 'N/A'}</span></div>
            <div class="row"><span>Départ:</span><span>${receipt.departure}</span></div>
            <div class="row"><span>Arrivée:</span><span>${receipt.arrival}</span></div>
            <div class="row"><span>Distance:</span><span>${receipt.distance} km</span></div>
            <div class="row"><span>Durée:</span><span>${receipt.duration} min</span></div>
        </div>
        
        <div class="section">
            <h3>Détails Financiers</h3>
            <div class="row"><span>Prix de base:</span><span>${receipt.basePrice.toFixed(2)} €</span></div>
            <div class="row"><span>Prix total:</span><span>${receipt.totalPrice.toFixed(2)} €</span></div>
            <div class="row"><span>Commission plateforme:</span><span>${receipt.commission.toFixed(2)} €</span></div>
            <div class="row total"><span>Vos gains:</span><span>${receipt.earnings.toFixed(2)} €</span></div>
            <div class="row"><span>Mode de paiement:</span><span>${receipt.paymentMethod}</span></div>
        </div>
        
        <div class="section">
            <h3>Conducteur</h3>
            <div class="row"><span>Nom:</span><span>${driverProfile?.user?.name || 'N/A'}</span></div>
            <div class="row"><span>Véhicule:</span><span>${driverProfile?.car_model || 'N/A'}</span></div>
            <div class="row"><span>Immatriculation:</span><span>${driverProfile?.car_plate || 'N/A'}</span></div>
        </div>
    </body>
    </html>
    `;
  };

  const exportMonthlyReport = () => {
    const monthlyReceipts = filteredReceipts;
    const totalEarnings = monthlyReceipts.reduce((sum, receipt) => sum + receipt.earnings, 0);
    const totalCommission = monthlyReceipts.reduce((sum, receipt) => sum + receipt.commission, 0);
    const totalRides = monthlyReceipts.length;
    
    const reportContent = `
RAPPORT MENSUEL - ${filters.month}/${filters.year}
===========================================

Résumé:
- Nombre de courses: ${totalRides}
- Gains totaux: ${totalEarnings.toFixed(2)} €
- Commission totale: ${totalCommission.toFixed(2)} €
- Chiffre d'affaires: ${(totalEarnings + totalCommission).toFixed(2)} €

Détail des courses:
${monthlyReceipts.map(receipt => 
  `${receipt.receiptNumber} - ${new Date(receipt.date).toLocaleDateString('fr-FR')} - ${receipt.earnings.toFixed(2)} €`
).join('\n')}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_mensuel_${filters.month}_${filters.year}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Chargement des reçus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Receipt size={32} className="mr-3 text-blue-500" />
            Reçus des courses
          </h1>
          <p className="text-gray-400">Consultez et téléchargez vos reçus de courses</p>
        </div>

        {/* Filtres et actions */}
        <div className="bg-[#1e293b] rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Filter size={20} className="mr-2" />
              Filtres
            </h2>
            
            <button
              onClick={exportMonthlyReport}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Download size={16} />
              <span>Rapport mensuel</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mois</label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Année</label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Recherche</label>
              <input
                type="text"
                placeholder="Client, numéro de reçu..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Statistiques du mois */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1e293b] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Courses ce mois</p>
                <p className="text-2xl font-bold">{filteredReceipts.length}</p>
              </div>
              <Calendar className="text-blue-500" size={32} />
            </div>
          </div>
          
          <div className="bg-[#1e293b] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Gains ce mois</p>
                <p className="text-2xl font-bold text-green-400">
                  {filteredReceipts.reduce((sum, receipt) => sum + receipt.earnings, 0).toFixed(2)} €
                </p>
              </div>
              <DollarSign className="text-green-500" size={32} />
            </div>
          </div>
          
          <div className="bg-[#1e293b] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Commission ce mois</p>
                <p className="text-2xl font-bold text-red-400">
                  {filteredReceipts.reduce((sum, receipt) => sum + receipt.commission, 0).toFixed(2)} €
                </p>
              </div>
              <FileText className="text-red-500" size={32} />
            </div>
          </div>
        </div>

        {/* Liste des reçus */}
        <div className="bg-[#1e293b] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[#334155]">
            <h2 className="text-lg font-semibold">Reçus ({filteredReceipts.length})</h2>
          </div>
          
          {filteredReceipts.length > 0 ? (
            <div className="divide-y divide-[#334155]">
              {filteredReceipts.map((receipt) => (
                <div key={receipt.id} className="p-6 hover:bg-[#334155]/30 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="font-mono text-blue-400 font-medium">
                          {receipt.receiptNumber}
                        </span>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Calendar size={14} />
                          <span>
                            {new Date(receipt.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Clock size={14} />
                          <span>
                            {new Date(receipt.date).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Client</p>
                          <p className="text-sm font-medium">{receipt.client?.name || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Trajet</p>
                          <p className="text-sm">
                            {receipt.departure} → {receipt.arrival}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Gains</p>
                          <p className="text-sm font-bold text-green-400">
                            {receipt.earnings.toFixed(2)} €
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => viewReceipt(receipt)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                        title="Voir le reçu"
                      >
                        <Eye size={16} />
                      </button>
                      
                      <button
                        onClick={() => downloadReceipt(receipt)}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                        title="Télécharger"
                      >
                        <Download size={16} />
                      </button>
                      
                      <button
                        onClick={() => printReceipt(receipt)}
                        className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                        title="Imprimer"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Receipt size={48} className="text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Aucun reçu trouvé</p>
              <p className="text-sm text-gray-500">Modifiez vos filtres pour voir plus de résultats</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de visualisation du reçu */}
      {showModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e293b] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#334155] flex items-center justify-between">
              <h3 className="text-lg font-semibold">Reçu {selectedReceipt.receiptNumber}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center border-b border-[#334155] pb-4">
                <h2 className="text-xl font-bold mb-2">REÇU DE COURSE</h2>
                <p className="text-gray-400">Numéro: {selectedReceipt.receiptNumber}</p>
                <p className="text-gray-400">
                  {new Date(selectedReceipt.date).toLocaleDateString('fr-FR')} {new Date(selectedReceipt.date).toLocaleTimeString('fr-FR')}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Informations Course</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Client:</span>
                    <span>{selectedReceipt.client?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Départ:</span>
                    <span>{selectedReceipt.departure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Arrivée:</span>
                    <span>{selectedReceipt.arrival}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Distance:</span>
                    <span>{selectedReceipt.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Durée:</span>
                    <span>{selectedReceipt.duration} min</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Détails Financiers</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prix de base:</span>
                    <span>{selectedReceipt.basePrice.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prix total:</span>
                    <span>{selectedReceipt.totalPrice.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Commission plateforme:</span>
                    <span className="text-red-400">{selectedReceipt.commission.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-[#334155] pt-2">
                    <span>Vos gains:</span>
                    <span className="text-green-400">{selectedReceipt.earnings.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mode de paiement:</span>
                    <span>{selectedReceipt.paymentMethod}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => downloadReceipt(selectedReceipt)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
                >
                  <Download size={16} />
                  <span>Télécharger</span>
                </button>
                
                <button
                  onClick={() => printReceipt(selectedReceipt)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition"
                >
                  <Printer size={16} />
                  <span>Imprimer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default DriverReceipts;