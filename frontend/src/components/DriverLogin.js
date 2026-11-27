import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import api from '../api/axios';
import { Car, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

function DriverLogin() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      // Connexion utilisateur
      const response = await api.post('/login', formData);
      const { user, token } = response.data;
      
      // Vérifier si l'utilisateur a un profil conducteur
      const driverResponse = await api.get('/drivers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const driverProfile = driverResponse.data.find(driver => driver.user_id === user.id);
      
      if (!driverProfile) {
        setErrors({ general: 'Aucun profil conducteur trouvé pour cet utilisateur. Veuillez créer un profil conducteur d\'abord.' });
        return;
      }
      
      // Connexion réussie avec profil conducteur
      login(token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('driverProfile', JSON.stringify(driverProfile));
      
      // Redirection vers l'interface conducteur
      navigate('/driver-interface');
      
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      if (error.response?.status === 401) {
        setErrors({ general: 'Email ou mot de passe incorrect' });
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Erreur de connexion. Veuillez réessayer.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Car size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Connexion Chauffeur</h1>
          <p className="text-gray-400">Utilisez vos identifiants utilisateur existants. Un profil chauffeur doit être créé au préalable.</p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-8 border border-[#334155]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Erreur générale */}
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-[#334155] border rounded-lg focus:outline-none focus:ring-2 transition text-white placeholder-gray-400 ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-[#475569] focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="conducteur@example.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 bg-[#334155] border rounded-lg focus:outline-none focus:ring-2 transition text-white placeholder-gray-400 ${
                    errors.password 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-[#475569] focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connexion...</span>
                </>
              ) : (
                <>
                  <Car size={20} />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          {/* Liens utiles */}
          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-blue-300 text-sm transition"
            >
              Connexion utilisateur classique
            </button>
            
            <div className="text-gray-500 text-sm">
              Pas encore conducteur ? 
              <button
                onClick={() => navigate('/drivers')}
                className="text-blue-400 hover:text-blue-300 ml-1 transition"
              >
                Créer un profil conducteur
              </button>
            </div>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            En vous connectant, vous acceptez nos conditions d'utilisation pour les conducteurs
          </p>
        </div>
      </div>
    </div>
  );
}

export default DriverLogin;