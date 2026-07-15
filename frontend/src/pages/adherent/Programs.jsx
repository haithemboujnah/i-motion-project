import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaDumbbell, FaCalendar, FaClock, FaCheck, 
  FaPlus, FaChartLine, FaFire, FaBrain,
  FaRuler, FaWeight, FaHeart, FaInfoCircle,
  FaTimes, FaPlay, FaImage, FaRobot, FaStar
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import { programService } from '../../services/programService';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const Programs = () => {
  const { isDark } = useTheme();
  const [programs, setPrograms] = useState([]);
  const [activeProgram, setActiveProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    goal: 'remise_en_forme',
    level: 'debutant'
  });

  const goals = [
    { value: 'perte_de_poids', label: 'Perte de poids', icon: FaFire, color: '#ef4444', description: 'Brûlez des calories et perdez du poids' },
    { value: 'prise_de_masse', label: 'Prise de masse', icon: FaDumbbell, color: '#22c55e', description: 'Développez votre masse musculaire' },
    { value: 'remise_en_forme', label: 'Remise en forme', icon: FaHeart, color: '#57a1ce', description: 'Améliorez votre condition physique' }
  ];

  const levels = [
    { value: 'debutant', label: 'Débutant', icon: FaRuler, description: 'Pour commencer en douceur' },
    { value: 'intermediaire', label: 'Intermédiaire', icon: FaChartLine, description: 'Pour ceux qui ont déjà de l\'expérience' },
    { value: 'avance', label: 'Avancé', icon: FaBrain, description: 'Pour les sportifs confirmés' }
  ];

  useEffect(() => {
    fetchPrograms();
    fetchUserProfile();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const [programsRes, activeRes] = await Promise.all([
        programService.getMyPrograms(),
        programService.getActiveProgram()
      ]);
      setPrograms(programsRes.data.programs || []);
      setActiveProgram(activeRes.data.program || null);
    } catch (error) {
      console.error('Error fetching programs:', error);
      if (error.response?.status === 404) {
        setActiveProgram(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await authService.getCurrentUser();
      setUserProfile(response.data.profile);
      if (response.data.profile) {
        setFormData({
          goal: response.data.profile.goal || 'remise_en_forme',
          level: response.data.profile.level || 'debutant'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleGenerateProgram = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const response = await programService.generateProgram(formData);
      
      const confidence = response.data.confidence_score;
      const source = response.data.source || 'local';
      const confidenceText = confidence 
        ? ` (Confiance: ${Math.round(confidence * 100)}%)` 
        : '';
      const sourceText = source === 'fastapi' ? ' 🤖 IA' : ' 📋';
      
      toast.success(`🎉 Programme généré avec succès !${sourceText}${confidenceText}`);
      
      setShowGenerateModal(false);
      fetchPrograms();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  const getGoalColor = (goal) => {
    const found = goals.find(g => g.value === goal);
    return found ? found.color : '#57a1ce';
  };

  const getGoalIcon = (goal) => {
    const found = goals.find(g => g.value === goal);
    return found ? found.icon : FaHeart;
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      'debutant': { label: 'Débutant', className: 'badge-success' },
      'intermediaire': { label: 'Intermédiaire', className: 'badge-warning' },
      'avance': { label: 'Avancé', className: 'badge-danger' }
    };
    return badges[difficulty] || badges['debutant'];
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

  const getConfidenceColor = (score) => {
    if (!score) return 'text-gray-400';
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    if (score >= 0.4) return 'text-orange-500';
    return 'text-red-500';
  };

  const getConfidenceIcon = (score) => {
    if (!score) return <FaStar className="text-gray-300" />;
    if (score >= 0.8) return <FaStar className="text-green-500" />;
    if (score >= 0.6) return <FaStar className="text-yellow-500" />;
    if (score >= 0.4) return <FaStar className="text-orange-500" />;
    return <FaStar className="text-red-500" />;
  };

  const getConfidenceLabel = (score) => {
    if (!score) return 'Non évalué';
    if (score >= 0.8) return 'Très bonne confiance';
    if (score >= 0.6) return 'Bonne confiance';
    if (score >= 0.4) return 'Confiance moyenne';
    return 'Confiance faible';
  };

  const showExerciseDetails = (exercise) => {
    setSelectedExercise(exercise);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-theme-primary">
                  💪 Programmes
                </h1>
                <p className="text-theme-secondary mt-1 text-sm">
                  {activeProgram?.confidence_score && (
                    <span className="flex items-center gap-2">
                      <FaRobot className="text-[#57a1ce]" />
                      Programme généré par IA avec un score de confiance de {Math.round(activeProgram.confidence_score * 100)}%
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="btn-logo text-sm flex items-center gap-2"
              >
                <FaPlus /> Générer un programme
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {/* ✅ Programme actif - CORRIGÉ avec gradient adaptatif */}
                {activeProgram ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-6 md:p-8 text-white mb-8 shadow-lg border border-gray-200 dark:border-gray-700"
                    style={{
                      background: isDark 
                        ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                        : 'linear-gradient(135deg, #57a1ce 0%, #afadb3 100%)'
                    }}
                  >
                    <div className="flex flex-col md:flex-row items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                            ✅ Programme actif
                          </span>
                          <span className="bg-white/20 px-3 py-1 rounded-full text-sm capitalize">
                            {activeProgram.level}
                          </span>
                          <span className="bg-white/20 px-3 py-1 rounded-full text-sm capitalize">
                            {activeProgram.goal}
                          </span>
                          {activeProgram.source === 'fastapi' && (
                            <span className="bg-purple-500/50 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                              <FaRobot className="text-xs" /> IA
                            </span>
                          )}
                          {activeProgram.confidence_score && (
                            <span className="px-3 py-1 rounded-full text-sm flex items-center gap-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
                              {getConfidenceIcon(activeProgram.confidence_score)}
                              {Math.round(activeProgram.confidence_score * 100)}%
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{activeProgram.name}</h2>
                        <p className="text-white/80 dark:text-gray-300 mb-4">{activeProgram.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/80 dark:text-gray-300">
                          <span className="flex items-center gap-2">
                            <FaCalendar />
                            {activeProgram.duration_weeks || 8} semaines
                          </span>
                          <span className="flex items-center gap-2">
                            <FaClock />
                            {activeProgram.schedule?.frequency || '3 fois/semaine'}
                          </span>
                          {activeProgram.schedule?.duration && (
                            <span className="flex items-center gap-2">
                              <FaClock />
                              {activeProgram.schedule.duration}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 p-3 bg-white/20 rounded-xl flex items-center gap-2">
                        {React.createElement(getGoalIcon(activeProgram.goal), { className: "text-3xl" })}
                        <span className="text-sm font-medium">Objectif</span>
                      </div>
                    </div>

                    {activeProgram.confidence_score && (
                      <div className="mt-4 p-3 bg-white/10 dark:bg-white/5 rounded-lg border border-white/20 dark:border-white/10">
                        <div className="flex items-center gap-3">
                          <FaInfoCircle className="text-white/70 dark:text-white/50" />
                          <p className="text-sm text-white/80 dark:text-gray-300">
                            <span className="font-medium">Score de confiance: </span>
                            {getConfidenceLabel(activeProgram.confidence_score)} ({Math.round(activeProgram.confidence_score * 100)}%)
                            {activeProgram.explanation && (
                              <span className="block text-xs text-white/60 dark:text-gray-400 mt-1">
                                {activeProgram.explanation}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeProgram.exercises && activeProgram.exercises.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-white dark:text-gray-200 mb-4 flex items-center gap-2">
                          📋 Planning hebdomadaire
                          <span className="text-sm font-normal text-white/70 dark:text-gray-400">
                            ({activeProgram.exercises.length} jours)
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {activeProgram.exercises.map((day, index) => (
                            <div key={index} className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 dark:hover:bg-white/10 transition">
                              <h5 className="font-semibold text-white dark:text-gray-200 mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                                  {index + 1}
                                </span>
                                {day.day}
                              </h5>
                              <div className="space-y-3">
                                {day.exercises && day.exercises.map((exercise, idx) => {
                                  if (typeof exercise === 'string') {
                                    return (
                                      <div key={idx} className="bg-white/5 rounded-lg p-2">
                                        <p className="text-sm text-white/90 dark:text-gray-300">{exercise}</p>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div 
                                      key={idx} 
                                      className="bg-white/5 dark:bg-white/5 rounded-lg p-2 hover:bg-white/10 dark:hover:bg-white/10 transition cursor-pointer group"
                                      onClick={() => showExerciseDetails(exercise)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <img 
                                          src={exercise.image_url || '/exercises/default.jpg'} 
                                          alt={exercise.name}
                                          className="w-12 h-12 rounded-lg object-cover bg-white/10 dark:bg-white/5"
                                          onError={(e) => {
                                            e.target.src = '/exercises/default.jpg';
                                          }}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-white dark:text-gray-200 truncate">
                                            {exercise.name}
                                          </p>
                                          <div className="flex items-center gap-2 text-xs text-white/70 dark:text-gray-400">
                                            <span>⏱ {exercise.duration || '30 min'}</span>
                                            {exercise.calories_per_minute && (
                                              <span>🔥 {Math.round(exercise.calories_per_minute * 30)} cal</span>
                                            )}
                                            {exercise.difficulty && (
                                              <span className={`capitalize px-1.5 py-0.5 rounded ${
                                                exercise.difficulty === 'avance' ? 'bg-red-500/30' :
                                                exercise.difficulty === 'intermediaire' ? 'bg-yellow-500/30' :
                                                'bg-green-500/30'
                                              }`}>
                                                {exercise.difficulty}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <button 
                                          className="text-white/30 hover:text-white transition text-xs p-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            showExerciseDetails(exercise);
                                          }}
                                        >
                                          <FaInfoCircle />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="bg-theme-card rounded-xl p-8 shadow-sm text-center mb-8 border border-theme">
                    <FaDumbbell className="text-6xl text-theme-muted mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-theme-primary mb-2">
                      Aucun programme actif
                    </h3>
                    <p className="text-theme-secondary mb-4">
                      Générez un programme personnalisé pour commencer votre entraînement
                    </p>
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      className="btn-logo"
                    >
                      Générer mon programme
                    </button>
                  </div>
                )}

                {/* Historique des programmes */}
                {programs.length > 0 && (
                  <div className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme">
                    <h3 className="text-xl font-semibold text-theme-primary mb-4 flex items-center gap-2">
                      📋 Historique des programmes
                      <span className="text-sm font-normal text-theme-muted">
                        ({programs.length} programmes)
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {programs.slice(0, 5).map((program) => {
                        const Icon = getGoalIcon(program.goal);
                        const goalColor = getGoalColor(program.goal);
                        return (
                          <div
                            key={program.id}
                            className={`border rounded-xl p-4 hover:shadow-md transition ${
                              program.id === activeProgram?.id 
                                ? 'border-[#57a1ce] bg-[#57a1ce]/5 dark:bg-[#57a1ce]/10' 
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-4">
                                <div 
                                  className="p-3 rounded-xl"
                                  style={{ 
                                    background: `${goalColor}15`,
                                    color: goalColor
                                  }}
                                >
                                  <Icon className="text-2xl" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-theme-primary flex items-center gap-2 flex-wrap">
                                    {program.name}
                                    {program.id === activeProgram?.id && (
                                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                                        Actif
                                      </span>
                                    )}
                                    {program.confidence_score && (
                                      <span className={`text-xs flex items-center gap-1 ${getConfidenceColor(program.confidence_score)}`}>
                                        {getConfidenceIcon(program.confidence_score)}
                                        {Math.round(program.confidence_score * 100)}% confiance
                                      </span>
                                    )}
                                    {program.source === 'fastapi' && (
                                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <FaRobot className="text-xs" /> IA
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-sm text-theme-secondary">{program.description}</p>
                                  <div className="flex items-center gap-4 mt-1 text-xs text-theme-muted">
                                    <span className="capitalize">Objectif: {program.goal}</span>
                                    <span className="capitalize">Niveau: {program.level}</span>
                                    <span className="capitalize">Statut: {program.status}</span>
                                    <span>
                                      Créé le {new Date(program.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className={`badge ${
                                program.status === 'active' ? 'badge-success' : 'badge-info'
                              }`}>
                                {program.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {programs.length > 5 && (
                        <p className="text-sm text-theme-muted text-center">
                          + {programs.length - 5} autres programmes
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal de génération - Dark Mode support */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-card rounded-2xl p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                🎯 Générer un programme
              </h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Personnalisez votre programme selon vos objectifs et votre niveau
            </p>

            <form onSubmit={handleGenerateProgram}>
              <div className="space-y-6">
                <div>
                  <label className="label-custom text-gray-700 dark:text-gray-300">Objectif</label>
                  <div className="grid grid-cols-1 gap-2">
                    {goals.map((goal) => {
                      const Icon = goal.icon;
                      const isSelected = formData.goal === goal.value;
                      return (
                        <button
                          key={goal.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, goal: goal.value })}
                          className={`p-4 rounded-xl border-2 text-left transition ${
                            isSelected
                              ? 'border-[#57a1ce] bg-[#57a1ce]/10 dark:bg-[#57a1ce]/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon 
                              className="text-2xl"
                              style={{ color: isSelected ? '#57a1ce' : goal.color }}
                            />
                            <div>
                              <p className={`font-medium ${isSelected ? 'text-[#57a1ce]' : 'text-gray-800 dark:text-gray-200'}`}>
                                {goal.label}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{goal.description}</p>
                            </div>
                            {isSelected && (
                              <FaCheck className="ml-auto text-[#57a1ce]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="label-custom text-gray-700 dark:text-gray-300">Niveau</label>
                  <div className="grid grid-cols-3 gap-2">
                    {levels.map((level) => {
                      const Icon = level.icon;
                      const isSelected = formData.level === level.value;
                      return (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, level: level.value })}
                          className={`p-3 rounded-xl border-2 text-center transition ${
                            isSelected
                              ? 'border-[#57a1ce] bg-[#57a1ce]/10 dark:bg-[#57a1ce]/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <Icon 
                            className="text-2xl mx-auto mb-1"
                            style={{ color: isSelected ? '#57a1ce' : '#6b7280' }}
                          />
                          <p className={`text-xs font-medium ${
                            isSelected ? 'text-[#57a1ce]' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {level.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {levels.find(l => l.value === formData.level)?.description}
                  </p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                    <FaRobot className="text-blue-500 dark:text-blue-400" />
                    <span>Génération par intelligence artificielle</span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Le programme sera personnalisé selon votre profil avec un score de confiance associé
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={generating}
                  className="btn-logo flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white inline-block mr-2"></div>
                      Génération...
                    </>
                  ) : (
                    'Générer'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="btn-secondary flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Détails Exercice - Dark Mode support */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedExercise.name}
              </h2>
              <button
                onClick={() => setSelectedExercise(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="relative h-64 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4 overflow-hidden">
              <img 
                src={selectedExercise.image_url || '/exercises/default.jpg'} 
                alt={selectedExercise.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/exercises/default.jpg';
                }}
              />
              {!selectedExercise.image_url && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                  <FaImage className="text-6xl text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {selectedExercise.category && (
                  <span className="badge-primary dark:bg-[#57a1ce]/20 dark:text-[#57a1ce] flex items-center gap-1">
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
                  <span className="badge-info dark:bg-blue-900/30 dark:text-blue-400">{selectedExercise.muscle_group}</span>
                )}
              </div>

              {selectedExercise.description && (
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">📝 Description</h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedExercise.description}</p>
                </div>
              )}

              {selectedExercise.instructions && (
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">📖 Instructions</h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedExercise.instructions}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Durée</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedExercise.duration || '30 min'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Calories</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {selectedExercise.calories_per_minute 
                      ? Math.round(selectedExercise.calories_per_minute * 30) 
                      : '-'} cal
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Intensité</p>
                  <p className="font-semibold text-gray-800 dark:text-white capitalize">
                    {selectedExercise.difficulty || 'Débutant'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedExercise(null)}
                className="btn-secondary w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Programs;