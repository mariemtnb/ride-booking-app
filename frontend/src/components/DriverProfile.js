import React, { useState, useEffect } from 'react';
import api from '../api/axios';

function DriverProfile() {
  const [form, setForm] = useState({
    user_id: '',
    license_number: '',
    phone_number: '',
    car_model: '',
    car_plate: '',
    status: 'EN_LIGNE',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data);
      } catch (err) {
        console.error('Erreur récupération utilisateurs', err);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/drivers', form);
      setSuccess('Profil chauffeur créé avec succès !');
      setForm({
        user_id: '',
        license_number: '',
        phone_number: '',
        car_model: '',
        car_plate: '',
        status: 'EN_LIGNE',
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la création';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="bg-[#1e293b] p-8 rounded-xl shadow-lg w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Créer un profil chauffeur</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Utilisateur</label>
            <select
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-[#334155] border border-[#475569] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Sélectionnez un utilisateur --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Numéro de permis</label>
            <input
              type="text"
              name="license_number"
              value={form.license_number}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-[#334155] border border-[#475569] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Numéro de téléphone</label>
            <input
              type="text"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#334155] border border-[#475569] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Modèle de voiture</label>
            <input
              type="text"
              name="car_model"
              value={form.car_model}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#334155] border border-[#475569] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Immatriculation</label>
            <input
              type="text"
              name="car_plate"
              value={form.car_plate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#334155] border border-[#475569] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Statut</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#334155] border border-[#475569] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EN_LIGNE">EN LIGNE</option>
              <option value="HORS_LIGNE">HORS LIGNE</option>
              <option value="EN_COURSE">EN COURSE</option>
              <option value="INACTIF">INACTIF</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition"
          >
            {loading ? 'Enregistrement...' : 'Créer Profil'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default DriverProfile;
