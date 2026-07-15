import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaDumbbell, FaPlus, FaEdit, FaTrash, FaSearch,
  FaUser, FaCalendar, FaClock, FaCheck, FaTimes,
  FaFilter, FaEye, FaSave, FaArrowLeft, FaSpinner,
  FaUserPlus, FaList, FaPlusCircle, FaMinusCircle,
  FaArrowRight, FaArrowLeft as FaArrowLeftIcon,
  FaMagic, FaRobot, FaSync, FaImage, FaInfoCircle
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminPrograms = () => {
  const { isDark } = useTheme();
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [adherents, setAdherents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedAdherent, setSelectedAdherent] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [generatingExercises, setGeneratingExercises] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: 'remise_en_forme',
    level: 'debutant',
    duration_weeks: 8,
    status: 'active',
    schedule: { frequency: '3 fois par semaine', duration: '45 minutes' },
    exercises: [
      { day: 'Lundi', exercises: [''] },
      { day: 'Mercredi', exercises: [''] },
      { day: 'Vendredi', exercises: [''] }
    ]
  });

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  const goals = [
    { value: 'perte_de_poids', label: 'Perte de poids', icon: '🎯', description: 'Brûlez des calories et perdez du poids' },
    { value: 'prise_de_masse', label: 'Prise de masse', icon: '💪', description: 'Développez votre masse musculaire' },
    { value: 'remise_en_forme', label: 'Remise en forme', icon: '🌟', description: 'Améliorez votre condition physique' }
  ];

  const levels = [
    { value: 'debutant', label: 'Débutant', description: 'Pour commencer en douceur' },
    { value: 'intermediaire', label: 'Intermédiaire', description: 'Pour ceux qui ont déjà de l\'expérience' },
    { value: 'avance', label: 'Avancé', description: 'Pour les sportifs confirmés' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'archived', label: 'Archivé' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programsRes, adherentsRes] = await Promise.all([
        adminService.getPrograms(),
        adminService.getUsers({ role: 'adherent' })
      ]);
      
      setPrograms(programsRes.data.programs || []);
      setFilteredPrograms(programsRes.data.programs || []);
      setAdherents(adherentsRes.data.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = programs.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term) ||
      p.goal?.toLowerCase().includes(term) ||
      p.adherent_first_name?.toLowerCase().includes(term)
    );
    setFilteredPrograms(filtered);
  };

  const handleGenerateExercises = async () => {
    setGeneratingExercises(true);
    try {
      const response = await adminService.generateExercises({
        goal: formData.goal,
        level: formData.level,
        adherent_id: selectedAdherent || null
      });
      
      if (response.data.exercises) {
        setFormData({
          ...formData,
          exercises: response.data.exercises,
          schedule: response.data.schedule || formData.schedule,
          name: formData.name || response.data.name || '',
          description: formData.description || response.data.description || ''
        });
        toast.success('🎯 Exercices générés automatiquement !');
      }
    } catch (error) {
      console.error('Error generating exercises:', error);
      toast.error('Erreur lors de la génération des exercices');
    } finally {
      setGeneratingExercises(false);
    }
  };

  useEffect(() => {
    if (autoGenerate && showCreateModal) {
      const timer = setTimeout(() => {
        handleGenerateExercises();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.goal, formData.level, selectedAdherent, autoGenerate, showCreateModal]);

  const addExerciseDay = () => {
    const availableDays = daysOfWeek.filter(
      day => !formData.exercises.some(d => d.day === day)
    );
    if (availableDays.length > 0) {
      setFormData({
        ...formData,
        exercises: [...formData.exercises, { day: availableDays[0], exercises: [''] }]
      });
    }
  };

  const removeExerciseDay = (index) => {
    if (formData.exercises.length <= 1) {
      toast.error('Vous devez avoir au moins un jour d\'entraînement');
      return;
    }
    const newExercises = formData.exercises.filter((_, i) => i !== index);
    setFormData({ ...formData, exercises: newExercises });
  };

  const addExerciseToDay = (dayIndex) => {
    const newExercises = [...formData.exercises];
    newExercises[dayIndex].exercises.push('');
    setFormData({ ...formData, exercises: newExercises });
  };

  const removeExerciseFromDay = (dayIndex, exerciseIndex) => {
    if (formData.exercises[dayIndex].exercises.length <= 1) {
      toast.error('Un jour doit avoir au moins un exercice');
      return;
    }
    const newExercises = [...formData.exercises];
    newExercises[dayIndex].exercises.splice(exerciseIndex, 1);
    setFormData({ ...formData, exercises: newExercises });
  };

  const updateExercise = (dayIndex, exerciseIndex, value) => {
    const newExercises = [...formData.exercises];
    newExercises[dayIndex].exercises[exerciseIndex] = value;
    setFormData({ ...formData, exercises: newExercises });
  };

  const updateDay = (dayIndex, value) => {
    const newExercises = [...formData.exercises];
    newExercises[dayIndex].day = value;
    setFormData({ ...formData, exercises: newExercises });
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    
    if (!autoGenerate) {
      const hasEmptyExercise = formData.exercises.some(day => 
        day.exercises.some(ex => !ex.trim())
      );
      if (hasEmptyExercise) {
        toast.error('Veuillez remplir tous les exercices');
        return;
      }
    }

    setSubmitting(true);
    try {
      const programData = {
        ...formData,
        adherent_id: selectedAdherent || null,
        auto_generate: autoGenerate
      };
      
      await adminService.createProgram(programData);
      toast.success('Programme créé avec succès');
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création du programme');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgram = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        goal: formData.goal,
        level: formData.level,
        duration_weeks: formData.duration_weeks,
        status: formData.status,
        schedule: formData.schedule,
        exercises: formData.exercises
      };
      
      await adminService.updateProgram(selectedProgram.id, updateData);
      toast.success('Programme mis à jour avec succès');
      setShowEditModal(false);
      setSelectedProgram(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating program:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour du programme');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignProgram = async () => {
    if (!selectedAdherent) {
      toast.error('Veuillez sélectionner un adhérent');
      return;
    }
    
    try {
      await adminService.assignProgram(selectedProgram.id, selectedAdherent);
      toast.success('Programme attribué avec succès');
      setShowAssignModal(false);
      setSelectedAdherent('');
      fetchData();
    } catch (error) {
      console.error('Error assigning program:', error);
      toast.error('Erreur lors de l\'attribution du programme');
    }
  };

  const handleEditClick = (program) => {
    let exercises = program.exercises || [];
    
    if (exercises.length === 0) {
      exercises = [
        { day: 'Lundi', exercises: [''] },
        { day: 'Mercredi', exercises: [''] },
        { day: 'Vendredi', exercises: [''] }
      ];
    } else {
      exercises = exercises.map(day => ({
        day: day.day || 'Lundi',
        exercises: day.exercises && day.exercises.length > 0 ? day.exercises : ['']
      }));
    }
    
    setSelectedProgram(program);
    setFormData({
      name: program.name || '',
      description: program.description || '',
      goal: program.goal || 'remise_en_forme',
      level: program.level || 'debutant',
      duration_weeks: program.duration_weeks || 8,
      status: program.status || 'active',
      schedule: program.schedule || { frequency: '3 fois par semaine', duration: '45 minutes' },
      exercises: exercises
    });
    
    setAutoGenerate(false);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      goal: 'remise_en_forme',
      level: 'debutant',
      duration_weeks: 8,
      status: 'active',
      schedule: { frequency: '3 fois par semaine', duration: '45 minutes' },
      exercises: [
        { day: 'Lundi', exercises: [''] },
        { day: 'Mercredi', exercises: [''] },
        { day: 'Vendredi', exercises: [''] }
      ]
    });
    setSelectedAdherent('');
    setAutoGenerate(true);
  };

  const handleDeleteProgram = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) return;
    
    try {
      await adminService.deleteProgram(id);
      toast.success('Programme supprimé avec succès');
      fetchData();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const showExerciseDetails = (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(true);
  };

  const getGoalColor = (goal) => {
    const colors = {
      'perte_de_poids': '#ef4444',
      'prise_de_masse': '#22c55e',
      'remise_en_forme': '#57a1ce'
    };
    return colors[goal] || '#6b7280';
  };

  const getGoalLabel = (goal) => {
    const labels = {
      'perte_de_poids': 'Perte de poids',
      'prise_de_masse': 'Prise de masse',
      'remise_en_forme': 'Remise en forme'
    };
    return labels[goal] || goal;
  };

  const getLevelLabel = (level) => {
    const labels = {
      'debutant': 'Débutant',
      'intermediaire': 'Intermédiaire',
      'avance': 'Avancé'
    };
    return labels[level] || level;
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      'cardio': '🏃',
      'musculation': '💪',
      'hiit': '🔥',
      'etirements': '🧘',
      'general': '🏋️'
    };
    return emojis[category] || '🏋️';
  };

  const renderEnrichedExercises = (exercises) => {
    if (!exercises || exercises.length === 0) {
      return <p className="text-sm text-theme-secondary">Aucun exercice</p>;
    }

    return exercises.map((day, index) => (
      <div key={index} className="mb-3 last:mb-0">
        <p className="font-medium text-theme-primary text-sm">{day.day}</p>
        <div className="ml-4 mt-1 space-y-1">
          {day.exercises.map((exercise, idx) => {
            if (typeof exercise === 'string') {
              return (
                <div key={idx} className="text-sm text-theme-secondary">
                  • {exercise}
                </div>
              );
            }
            return (
              <div 
                key={idx} 
                className="flex items-center gap-2 text-sm text-theme-secondary hover:bg-theme-hover p-1 rounded cursor-pointer"
                onClick={() => showExerciseDetails(exercise)}
              >
                <img 
                  src={exercise.image_url || '/exercises/default.jpg'} 
                  alt={exercise.name}
                  className="w-8 h-8 rounded object-cover"
                  onError={(e) => {
                    e.target.src = '/exercises/default.jpg';
                  }}
                />
                <span>{exercise.name}</span>
                {exercise.difficulty && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    exercise.difficulty === 'avance' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                    exercise.difficulty === 'intermediaire' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  }`}>
                    {exercise.difficulty}
                  </span>
                )}
                <FaInfoCircle className="text-theme-muted text-xs hover:text-theme-secondary" />
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  const renderAutoGeneratedExercises = () => {
    if (!formData.exercises || formData.exercises.length === 0) {
      return (
        <div className="text-center py-6">
          <p className="text-theme-secondary">Sélectionnez un objectif et un niveau pour générer les exercices</p>
        </div>
      );
    }

    return formData.exercises.map((day, index) => (
      <div key={index} className="bg-theme-secondary rounded-lg p-3 border border-indigo-200 dark:border-indigo-800">
        <p className="font-medium text-indigo-700 dark:text-indigo-400">{day.day}</p>
        <div className="ml-4 mt-1 space-y-1">
          {day.exercises.map((exercise, idx) => {
            if (typeof exercise === 'string') {
              return (
                <div key={idx} className="text-sm text-theme-secondary">
                  • {exercise}
                </div>
              );
            }
            return (
              <div key={idx} className="flex items-center gap-2 text-sm text-theme-secondary">
                <img 
                  src={exercise.image_url || '/exercises/default.jpg'} 
                  alt={exercise.name}
                  className="w-6 h-6 rounded object-cover"
                  onError={(e) => {
                    e.target.src = '/exercises/default.jpg';
                  }}
                />
                <span>{exercise.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  const renderExercisesSection = () => {
    if (autoGenerate) {
      return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border-2 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaRobot className="text-indigo-500 dark:text-indigo-400 text-xl" />
              <span className="font-semibold text-indigo-700 dark:text-indigo-400">Génération automatique IA</span>
            </div>
            <button
              type="button"
              onClick={handleGenerateExercises}
              disabled={generatingExercises}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
            >
              {generatingExercises ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaSync />
              )}
              Régénérer
            </button>
          </div>
          
          {generatingExercises ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="spinner w-8 h-8 border-2 border-indigo-500 border-t-transparent"></div>
                <p className="text-sm text-theme-secondary mt-2">Génération des exercices...</p>
              </div>
            </div>
          ) : (
            renderAutoGeneratedExercises()
          )}
          
          <div className="mt-3 text-xs text-theme-muted flex items-center gap-2">
            <FaMagic className="text-indigo-400" />
            Les exercices sont générés automatiquement selon l'objectif et le niveau sélectionné
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="label-custom">📋 Planning hebdomadaire</label>
          <button
            type="button"
            onClick={addExerciseDay}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
            disabled={formData.exercises.length >= 7}
          >
            <FaPlusCircle /> Ajouter un jour
          </button>
        </div>

        {formData.exercises.map((day, dayIndex) => (
          <div key={dayIndex} className="bg-theme-secondary rounded-xl p-4 border border-theme">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <select
                  value={day.day}
                  onChange={(e) => updateDay(dayIndex, e.target.value)}
                  className="input-logo"
                >
                  {daysOfWeek.map(d => (
                    <option key={d} value={d} disabled={formData.exercises.some((ex, i) => ex.day === d && i !== dayIndex)}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeExerciseDay(dayIndex)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                title="Supprimer ce jour"
              >
                <FaMinusCircle />
              </button>
            </div>

            <div className="space-y-2">
              {day.exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      className="input-logo"
                      placeholder={`Exercice ${exerciseIndex + 1}`}
                      value={exercise}
                      onChange={(e) => updateExercise(dayIndex, exerciseIndex, e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExerciseFromDay(dayIndex, exerciseIndex)}
                    className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    title="Supprimer cet exercice"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addExerciseToDay(dayIndex)}
              className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              <FaPlus className="text-xs" /> Ajouter un exercice
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-theme-primary">
                  💪 Gestion des programmes
                </h1>
                <p className="text-theme-secondary mt-1">
                  Créez des programmes personnalisés avec génération automatique d'exercices
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-logo text-sm flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                <FaPlus /> Nouveau programme
              </button>
            </div>

            <div className="bg-theme-card rounded-xl p-4 shadow-sm mb-6 border border-theme">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un programme..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="input-logo pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {filteredPrograms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPrograms.map((program) => (
                      <div
                        key={program.id}
                        className="bg-theme-card rounded-xl p-6 shadow-sm hover:shadow-md transition border border-theme"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="badge-primary">{getLevelLabel(program.level)}</span>
                              <span className={`badge`} style={{ 
                                background: `${getGoalColor(program.goal)}20`,
                                color: getGoalColor(program.goal)
                              }}>
                                {getGoalLabel(program.goal)}
                              </span>
                              <span className={`badge ${
                                program.status === 'active' ? 'badge-success' : 
                                program.status === 'inactive' ? 'badge-warning' : 
                                'badge-info'
                              }`}>
                                {program.status}
                              </span>
                              {program.source === 'fastapi' && (
                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <FaRobot className="text-xs" /> IA
                                </span>
                              )}
                              {program.confidence_score && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                  {Math.round(program.confidence_score * 100)}% confiance
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-theme-primary">{program.name}</h3>
                            <p className="text-sm text-theme-secondary mt-1 line-clamp-2">{program.description}</p>
                            <p className="text-xs text-theme-muted mt-1">
                              {program.exercises?.length || 0} jours · {program.exercises?.reduce((acc, day) => acc + day.exercises.length, 0) || 0} exercices
                            </p>
                          </div>
                        </div>

                        {program.exercises && program.exercises.length > 0 && (
                          <div className="mt-3 p-3 bg-theme-secondary rounded-lg max-h-32 overflow-y-auto border border-theme">
                            {renderEnrichedExercises(program.exercises)}
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-4 text-xs text-theme-muted">
                          <span className="flex items-center gap-1">
                            <FaCalendar /> {program.duration_weeks || 8} semaines
                          </span>
                          <span className="flex items-center gap-1">
                            <FaClock /> {program.schedule?.frequency || 'N/A'}
                          </span>
                        </div>

                        {program.adherent_first_name ? (
                          <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                              <FaUser /> Attribué à {program.adherent_first_name} {program.adherent_last_name}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-3 p-2 bg-theme-secondary rounded-lg border border-theme">
                            <p className="text-xs text-theme-muted flex items-center gap-1">
                              <FaUser /> Non attribué
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-theme">
                          <span className="text-xs text-theme-muted">
                            {new Date(program.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          <div className="flex gap-2">
                            {!program.adherent_id && (
                              <button
                                onClick={() => {
                                  setSelectedProgram(program);
                                  setShowAssignModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                                title="Attribuer à un adhérent"
                              >
                                <FaUserPlus className="text-sm" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(program)}
                              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                              title="Modifier"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDeleteProgram(program.id)}
                              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                              title="Supprimer"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-theme-card rounded-xl border border-theme">
                    <FaDumbbell className="text-6xl text-theme-muted mx-auto mb-4" />
                    <p className="text-theme-secondary">Aucun programme trouvé</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn-logo text-sm inline-block mt-4 bg-gradient-to-r from-indigo-600 to-purple-600"
                    >
                      <FaPlus className="inline mr-2" />
                      Créer un programme
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-theme">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                <FaPlus className="inline mr-2 text-indigo-600" />
                Créer un programme
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* Option de génération automatique */}
            <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoGenerate"
                  checked={autoGenerate}
                  onChange={(e) => setAutoGenerate(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="autoGenerate" className="text-sm font-medium text-gray-700">
                  Génération automatique des exercices (IA)
                </label>
                <FaMagic className="text-indigo-500" />
                <span className="text-xs text-gray-500">
                  (comme pour les adhérents)
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 ml-8">
                {autoGenerate 
                  ? 'Les exercices seront générés automatiquement selon l\'objectif et le niveau' 
                  : 'Vous pourrez saisir les exercices manuellement'}
              </p>
            </div>

            <form onSubmit={handleCreateProgram}>
              <div className="space-y-4">
                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label-custom">Nom du programme *</label>
                    <input
                      type="text"
                      required
                      className="input-logo"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Programme Perte de Poids"
                    />
                  </div>
                  <div>
                    <label className="label-custom">Attribuer à un adhérent</label>
                    <select
                      className="input-logo"
                      value={selectedAdherent}
                      onChange={(e) => setSelectedAdherent(e.target.value)}
                    >
                      <option value="">Aucun (programme générique)</option>
                      {adherents.map(adherent => (
                        <option key={adherent.id} value={adherent.id}>
                          {adherent.first_name} {adherent.last_name} ({adherent.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Sélectionnez un adhérent pour une attribution directe
                    </p>
                  </div>
                </div>

                <div>
                  <label className="label-custom">Description</label>
                  <textarea
                    className="input-logo"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du programme..."
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label-custom">Objectif</label>
                    <select
                      className="input-logo"
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    >
                      {goals.map(g => (
                        <option key={g.value} value={g.value}>{g.icon} {g.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-custom">Niveau</label>
                    <select
                      className="input-logo"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    >
                      {levels.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-custom">Durée (semaines)</label>
                    <input
                      type="number"
                      className="input-logo"
                      value={formData.duration_weeks}
                      onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                      min="1"
                      max="52"
                    />
                  </div>
                </div>

                {/* Section exercices */}
                {renderExercisesSection()}

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-logo flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin inline mr-2" />
                        Création...
                      </>
                    ) : (
                      <>
                        <FaSave className="inline mr-2" />
                        Créer le programme
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Modal d'édition (CORRIGÉ) */}
      {showEditModal && selectedProgram && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-theme">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                <FaEdit className="inline mr-2 text-indigo-600" />
                Modifier le programme
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProgram(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* ✅ En mode édition, on désactive la génération automatique */}
            <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-center gap-3">
                <FaEdit className="text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">
                  Mode édition - Modification manuelle des exercices
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 ml-8">
                Vous pouvez modifier les exercices existants ou en ajouter de nouveaux
              </p>
            </div>

            <form onSubmit={handleUpdateProgram}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label-custom">Nom du programme *</label>
                    <input
                      type="text"
                      required
                      className="input-logo"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label-custom">Statut</label>
                    <select
                      className="input-logo"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      {statusOptions.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label-custom">Description</label>
                  <textarea
                    className="input-logo"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label-custom">Objectif</label>
                    <select
                      className="input-logo"
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    >
                      {goals.map(g => (
                        <option key={g.value} value={g.value}>{g.icon} {g.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-custom">Niveau</label>
                    <select
                      className="input-logo"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    >
                      {levels.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-custom">Durée (semaines)</label>
                    <input
                      type="number"
                      className="input-logo"
                      value={formData.duration_weeks}
                      onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                      min="1"
                      max="52"
                    />
                  </div>
                </div>

                {/* Section exercices en mode manuel pour l'édition */}
                {renderExercisesSection()}

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-logo flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin inline mr-2" />
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <FaSave className="inline mr-2" />
                        Mettre à jour
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedProgram(null);
                      resetForm();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'attribution */}
      {showAssignModal && selectedProgram && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-theme-card rounded-2xl p-6 max-w-md w-full border border-theme">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              <FaUserPlus className="inline mr-2 text-green-600" />
              Attribuer le programme
            </h2>
            <p className="text-gray-600 mb-4">
              Sélectionnez un adhérent pour lui attribuer le programme <strong>{selectedProgram.name}</strong>
            </p>
            
            <div>
              <label className="label-custom">Adhérent</label>
              <select
                className="input-logo"
                value={selectedAdherent}
                onChange={(e) => setSelectedAdherent(e.target.value)}
              >
                <option value="">Sélectionner un adhérent...</option>
                {adherents.map(adherent => (
                  <option key={adherent.id} value={adherent.id}>
                    {adherent.first_name} {adherent.last_name} ({adherent.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAssignProgram}
                className="btn-logo flex-1 bg-green-500 hover:bg-green-600"
              >
                Attribuer
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedAdherent('');
                }}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails Exercice */}
      {showExerciseModal && selectedExercise && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-theme">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedExercise.name}
              </h2>
              <button
                onClick={() => {
                  setShowExerciseModal(false);
                  setSelectedExercise(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="relative h-64 bg-gray-100 rounded-xl mb-4 overflow-hidden">
              <img 
                src={selectedExercise.image_url || '/exercises/default.jpg'} 
                alt={selectedExercise.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/exercises/default.jpg';
                }}
              />
              {!selectedExercise.image_url && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <FaImage className="text-6xl text-gray-400" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {selectedExercise.category && (
                  <span className="badge-primary flex items-center gap-1">
                    {getCategoryEmoji(selectedExercise.category)} {selectedExercise.category}
                  </span>
                )}
                {selectedExercise.difficulty && (
                  <span className={`badge ${
                    selectedExercise.difficulty === 'avance' ? 'badge-danger' :
                    selectedExercise.difficulty === 'intermediaire' ? 'badge-warning' :
                    'badge-success'
                  }`}>
                    {selectedExercise.difficulty}
                  </span>
                )}
                {selectedExercise.muscle_group && (
                  <span className="badge-info">{selectedExercise.muscle_group}</span>
                )}
              </div>

              {selectedExercise.description && (
                <div>
                  <h4 className="font-semibold text-gray-800">📝 Description</h4>
                  <p className="text-gray-600">{selectedExercise.description}</p>
                </div>
              )}

              {selectedExercise.instructions && (
                <div>
                  <h4 className="font-semibold text-gray-800">📖 Instructions</h4>
                  <p className="text-gray-600">{selectedExercise.instructions}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Durée</p>
                  <p className="font-semibold text-gray-800">{selectedExercise.duration || '30 min'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Calories</p>
                  <p className="font-semibold text-gray-800">
                    {selectedExercise.calories_per_minute 
                      ? Math.round(selectedExercise.calories_per_minute * 30) 
                      : '-'} cal
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Intensité</p>
                  <p className="font-semibold text-gray-800 capitalize">
                    {selectedExercise.difficulty || 'Débutant'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowExerciseModal(false);
                  setSelectedExercise(null);
                }}
                className="btn-secondary w-full"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPrograms;