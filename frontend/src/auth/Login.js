import React, { useState, useContext } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext'; // adapte le chemin selon ta structure

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // récupère la fonction login du contexte

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Tentative de connexion avec:', form.email);

    try {
      console.log('Envoi de la requête à:', api.defaults.baseURL + '/login');
      const response = await api.post('/login', {
        email: form.email,
        password: form.password,
      });

      console.log('Réponse reçue:', response.data);
      const { access_token, user } = response.data;
      localStorage.setItem('user', JSON.stringify(user)); // on garde user localement
      login(access_token); // met à jour l'état global de connexion
      console.log('Connexion réussie, redirection vers la page d\'accueil');

      navigate('/');
    } catch (err) {
      console.error('Erreur de connexion:', err.response?.status, err.response?.data, err.message);
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="bg-[#1e293b] p-8 rounded-xl shadow-lg w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Se connecter</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Adresse Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-400 text-center">
          Vous n'avez pas de compte ?{' '}
          <span
            className="text-blue-400 hover:underline cursor-pointer"
            onClick={() => navigate('/register')}
          >
            Créez-en un
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
