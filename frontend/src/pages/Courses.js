import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import MapSearchSelector from '../components/MapSearchSelector';

function Courses() {
  const [form, setForm] = useState(() => {
    const savedForm = localStorage.getItem('courseForm');
    return savedForm
      ? JSON.parse(savedForm)
      : {
          user_id: '',
          start_latitude: '',
          start_longitude: '',
          end_latitude: '',
          end_longitude: '',
          status: 'en attente',
        };
  });

  const [prixEstime, setPrixEstime] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [prixFinal, setPrixFinal] = useState(null);
  const [chauffeur, setChauffeur] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState(() => localStorage.getItem('courseId'));

  // Calcule la distance en km
  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Charger user_id au montage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setForm(prev => ({ ...prev, user_id: user.id }));
    }
  }, []);

  // Charger la course existante si courseId présent
  useEffect(() => {
    if (courseId) {
      setLoading(true);
      api.get(`/courses/${courseId}`)
        .then(res => {
          const c = res.data;
          setForm({
            user_id: c.user_id,
            start_latitude: c.start_latitude,
            start_longitude: c.start_longitude,
            end_latitude: c.end_latitude,
            end_longitude: c.end_longitude,
            status: c.statut || 'en attente',
          });
          setPrixFinal(c.prix);
          setDistanceKm(c.distance_km ? c.distance_km.toFixed(2) : null);
          setChauffeur(c.driver_profile || null);
          setSuccess('');
          setError('');
        })
        .catch(() => {
          setError('Erreur lors du chargement de la course.');
          resetCourse(); // en cas d'erreur on reset aussi
        })
        .finally(() => setLoading(false));
    }
  }, [courseId]);

  // Calcul automatique du prix estimé et distance quand coordonnées changent
  useEffect(() => {
    const {
      start_latitude,
      start_longitude,
      end_latitude,
      end_longitude,
    } = form;

    if (
      start_latitude !== '' &&
      start_longitude !== '' &&
      end_latitude !== '' &&
      end_longitude !== ''
    ) {
      const distance = calculateDistanceKm(
        parseFloat(start_latitude),
        parseFloat(start_longitude),
        parseFloat(end_latitude),
        parseFloat(end_longitude)
      );
      setDistanceKm(distance.toFixed(2));
      setPrixEstime((distance * 1.5).toFixed(2));
    } else {
      setDistanceKm(null);
      setPrixEstime(null);
    }
    // On sauvegarde aussi en localStorage
    localStorage.setItem('courseForm', JSON.stringify(form));
  }, [form]);

  // Mise à jour du formulaire avec coordonnées choisies sur la carte
  const handleCoordinatesChange = ({ start, end }) => {
    setForm(prev => ({
      ...prev,
      start_latitude: start?.lat || '',
      start_longitude: start?.lng || '',
      end_latitude: end?.lat || '',
      end_longitude: end?.lng || '',
    }));
  };

  // Mise à jour des champs manuels
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Réinitialiser la course (formulaire et états)
  const resetCourse = () => {
    setForm({
      user_id: form.user_id, // garder l'user_id
      start_latitude: '',
      start_longitude: '',
      end_latitude: '',
      end_longitude: '',
      status: 'en attente',
    });
    setPrixEstime(null);
    setDistanceKm(null);
    setPrixFinal(null);
    setChauffeur(null);
    setCourseId(null);
    localStorage.removeItem('courseId');
    localStorage.removeItem('courseForm');
    setError('');
    setSuccess('');
  };

  // Soumission : création ou mise à jour selon présence de courseId
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload = {
      user_id: form.user_id,
      start_latitude: parseFloat(form.start_latitude),
      start_longitude: parseFloat(form.start_longitude),
      end_latitude: parseFloat(form.end_latitude),
      end_longitude: parseFloat(form.end_longitude),
      statut: form.status,
      prix: prixEstime ? parseFloat(prixEstime) : 0,
    };

    try {
      let response;
      if (courseId) {
        response = await api.put(`/courses/${courseId}`, payload);
        setSuccess('Course mise à jour avec succès !');
      } else {
        response = await api.post('/courses', payload);
        setSuccess('Course créée avec succès !');
        const newCourseId = response.data.course?.id;
        setCourseId(newCourseId);
        localStorage.setItem('courseId', newCourseId);
      }

      const data = response.data;
      setPrixFinal(data.course?.prix || prixEstime);
      setChauffeur(data.chauffeur || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  // Annuler la course
  const handleCancel = async () => {
    if (!courseId) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.put(`/courses/${courseId}`, { statut: 'annulée' });
      resetCourse();
      setSuccess('Course annulée. Vous pouvez créer une nouvelle course.');
    } catch (err) {
      setError("Erreur lors de l'annulation.");
    } finally {
      setLoading(false);
    }
  };

  // Statut pour savoir si éditable
  const status = form.status ? form.status.toLowerCase() : '';
  const isEditable = !['annulée', 'terminée'].includes(status);

  return (
    <div className="max-w-3xl mx-auto pt-10 px-4 font-sans bg-[#0f172a] min-h-screen text-white">
      <h2 className="text-3xl font-bold mb-8 text-center">Course</h2>

      <section className="mb-10">
        <h3 className="text-xl font-semibold mb-4">Choisissez les points de départ et d'arrivée</h3>
        <MapSearchSelector onChange={handleCoordinatesChange} disabled={!isEditable} />
      </section>

      {error && <p className="text-red-500 font-semibold mb-4 text-center">{error}</p>}
      {success && <div className="text-green-500 font-semibold mb-4 text-center">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#1e293b] p-8 rounded-lg shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['start_latitude', 'start_longitude', 'end_latitude', 'end_longitude'].map(name => (
            <div key={name}>
              <label htmlFor={name} className="block mb-2 font-medium text-gray-300">
                {name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
              <input
                type="number"
                name={name}
                value={form[name]}
                onChange={handleChange}
                step="any"
                required
                disabled={!isEditable}
                className="w-full px-3 py-2 rounded-md bg-[#334155] border border-[#475569] text-white"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium text-gray-300">Distance estimée</label>
            <input
              type="text"
              value={distanceKm ? `${distanceKm} km` : ''}
              readOnly
              className="w-full px-3 py-2 rounded-md bg-[#334155] border border-[#475569] text-white cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-300">Prix estimé</label>
            <input
              type="text"
              value={prixEstime ? `${prixEstime} DT` : ''}
              readOnly
              className="w-full px-3 py-2 rounded-md bg-[#334155] border border-[#475569] text-white cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block mb-2 font-medium text-gray-300">Statut</label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
            disabled={!isEditable}
            className="w-full px-3 py-2 rounded-md bg-[#334155] border border-[#475569] text-white"
          >
            <option value="en attente">En attente</option>
            <option value="en cours">En cours</option>
            <option value="terminée">Terminée</option>
            <option value="annulée">Annulée</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !isEditable}
            className={`w-full py-3 rounded-md text-white font-semibold transition-colors duration-200 ${
              loading || !isEditable ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Enregistrement...' : courseId ? 'Mettre à jour la course' : 'Créer la course'}
          </button>

          {courseId && isEditable && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="w-full py-3 rounded-md text-white font-semibold transition-colors duration-200 bg-red-600 hover:bg-red-700"
            >
              Annuler la course
            </button>
          )}
        </div>
      </form>

      {/* Bouton "Nouvelle course" si annulée ou terminée */}
      {courseId && ['annulée', 'terminée'].includes(status) && (
        <button
          type="button"
          onClick={resetCourse}
          disabled={loading}
          className="w-full py-3 rounded-md text-white font-semibold transition-colors duration-200 bg-green-600 hover:bg-green-700 mt-6"
        >
          Nouvelle course
        </button>
      )}
    </div>
  );
}

export default Courses;
