import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSearch, FaDumbbell, FaClock,
  FaFire, FaStar, FaInfoCircle, FaVideo,
  FaImage, FaFilter, FaTimes,
  FaBolt, FaRunning, FaWeight, FaHandSparkles,
  FaUserMd, FaHeart
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
  const [showFilters, setShowFilters] = useState(false);
  const modalRef = useRef(null);

  // ✅ Fermer le modal en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setSelectedExercise(null);
      }
    };

    // ✅ Fermer avec la touche Echap
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedExercise(null);
      }
    };

    if (selectedExercise) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // ✅ Empêcher le scroll du body quand le modal est ouvert
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedExercise]);

  // ✅ Catégories adaptées à vos exercices
  const categories = [
    { value: 'all', label: 'Tous', icon: FaDumbbell },
    { value: 'ems', label: '⚡ EMS', icon: FaBolt, color: '#57a1ce' },
    { value: 'imodel', label: '🏋️ I-Model', icon: FaWeight, color: '#22c55e' },
    { value: 'ishape', label: '💆 I-Shape', icon: FaHandSparkles, color: '#8b5cf6' },
    { value: 'iface', label: '✨ I-Face', icon: FaUserMd, color: '#ec4899' }
  ];

  // ✅ Mapping des catégories pour l'affichage
  const categoryMap = {
    'ems': { label: 'EMS', icon: '⚡', color: '#57a1ce' },
    'imodel': { label: 'I-Model', icon: '🏋️', color: '#22c55e' },
    'ishape': { label: 'I-Shape', icon: '💆', color: '#8b5cf6' },
    'iface': { label: 'I-Face', icon: '✨', color: '#ec4899' },
    'cardio': { label: 'Cardio', icon: '🏃', color: '#f59e0b' },
    'musculation': { label: 'Musculation', icon: '💪', color: '#ef4444' },
    'hiit': { label: 'HIIT', icon: '🔥', color: '#f97316' },
    'etirements': { label: 'Étirements', icon: '🧘', color: '#22c55e' }
  };

  const difficulties = [
    { value: 'all', label: 'Tous niveaux' },
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' }
  ];

  const muscleGroups = [
    { value: 'all', label: 'Tous' },
    { value: 'jambes', label: 'Jambes' },
    { value: 'abdominaux', label: 'Abdominaux' },
    { value: 'dos', label: 'Dos' },
    { value: 'fessiers', label: 'Fessiers' },
    { value: 'bras', label: 'Bras' },
    { value: 'corps_entier', label: 'Corps entier' },
    { value: 'visage', label: 'Visage' },
    { value: 'lombaires', label: 'Lombaires' }
  ];

  // ✅ Statistiques des exercices par catégorie
  const getCategoryStats = () => {
    const stats = {};
    categories.forEach(cat => {
      if (cat.value !== 'all') {
        stats[cat.value] = exercises.filter(ex => ex.category === cat.value).length;
      }
    });
    return stats;
  };

  const categoryStats = getCategoryStats();

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
      ex.name?.toLowerCase().includes(term) ||
      ex.description?.toLowerCase().includes(term) ||
      ex.category?.toLowerCase().includes(term)
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

  const resetFilters = () => {
    setFilters({
      category: 'all',
      difficulty: 'all',
      muscle_group: 'all'
    });
    setSearchTerm('');
    applyFilters('', { category: 'all', difficulty: 'all', muscle_group: 'all' });
  };

  const handleImageError = (exerciseId) => {
    setImageErrors(prev => ({ ...prev, [exerciseId]: true }));
  };

  const getImageUrl = (exercise) => {
    if (imageErrors[exercise.id]) {
      return '/exercises/default.jpg';
    }
    
    if (exercise.image_url) {
      if (exercise.image_url.startsWith('http://') || exercise.image_url.startsWith('https://')) {
        return exercise.image_url;
      }
      return exercise.image_url;
    }
    
    return '/exercises/default.jpg';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'debutant': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'intermediaire': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'avance': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const getCategoryInfo = (category) => {
    return categoryMap[category] || { label: category, icon: '🏋️', color: '#6b7280' };
  };

  const getCategoryColor = (category) => {
    const colors = {
      'ems': '#57a1ce',
      'imodel': '#22c55e',
      'ishape': '#8b5cf6',
      'iface': '#ec4899',
      'cardio': '#f59e0b',
      'musculation': '#ef4444',
      'hiit': '#f97316',
      'etirements': '#22c55e'
    };
    return colors[category] || '#6b7280';
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.difficulty !== 'all') count++;
    if (filters.muscle_group !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  🏋️ Bibliothèque d'Exercices
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Découvrez tous les exercices disponibles
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Statistiques par catégorie */}
                <div className="hidden md:flex gap-2">
                  {Object.entries(categoryStats).map(([key, count]) => {
                    const info = getCategoryInfo(key);
                    return (
                      <span 
                        key={key}
                        className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1"
                        style={{ color: info.color }}
                      >
                        {info.icon} {count}
                      </span>
                    );
                  })}
                </div>
                <span className="bg-[#57a1ce]/10 text-[#57a1ce] dark:text-[#7bb8de] px-4 py-2 rounded-lg font-medium">
                  {filteredExercises.length} exercices
                </span>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition relative"
                >
                  <FaFilter className="text-gray-600 dark:text-gray-300" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#57a1ce] text-white text-xs rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Rechercher un exercice..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent transition"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent transition md:w-40"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label} {cat.value !== 'all' && `(${categoryStats[cat.value] || 0})`}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.difficulty}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                    className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent transition md:w-40"
                  >
                    {difficulties.map(diff => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>

                  <select
                    value={filters.muscle_group}
                    onChange={(e) => handleFilterChange('muscle_group', e.target.value)}
                    className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent transition md:w-40"
                  >
                    {muscleGroups.map(mg => (
                      <option key={mg.value} value={mg.value}>{mg.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filtres actifs */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {filters.category !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#57a1ce]/10 text-[#57a1ce] rounded-full text-sm">
                      Catégorie: {categories.find(c => c.value === filters.category)?.label}
                      <button onClick={() => handleFilterChange('category', 'all')} className="ml-1 hover:text-red-500">
                        ×
                      </button>
                    </span>
                  )}
                  {filters.difficulty !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      Niveau: {difficulties.find(d => d.value === filters.difficulty)?.label}
                      <button onClick={() => handleFilterChange('difficulty', 'all')} className="ml-1 hover:text-red-500">
                        ×
                      </button>
                    </span>
                  )}
                  {filters.muscle_group !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      Muscle: {muscleGroups.find(m => m.value === filters.muscle_group)?.label}
                      <button onClick={() => handleFilterChange('muscle_group', 'all')} className="ml-1 hover:text-red-500">
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : filteredExercises.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredExercises.map((exercise, index) => {
                  const imageUrl = getImageUrl(exercise);
                  const categoryInfo = getCategoryInfo(exercise.category);
                  const categoryColor = getCategoryColor(exercise.category);
                  
                  return (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-700"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={exercise.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => handleImageError(exercise.id)}
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <span className={`badge ${getDifficultyColor(exercise.difficulty)}`}>
                            {exercise.difficulty}
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <span 
                            className="text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm bg-black/50 flex items-center gap-1"
                          >
                            <span style={{ color: categoryColor }}>{categoryInfo.icon}</span>
                            {categoryInfo.label}
                          </span>
                        </div>
                        {imageErrors[exercise.id] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                            <div className="text-center">
                              <FaImage className="text-4xl text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">{exercise.name}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Informations */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 dark:text-white text-lg group-hover:text-[#57a1ce] transition">
                          {exercise.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {exercise.description}
                        </p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FaClock className="text-[#57a1ce]" />
                            {exercise.duration || 20} min
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
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FaDumbbell className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Aucun exercice trouvé
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || activeFiltersCount > 0 
                    ? 'Essayez de modifier vos filtres de recherche' 
                    : 'Aucun exercice disponible pour le moment'}
                </p>
              </div>
            )}

            {/* Modal d'exercice - avec fermeture à l'extérieur */}
            {selectedExercise && (
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedExercise(null)}
              >
                <motion.div
                  ref={modalRef}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedExercise.name}
                    </h2>
                    <button
                      onClick={() => setSelectedExercise(null)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      aria-label="Fermer"
                    >
                      <FaTimes className="text-xl" />
                    </button>
                  </div>

                  <div className="relative h-64 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4 overflow-hidden">
                    <img
                      src={getImageUrl(selectedExercise)}
                      alt={selectedExercise.name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(selectedExercise.id)}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={`badge ${getDifficultyColor(selectedExercise.difficulty)}`}>
                        {selectedExercise.difficulty}
                      </span>
                      <span className="badge-primary">
                        {getCategoryInfo(selectedExercise.category).label}
                      </span>
                      <span className="badge-info">
                        {selectedExercise.muscle_group}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedExercise.description}
                    </p>

                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Durée</p>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {selectedExercise.duration || 20} min
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Calories</p>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {selectedExercise.calories_per_minute || 5} kcal/min
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Intensité</p>
                        <p className="font-semibold text-gray-800 dark:text-white capitalize">
                          {selectedExercise.difficulty}
                        </p>
                      </div>
                    </div>

                    {selectedExercise.instructions && (
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                          📝 Instructions
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedExercise.instructions}
                        </p>
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
                </motion.div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Exercises;