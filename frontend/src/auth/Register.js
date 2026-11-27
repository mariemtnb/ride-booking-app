import React, { useState, useContext } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext'; // Import du contexte d'authentification

function Register() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // Récupération de la fonction login du contexte

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirmation: '',
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
    console.log('Tentative d\'inscription avec:', form.email);

    try {
      // Vérification des données du formulaire
      console.log('Données du formulaire:', form);
      
      // Vérification que le mot de passe et sa confirmation correspondent
      if (form.password !== form.password_confirmation) {
        setError('Les mots de passe ne correspondent pas.');
        setLoading(false);
        return;
      }
      
      console.log('Envoi de la requête à:', api.defaults.baseURL + '/register');
      
      // Définir explicitement les données à envoyer
      const requestData = {
        name: form.name,
        email: form.email,
        phone_number: form.phone_number,
        password: form.password,
        password_confirmation: form.password_confirmation
      };
      
      console.log('Données envoyées:', requestData);
      
      const response = await api.post('/register', requestData);

      console.log('Réponse reçue:', response.data);
      const { access_token, user } = response.data;
      
      // Utiliser le contexte d'authentification pour se connecter
      // Cela garantit que le token est stocké de manière cohérente
      login(access_token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('Inscription réussie !', user);
      console.log('Token stocké:', access_token);

      navigate('/');
    } catch (err) {
      console.error('Erreur d\'inscription:', err);
      console.error('Status:', err.response?.status);
      console.error('Données d\'erreur:', err.response?.data);
      console.error('Message d\'erreur:', err.message);

      const message =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors || {})[0]?.[0] ||
        err.message ||
        'Une erreur est survenue.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="bg-[#1e293b] p-8 rounded-xl shadow-lg w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Inscription</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nom complet
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Votre nom complet"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Adresse Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="exemple@mail.com"
            />
          </div>

          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium mb-1">
              Numéro de téléphone
            </label>
            <input
              id="phone_number"
              type="tel"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
            />
          </div>

          <div>
            <label
              htmlFor="password_confirmation"
              className="block text-sm font-medium mb-1"
            >
              Confirmation mot de passe
            </label>
            <input
              id="password_confirmation"
              type="password"
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#334155] border border-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Inscription...' : 'S’inscrire'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-400 text-center">
          Vous avez déjà un compte ?{' '}
          <span
            className="text-blue-400 hover:underline cursor-pointer"
            onClick={() => navigate('/login')}
          >
            Connectez-vous
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
