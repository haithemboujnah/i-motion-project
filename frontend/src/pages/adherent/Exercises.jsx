import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSearch, FaFilter, FaDumbbell, FaClock,
  FaFire, FaStar, FaInfoCircle, FaVideo,
  FaImage
} from 'react-icons/fa';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import { exerciseService } from '../../services/exerciseService';
import toast from 'react-hot-toast';

const Exercises = () => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    difficulty: 'all',
    muscle_group: 'all'
  });
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  const categories = [
    { value: 'all', label: 'Tous' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'musculation', label: 'Musculation' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'etirements', label: 'Étirements' }
  ];

  const difficulties = [
    { value: 'all', label: 'Tous niveaux' },
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' }
  ];

  const muscleGroups = [
    { value: 'all', label: 'Tous' },
    { value: 'pectoraux', label: 'Pectoraux' },
    { value: 'dos', label: 'Dos' },
    { value: 'jambes', label: 'Jambes' },
    { value: 'epaules', label: 'Épaules' },
    { value: 'bras', label: 'Bras' },
    { value: 'cardiaque', label: 'Cardiaque' }
  ];

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await exerciseService.getAll();
      setExercises(response.data.exercises || []);
      setFilteredExercises(response.data.exercises || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Erreur lors du chargement des exercices');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, filters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(searchTerm, newFilters);
  };

  const applyFilters = (term, currentFilters) => {
    let filtered = exercises.filter(ex => 
      ex.name.toLowerCase().includes(term) ||
      ex.description.toLowerCase().includes(term)
    );

    if (currentFilters.category !== 'all') {
      filtered = filtered.filter(ex => ex.category === currentFilters.category);
    }

    if (currentFilters.difficulty !== 'all') {
      filtered = filtered.filter(ex => ex.difficulty === currentFilters.difficulty);
    }

    if (currentFilters.muscle_group !== 'all') {
      filtered = filtered.filter(ex => ex.muscle_group === currentFilters.muscle_group);
    }

    setFilteredExercises(filtered);
  };

  // ✅ Gestionnaire d'erreur d'image
  const handleImageError = (exerciseId) => {
    setImageErrors(prev => ({ ...prev, [exerciseId]: true }));
  };

  // ✅ Obtenir l'URL de l'image
  const getImageUrl = (exercise) => {
    // Si l'image a déjà une erreur, utiliser default
    if (imageErrors[exercise.id]) {
      return '/exercises/default.jpg';
    }
    
    // Si l'image est définie dans l'exercice
    if (exercise.image_url) {
      // Vérifier si c'est une URL complète ou relative
      if (exercise.image_url.startsWith('http://') || exercise.image_url.startsWith('https://')) {
        return exercise.image_url;
      }
      // Sinon, c'est une URL relative
      return exercise.image_url;
    }
    
    // Générer une URL par défaut basée sur le nom de l'exercice
    const nameSlug = exercise.name.toLowerCase().replace(/ /g, '_');
    return `/exercises/${nameSlug}.jpg`;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'debutant': 'bg-green-100 text-green-700',
      'intermediaire': 'bg-yellow-100 text-yellow-700',
      'avance': 'bg-red-100 text-red-700'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      'cardio': '🏃',
      'musculation': '💪',
      'hiit': '🔥',
      'etirements': '🧘'
    };
    return emojis[category] || '🏋️';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-display font-bold text-gray-900">
                🏋️ Bibliothèque d'Exercices
              </h1>
              <span className="bg-[#57a1ce]/10 text-[#57a1ce] px-4 py-2 rounded-lg font-medium">
                {filteredExercises.length} exercices
              </span>
            </div>

            {/* Filtres et recherche */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Rechercher un exercice..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="input-logo pl-10"
                  />
                </div>
                
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input-logo md:w-40"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>

                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="input-logo md:w-40"
                >
                  {difficulties.map(diff => (
                    <option key={diff.value} value={diff.value}>{diff.label}</option>
                  ))}
                </select>

                <select
                  value={filters.muscle_group}
                  onChange={(e) => handleFilterChange('muscle_group', e.target.value)}
                  className="input-logo md:w-40"
                >
                  {muscleGroups.map(mg => (
                    <option key={mg.value} value={mg.value}>{mg.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : filteredExercises.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredExercises.map((exercise) => {
                  const imageUrl = getImageUrl(exercise);
                  return (
                    <div
                      key={exercise.id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gradient-to-r from-gray-100 to-gray-200">
                        <img
                          src={imageUrl}
                          alt={exercise.name}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(exercise.id)}
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <span className={`badge ${getDifficultyColor(exercise.difficulty)}`}>
                            {exercise.difficulty}
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                            {getCategoryEmoji(exercise.category)} {exercise.category}
                          </span>
                        </div>
                        {imageErrors[exercise.id] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                            <div className="text-center">
                              <FaImage className="text-4xl text-gray-400 mx-auto mb-2" />
                              <span className="text-sm text-gray-500">{exercise.name}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Informations */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {exercise.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {exercise.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaClock className="text-[#57a1ce]" />
                            {exercise.duration || 15} min
                          </span>
                          <span className="flex items-center gap-1">
                            <FaFire className="text-orange-500" />
                            {exercise.calories_per_minute || 5} kcal/min
                          </span>
                          <span className="flex items-center gap-1">
                            <FaStar className="text-yellow-400" />
                            {exercise.muscle_group || 'Général'}
                          </span>
                        </div>
                        {exercise.video_url && (
                          <div className="mt-2 flex items-center gap-1 text-[#57a1ce] text-sm">
                            <FaVideo />
                            <span>Vidéo disponible</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl">
                <FaDumbbell className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun exercice trouvé</p>
                <p className="text-sm text-gray-400 mt-1">
                  Essayez de modifier vos filtres de recherche
                </p>
              </div>
            )}

            {/* Modal d'exercice */}
            {selectedExercise && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedExercise.name}
                    </h2>
                    <button
                      onClick={() => setSelectedExercise(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="relative h-64 bg-gray-100 rounded-xl mb-4 overflow-hidden">
                    <img
                      src={getImageUrl(selectedExercise)}
                      alt={selectedExercise.name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(selectedExercise.id)}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4 flex-wrap">
                      <span className={`badge ${getDifficultyColor(selectedExercise.difficulty)}`}>
                        {selectedExercise.difficulty}
                      </span>
                      <span className="badge-primary">
                        {selectedExercise.category}
                      </span>
                      <span className="badge-info">
                        {selectedExercise.muscle_group}
                      </span>
                    </div>

                    <p className="text-gray-600">{selectedExercise.description}</p>

                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Durée</p>
                        <p className="font-semibold">{selectedExercise.duration || 15} min</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Calories</p>
                        <p className="font-semibold">{selectedExercise.calories_per_minute || 5} kcal/min</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Intensité</p>
                        <p className="font-semibold capitalize">{selectedExercise.difficulty}</p>
                      </div>
                    </div>

                    {selectedExercise.instructions && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Instructions</h4>
                        <p className="text-gray-600">{selectedExercise.instructions}</p>
                      </div>
                    )}

                    {selectedExercise.video_url && (
                      <a
                        href={selectedExercise.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-logo text-sm inline-flex items-center gap-2"
                      >
                        <FaVideo /> Regarder la vidéo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Exercises;