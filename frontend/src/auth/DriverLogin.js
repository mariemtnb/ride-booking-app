import React, { useState, useContext } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import { Car, User, Lock } from 'lucide-react';

function DriverLogin() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login', form);
      const { access_token, user } = response.data;
      
      // Vérifier si l'utilisateur a un profil conducteur
      const driverResponse = await api.get('/drivers', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      const driverProfile = driverResponse.data.find(driver => driver.user_id === user.id);
      
      if (!driverProfile) {
        setError('Aucun profil conducteur trouvé. Veuillez créer un profil conducteur d\'abord.');
        setLoading(false);
        return;
      }

      login(access_token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('driverProfile', JSON.stringify(driverProfile));
      
      navigate('/driver-interface');
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur de connexion';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center px-4">
      <div className="bg-[#1e293b] p-8 rounded-xl shadow-2xl w-full max-w-md text-white border border-[#334155]">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Connexion Conducteur</h2>
          <p className="text-gray-400">Accédez à votre interface de conduite</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
              <User size={16} className="inline mr-2" />
              Adresse Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="conducteur@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">
              <Lock size={16} className="inline mr-2" />
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connexion...
              </div>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-gray-400">
            Pas encore conducteur ?{' '}
            <span
              className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium transition-colors"
              onClick={() => navigate('/drivers')}
            >
              Créer un profil conducteur
            </span>
          </p>
          
          <p className="text-sm text-gray-400">
            Connexion passager ?{' '}
            <span
              className="text-green-400 hover:text-green-300 cursor-pointer font-medium transition-colors"
              onClick={() => navigate('/login')}
            >
              Interface passager
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default DriverLogin;