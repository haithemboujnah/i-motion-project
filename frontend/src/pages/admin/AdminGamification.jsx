import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTrophy, FaMedal, FaStar, FaFire, FaPlus,
  FaEdit, FaTrash, FaSave, FaTimes, FaGift,
  FaCalendar, FaClock, FaUsers, FaAward,
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminGamification = () => {
  const { isDark } = useTheme();
  const [badges, setBadges] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [activeTab, setActiveTab] = useState('badges');
  const [loading, setLoading] = useState(true);
  
  const [showCreateBadgeModal, setShowCreateBadgeModal] = useState(false);
  const [showEditBadgeModal, setShowEditBadgeModal] = useState(false);
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [showEditChallengeModal, setShowEditChallengeModal] = useState(false);
  
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    description: '',
    icon: '🏆',
    points_required: 0
  });

  const [challengeForm, setChallengeForm] = useState({
    name: '',
    description: '',
    difficulty: 'facile',
    points_reward: 50,
    start_date: '',
    end_date: ''
  });

  const difficultyOptions = [
    { value: 'facile', label: 'Facile', icon: '🟢', color: 'text-green-500 dark:text-green-400' },
    { value: 'moyen', label: 'Moyen', icon: '🟡', color: 'text-yellow-500 dark:text-yellow-400' },
    { value: 'difficile', label: 'Difficile', icon: '🔴', color: 'text-red-500 dark:text-red-400' }
  ];

  const iconOptions = ['🏆', '🥇', '🥈', '🥉', '⭐', '🔥', '💪', '🌟', '🎯', '👑', '🏃', '🎖️'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [badgesRes, challengesRes] = await Promise.all([
        adminService.getBadges(),
        adminService.getChallenges()
      ]);
      setBadges(badgesRes.data.badges || []);
      setChallenges(challengesRes.data.challenges || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBadge = async (e) => {
    e.preventDefault();
    
    if (!badgeForm.name || !badgeForm.description) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await adminService.createBadge(badgeForm);
      toast.success('✅ Badge créé avec succès !');
      setShowCreateBadgeModal(false);
      setBadgeForm({
        name: '',
        description: '',
        icon: '🏆',
        points_required: 0
      });
      fetchData();
    } catch (error) {
      console.error('Error creating badge:', error);
      toast.error('Erreur lors de la création du badge');
    }
  };

  const openEditBadgeModal = (badge) => {
    setSelectedBadge(badge);
    setBadgeForm({
      name: badge.name,
      description: badge.description || '',
      icon: badge.icon || '🏆',
      points_required: badge.points_required || 0
    });
    setShowEditBadgeModal(true);
  };

  const handleEditBadge = async (e) => {
    e.preventDefault();
    
    if (!selectedBadge) return;
    
    if (!badgeForm.name || !badgeForm.description) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await adminService.updateBadge(selectedBadge.id, badgeForm);
      toast.success('✅ Badge modifié avec succès !');
      setShowEditBadgeModal(false);
      setSelectedBadge(null);
      setBadgeForm({
        name: '',
        description: '',
        icon: '🏆',
        points_required: 0
      });
      fetchData();
    } catch (error) {
      console.error('Error updating badge:', error);
      toast.error('Erreur lors de la modification du badge');
    }
  };

  const handleDeleteBadge = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce badge ?')) return;
    
    try {
      await adminService.deleteBadge(id);
      toast.success('Badge supprimé avec succès');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    
    if (!challengeForm.name || !challengeForm.description || !challengeForm.start_date || !challengeForm.end_date) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (new Date(challengeForm.start_date) > new Date(challengeForm.end_date)) {
      toast.error('La date de début doit être antérieure à la date de fin');
      return;
    }

    try {
      await adminService.createChallenge(challengeForm);
      toast.success('✅ Challenge créé avec succès !');
      setShowCreateChallengeModal(false);
      setChallengeForm({
        name: '',
        description: '',
        difficulty: 'facile',
        points_reward: 50,
        start_date: '',
        end_date: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Erreur lors de la création du challenge');
    }
  };

  const handleEditChallenge = async (e) => {
    e.preventDefault();
    
    if (!selectedChallenge) return;

    try {
      await adminService.updateChallenge(selectedChallenge.id, challengeForm);
      toast.success('✅ Challenge modifié avec succès !');
      setShowEditChallengeModal(false);
      setSelectedChallenge(null);
      setChallengeForm({
        name: '',
        description: '',
        difficulty: 'facile',
        points_reward: 50,
        start_date: '',
        end_date: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast.error('Erreur lors de la modification du challenge');
    }
  };

  const handleDeleteChallenge = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce challenge ?')) return;
    
    try {
      await adminService.deleteChallenge(id);
      toast.success('Challenge supprimé avec succès');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEditChallengeModal = (challenge) => {
    setSelectedChallenge(challenge);
    setChallengeForm({
      name: challenge.name,
      description: challenge.description,
      difficulty: challenge.difficulty,
      points_reward: challenge.points_reward,
      start_date: challenge.start_date?.split('T')[0] || '',
      end_date: challenge.end_date?.split('T')[0] || ''
    });
    setShowEditChallengeModal(true);
  };

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      'facile': 'badge-success',
      'moyen': 'badge-warning',
      'difficile': 'badge-danger'
    };
    return colors[difficulty] || 'badge-info';
  };

  const getDifficultyIcon = (difficulty) => {
    const icons = {
      'facile': '🟢',
      'moyen': '🟡',
      'difficile': '🔴'
    };
    return icons[difficulty] || '⚪';
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
                  🏆 Gamification
                </h1>
                <p className="text-theme-secondary mt-1">
                  Gérez les badges et challenges
                </p>
              </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('badges')}
                className={`px-6 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${
                  activeTab === 'badges'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-theme-card text-theme-secondary hover:bg-theme-hover border border-theme'
                }`}
              >
                <FaMedal className="text-sm" />
                Badges ({badges.length})
              </button>
              <button
                onClick={() => setActiveTab('challenges')}
                className={`px-6 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${
                  activeTab === 'challenges'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-theme-card text-theme-secondary hover:bg-theme-hover border border-theme'
                }`}
              >
                <FaGift className="text-sm" />
                Challenges ({challenges.length})
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'badges' ? (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-theme-primary">
                          Tous les badges
                        </h2>
                        <button
                          onClick={() => setShowCreateBadgeModal(true)}
                          className="btn-logo text-sm flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
                        >
                          <FaPlus /> Ajouter un badge
                        </button>
                      </div>
                      {badges.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {badges.map((badge) => (
                            <div
                              key={badge.id}
                              className="bg-theme-card rounded-xl p-4 shadow-sm hover:shadow-md transition text-center border border-theme"
                            >
                              <div className="text-4xl mb-2">{badge.icon}</div>
                              <p className="font-medium text-theme-primary text-sm">{badge.name}</p>
                              <p className="text-xs text-theme-secondary mt-1">{badge.description}</p>
                              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                {badge.points_required} pts
                              </p>
                              <div className="flex justify-center gap-2 mt-3 pt-3 border-t border-theme">
                                <button
                                  onClick={() => openEditBadgeModal(badge)}
                                  className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                  title="Modifier"
                                >
                                  <FaEdit className="text-sm" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBadge(badge.id)}
                                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                                  title="Supprimer"
                                >
                                  <FaTrash className="text-sm" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-theme-card rounded-xl border border-theme">
                          <FaMedal className="text-6xl text-theme-muted mx-auto mb-4" />
                          <p className="text-theme-secondary">Aucun badge</p>
                          <button
                            onClick={() => setShowCreateBadgeModal(true)}
                            className="btn-logo text-sm inline-block mt-4 bg-gradient-to-r from-indigo-600 to-purple-600"
                          >
                            <FaPlus className="inline mr-2" />
                            Créer le premier badge
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-theme-primary">
                          Tous les challenges
                        </h2>
                        <button
                          onClick={() => setShowCreateChallengeModal(true)}
                          className="btn-logo text-sm flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
                        >
                          <FaPlus /> Créer un challenge
                        </button>
                      </div>

                      {challenges.length > 0 ? (
                        <div className="space-y-4">
                          {challenges.map((challenge) => (
                            <div
                              key={challenge.id}
                              className="bg-theme-card rounded-xl p-6 shadow-sm hover:shadow-md transition border border-theme"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                  <div className="text-4xl">
                                    {getDifficultyIcon(challenge.difficulty)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <h3 className="text-lg font-semibold text-theme-primary">
                                        {challenge.name}
                                      </h3>
                                      <span className={`badge ${getDifficultyBadge(challenge.difficulty)}`}>
                                        {challenge.difficulty}
                                      </span>
                                      <span className="badge-primary">
                                        {challenge.points_reward} pts
                                      </span>
                                    </div>
                                    <p className="text-sm text-theme-secondary mt-1">{challenge.description}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-theme-muted">
                                      <span className="flex items-center gap-1">
                                        <FaCalendar className="text-sm" />
                                        Début: {new Date(challenge.start_date).toLocaleDateString('fr-FR')}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FaCalendar className="text-sm" />
                                        Fin: {new Date(challenge.end_date).toLocaleDateString('fr-FR')}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FaClock className="text-sm" />
                                        {Math.ceil((new Date(challenge.end_date) - new Date(challenge.start_date)) / (1000 * 60 * 60 * 24))} jours
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openEditChallengeModal(challenge)}
                                    className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                    title="Modifier"
                                  >
                                    <FaEdit className="text-sm" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteChallenge(challenge.id)}
                                    className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
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
                          <FaGift className="text-6xl text-theme-muted mx-auto mb-4" />
                          <p className="text-theme-secondary">Aucun challenge</p>
                          <button
                            onClick={() => setShowCreateChallengeModal(true)}
                            className="btn-logo text-sm inline-block mt-4 bg-gradient-to-r from-indigo-600 to-purple-600"
                          >
                            <FaPlus className="inline mr-2" />
                            Créer le premier challenge
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>

      {/* ==================== MODAL CRÉATION BADGE ==================== */}
      {showCreateBadgeModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-theme-card rounded-2xl p-6 max-w-md w-full border border-theme"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  🏅 Créer un badge
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Définissez un nouveau badge pour les adhérents
                </p>
              </div>
              <button
                onClick={() => setShowCreateBadgeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateBadge}>
              <div className="space-y-4">
                <div>
                  <label className="label-custom">Nom du badge *</label>
                  <input
                    type="text"
                    required
                    className="input-logo"
                    value={badgeForm.name}
                    onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                    placeholder="Ex: Expert"
                  />
                </div>
                <div>
                  <label className="label-custom">Description *</label>
                  <textarea
                    className="input-logo"
                    rows="2"
                    required
                    value={badgeForm.description}
                    onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                    placeholder="Description du badge..."
                  />
                </div>
                <div>
                  <label className="label-custom">Icône</label>
                  <div className="grid grid-cols-5 gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={`p-2 rounded-lg text-2xl transition ${
                          badgeForm.icon === icon
                            ? 'bg-indigo-100 border-2 border-indigo-500'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setBadgeForm({ ...badgeForm, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-custom">Points requis</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input-logo"
                    value={badgeForm.points_required}
                    onChange={(e) => setBadgeForm({ ...badgeForm, points_required: parseInt(e.target.value) || 0 })}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="btn-logo flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <FaSave className="inline mr-2" />
                  Créer le badge
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateBadgeModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ==================== MODAL ÉDITION BADGE ==================== */}
      {showEditBadgeModal && selectedBadge && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-theme-card rounded-2xl p-6 max-w-md w-full border border-theme"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  ✏️ Modifier le badge
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedBadge.name}
                </p>
              </div>
              <button
                onClick={() => setShowEditBadgeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditBadge}>
              <div className="space-y-4">
                <div>
                  <label className="label-custom">Nom du badge *</label>
                  <input
                    type="text"
                    required
                    className="input-logo"
                    value={badgeForm.name}
                    onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                    placeholder="Ex: Expert"
                  />
                </div>
                <div>
                  <label className="label-custom">Description *</label>
                  <textarea
                    className="input-logo"
                    rows="2"
                    required
                    value={badgeForm.description}
                    onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                    placeholder="Description du badge..."
                  />
                </div>
                <div>
                  <label className="label-custom">Icône</label>
                  <div className="grid grid-cols-5 gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={`p-2 rounded-lg text-2xl transition ${
                          badgeForm.icon === icon
                            ? 'bg-indigo-100 border-2 border-indigo-500'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setBadgeForm({ ...badgeForm, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-custom">Points requis</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input-logo"
                    value={badgeForm.points_required}
                    onChange={(e) => setBadgeForm({ ...badgeForm, points_required: parseInt(e.target.value) || 0 })}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="btn-logo flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <FaSave className="inline mr-2" />
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditBadgeModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ==================== MODAL CRÉATION CHALLENGE ==================== */}
      {showCreateChallengeModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-theme-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-theme"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  🎯 Créer un challenge
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Définissez un nouveau défi pour les adhérents
                </p>
              </div>
              <button
                onClick={() => setShowCreateChallengeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge}>
              <div className="space-y-4">
                <div>
                  <label className="label-custom">Nom du challenge *</label>
                  <input
                    type="text"
                    required
                    className="input-logo"
                    value={challengeForm.name}
                    onChange={(e) => setChallengeForm({ ...challengeForm, name: e.target.value })}
                    placeholder="Ex: Challenge Cardio"
                  />
                </div>
                <div>
                  <label className="label-custom">Description *</label>
                  <textarea
                    className="input-logo"
                    rows="3"
                    required
                    value={challengeForm.description}
                    onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                    placeholder="Décrivez le challenge..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-custom">Difficulté</label>
                    <div className="grid grid-cols-3 gap-2">
                      {difficultyOptions.map((diff) => (
                        <button
                          key={diff.value}
                          type="button"
                          className={`p-3 rounded-xl border-2 text-center transition ${
                            challengeForm.difficulty === diff.value
                              ? 'border-indigo-500 bg-indigo-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setChallengeForm({ ...challengeForm, difficulty: diff.value })}
                        >
                          <div className="text-2xl">{diff.icon}</div>
                          <p className={`text-xs font-medium ${
                            challengeForm.difficulty === diff.value 
                              ? 'text-indigo-600' 
                              : 'text-gray-600'
                          }`}>
                            {diff.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label-custom">Points de récompense *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="input-logo"
                      value={challengeForm.points_reward}
                      onChange={(e) => setChallengeForm({ ...challengeForm, points_reward: parseInt(e.target.value) || 0 })}
                      placeholder="50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-custom">Date de début *</label>
                    <input
                      type="date"
                      required
                      className="input-logo"
                      value={challengeForm.start_date}
                      onChange={(e) => setChallengeForm({ ...challengeForm, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label-custom">Date de fin *</label>
                    <input
                      type="date"
                      required
                      className="input-logo"
                      value={challengeForm.end_date}
                      onChange={(e) => setChallengeForm({ ...challengeForm, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="btn-logo flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <FaSave className="inline mr-2" />
                  Créer le challenge
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateChallengeModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ==================== MODAL ÉDITION CHALLENGE ==================== */}
      {showEditChallengeModal && selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-theme-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-theme"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  ✏️ Modifier le challenge
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedChallenge.name}
                </p>
              </div>
              <button
                onClick={() => setShowEditChallengeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditChallenge}>
              <div className="space-y-4">
                <div>
                  <label className="label-custom">Nom du challenge *</label>
                  <input
                    type="text"
                    required
                    className="input-logo"
                    value={challengeForm.name}
                    onChange={(e) => setChallengeForm({ ...challengeForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-custom">Description *</label>
                  <textarea
                    className="input-logo"
                    rows="3"
                    required
                    value={challengeForm.description}
                    onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-custom">Difficulté</label>
                    <div className="grid grid-cols-3 gap-2">
                      {difficultyOptions.map((diff) => (
                        <button
                          key={diff.value}
                          type="button"
                          className={`p-3 rounded-xl border-2 text-center transition ${
                            challengeForm.difficulty === diff.value
                              ? 'border-indigo-500 bg-indigo-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setChallengeForm({ ...challengeForm, difficulty: diff.value })}
                        >
                          <div className="text-2xl">{diff.icon}</div>
                          <p className={`text-xs font-medium ${
                            challengeForm.difficulty === diff.value 
                              ? 'text-indigo-600' 
                              : 'text-gray-600'
                          }`}>
                            {diff.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label-custom">Points de récompense *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="input-logo"
                      value={challengeForm.points_reward}
                      onChange={(e) => setChallengeForm({ ...challengeForm, points_reward: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-custom">Date de début *</label>
                    <input
                      type="date"
                      required
                      className="input-logo"
                      value={challengeForm.start_date}
                      onChange={(e) => setChallengeForm({ ...challengeForm, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label-custom">Date de fin *</label>
                    <input
                      type="date"
                      required
                      className="input-logo"
                      value={challengeForm.end_date}
                      onChange={(e) => setChallengeForm({ ...challengeForm, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="btn-logo flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <FaSave className="inline mr-2" />
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditChallengeModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminGamification;