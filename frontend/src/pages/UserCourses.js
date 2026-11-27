import React, { useEffect, useState } from 'react';
import api from '../api/axios';

function UserCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/my-courses');
        setCourses(res.data);
      } catch (err) {
        setError('Erreur lors du chargement des courses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) return <p className="text-center text-white">Chargement des courses...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 text-white">
      <h2 className="text-3xl font-bold mb-6 text-center">🕓 Historique de mes Courses</h2>

      {courses.length === 0 ? (
        <p className="text-center text-gray-400">Aucune course trouvée.</p>
      ) : (
        <ul className="space-y-4">
          {courses.map(course => (
            <li key={course.id} className="bg-[#1e293b] p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">📅 {new Date(course.created_at).toLocaleString()}</span>
                <span
                  className={`text-sm font-semibold px-2 py-1 rounded ${
                    course.statut === 'terminée' ? 'bg-green-600' :
                    course.statut === 'annulée' ? 'bg-red-600' :
                    'bg-yellow-600'
                  }`}
                >
                  {course.statut}
                </span>
              </div>
              <p><strong>Départ :</strong> {course.start_latitude}, {course.start_longitude}</p>
              <p><strong>Arrivée :</strong> {course.end_latitude}, {course.end_longitude}</p>
              <p><strong>Prix :</strong> {course.prix ?? 'non disponible'} DT</p>
              {course.driver_profile && (
                <p className="text-sm mt-2 text-gray-300">
                  🚗 Chauffeur : {course.driver_profile.user?.name || 'Nom inconnu'}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserCourses;
