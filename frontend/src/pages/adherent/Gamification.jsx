import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaTrophy, FaStar, FaMedal, FaFire, 
  FaRocket, FaCrown, FaGift, FaUser,
  FaCheckCircle, FaClock, FaArrowUp,
  FaSpinner, FaInfoCircle, FaHistory, FaRunning
} from 'react-icons/fa';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import { gamificationService } from '../../services/gamificationService';
import toast from 'react-hot-toast';

const Gamification = () => {
  const [points, setPoints] = useState({ total_points: 0, badges_count: 0 });
  const [pointsHistory, setPointsHistory] = useState([]);
  const [badges, setBadges] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);
      const [pointsRes, badgesRes, challengesRes, rankingRes, historyRes] = await Promise.all([
        gamificationService.getPoints(),
        gamificationService.getBadges(),
        gamificationService.getChallenges(),
        gamificationService.getRanking(10),
        gamificationService.getPointsHistory(20)
      ]);
      
      setPoints(pointsRes.data.points || { total_points: 0, badges_count: 0 });
      setBadges(badgesRes.data.badges || []);
      setChallenges(challengesRes.data.challenges || []);
      setRanking(rankingRes.data.ranking || []);
      setPointsHistory(historyRes.data.history || []);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (badgeId) => {
    const colors = {
      1: '#FCD34D', // Or
      2: '#A78BFA', // Violet
      3: '#F472B6', // Rose
      4: '#34D399', // Vert
      5: '#F59E0B', // Jaune
      6: '#EF4444', // Rouge
      7: '#8B5CF6', // Violet clair
      8: '#EC4899', // Rose
      9: '#3B82F6', // Bleu
      10: '#14B8A6', // Turquoise
    };
    return colors[badgeId] || '#A78BFA';
  };

  const getBadgeIcon = (name) => {
    if (name?.includes('Débutant')) return <FaStar className="text-2xl" />;
    if (name?.includes('Régulier')) return <FaFire className="text-2xl" />;
    if (name?.includes('Déterminé')) return <FaRocket className="text-2xl" />;
    if (name?.includes('Expert')) return <FaCrown className="text-2xl" />;
    if (name?.includes('Légende')) return <FaCrown className="text-2xl" />;
    if (name?.includes('Marathonien')) return <FaRunning className="text-2xl" />;
    if (name?.includes('Cardio')) return <FaFire className="text-2xl" />;
    if (name?.includes('Musclé')) return <FaTrophy className="text-2xl" />;
    if (name?.includes('Persévérant')) return <FaStar className="text-2xl" />;
    if (name?.includes('Challengeur')) return <FaGift className="text-2xl" />;
    if (name?.includes('EMS')) return <FaStar className="text-2xl" />;
    if (name?.includes('I-Model')) return <FaMedal className="text-2xl" />;
    if (name?.includes('I-Shape')) return <FaMedal className="text-2xl" />;
    if (name?.includes('I-Face')) return <FaMedal className="text-2xl" />;
    if (name?.includes('Explorateur')) return <FaRocket className="text-2xl" />;
    if (name?.includes('Squat Master')) return <FaTrophy className="text-2xl" />;
    if (name?.includes('Gainage Pro')) return <FaTrophy className="text-2xl" />;
    if (name?.includes('Full Body')) return <FaTrophy className="text-2xl" />;
    if (name?.includes('Polyvalent')) return <FaMedal className="text-2xl" />;
    if (name?.includes('Transformation')) return <FaArrowUp className="text-2xl" />;
    if (name?.includes('Métamorphose')) return <FaRocket className="text-2xl" />;
    return <FaMedal className="text-2xl" />;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'facile': 'badge-success',
      'moyen': 'badge-warning',
      'difficile': 'badge-danger'
    };
    return colors[difficulty] || 'badge-info';
  };

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      'facile': 'Facile',
      'moyen': 'Moyen',
      'difficile': 'Difficile'
    };
    return labels[difficulty] || difficulty;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'completed': '✅ Terminé',
      'in_progress': '🔄 En cours',
      'not_started': '⏳ À venir'
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'completed': 'badge-success',
      'in_progress': 'badge-warning',
      'not_started': 'badge-info'
    };
    return classes[status] || 'badge-info';
  };

  // ✅ Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // ✅ Calculer la progression globale
  const getGlobalProgress = () => {
    const totalChallenges = challenges.length;
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    if (totalChallenges === 0) return 0;
    return Math.round((completedChallenges / totalChallenges) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                  🏆 Gamification
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Suivez vos points, badges et défis
                </p>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <FaHistory />
                {showHistory ? 'Masquer l\'historique' : 'Voir l\'historique'}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600 rounded-2xl p-6 text-white shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm">Points totaux</p>
                        <p className="text-4xl font-bold">{points.total_points}</p>
                      </div>
                      <FaTrophy className="text-5xl text-white/30" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-purple-400 to-purple-500 dark:from-purple-500 dark:to-purple-600 rounded-2xl p-6 text-white shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm">Badges</p>
                        <p className="text-4xl font-bold">{badges.length}</p>
                      </div>
                      <FaMedal className="text-5xl text-white/30" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-pink-400 to-rose-500 dark:from-pink-500 dark:to-rose-600 rounded-2xl p-6 text-white shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm">Défis en cours</p>
                        <p className="text-4xl font-bold">
                          {challenges.filter(c => c.status === 'in_progress').length}
                        </p>
                      </div>
                      <FaRocket className="text-5xl text-white/30" />
                    </div>
                  </motion.div>
                </div>

                {/* Barre de progression globale */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progression globale des défis
                    </span>
                    <span className="text-sm font-bold text-[#57a1ce]">
                      {getGlobalProgress()}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-gradient-to-r from-[#57a1ce] to-[#8b5cf6] rounded-full transition-all duration-500"
                      style={{ width: `${getGlobalProgress()}%` }}
                    />
                  </div>
                </div>

                {/* Historique des points */}
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaHistory className="text-[#57a1ce]" />
                      Historique des points
                    </h3>
                    {pointsHistory.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {pointsHistory.map((item, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(item.created_at)}
                              </span>
                              <span className="text-sm text-gray-800 dark:text-gray-200">
                                {item.reason}
                              </span>
                            </div>
                            <span className="font-semibold text-green-500 dark:text-green-400">
                              +{item.points} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                        Aucun historique de points
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                      <span className="font-semibold text-gray-800 dark:text-white">Total</span>
                      <span className="font-bold text-[#57a1ce]">{points.total_points} pts</span>
                    </div>
                  </motion.div>
                )}

                {/* Onglets */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { id: 'overview', label: 'Aperçu', icon: FaTrophy },
                    { id: 'badges', label: `Badges (${badges.length})`, icon: FaMedal },
                    { id: 'challenges', label: `Défis (${challenges.filter(c => c.status === 'in_progress').length})`, icon: FaRocket },
                    { id: 'ranking', label: 'Classement', icon: FaCrown }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${
                          isActive
                            ? 'bg-[#57a1ce] text-white shadow-lg'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="text-sm" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Contenu */}
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Badges récents */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            🎖️ Badges récents
                          </h3>
                          <button
                            onClick={() => setActiveTab('badges')}
                            className="text-sm text-[#57a1ce] hover:underline"
                          >
                            Voir tout →
                          </button>
                        </div>
                        {badges.length > 0 ? (
                          <div className="grid grid-cols-3 gap-4">
                            {badges.slice(0, 6).map((badge) => (
                              <div
                                key={badge.id}
                                className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:shadow-md transition border border-gray-200 dark:border-gray-600"
                              >
                                <div 
                                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-2"
                                  style={{ 
                                    background: `${getBadgeColor(badge.id)}30`,
                                    color: getBadgeColor(badge.id)
                                  }}
                                >
                                  {getBadgeIcon(badge.name)}
                                </div>
                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                  {badge.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {badge.points_required} pts
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FaMedal className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">
                              Aucun badge débloqué
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Défis en cours */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            🎯 Défis en cours
                          </h3>
                          <button
                            onClick={() => setActiveTab('challenges')}
                            className="text-sm text-[#57a1ce] hover:underline"
                          >
                            Voir tout →
                          </button>
                        </div>
                        {challenges.filter(c => c.status === 'in_progress' || c.status === 'not_started').length > 0 ? (
                          <div className="space-y-4">
                            {challenges.filter(c => c.status === 'in_progress' || c.status === 'not_started').slice(0, 3).map((challenge) => (
                              <div key={challenge.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-800 dark:text-white">
                                    {challenge.name}
                                  </span>
                                  <span className={`badge ${getDifficultyColor(challenge.difficulty)}`}>
                                    {getDifficultyLabel(challenge.difficulty)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {challenge.description}
                                </p>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {challenge.points_reward} pts
                                  </span>
                                  {challenge.status === 'in_progress' && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        <div 
                                          className="h-full bg-[#57a1ce] rounded-full"
                                          style={{ width: `${challenge.progress}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {challenge.progress}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FaGift className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">
                              Aucun défi disponible
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'badges' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      {badges.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {badges.map((badge) => (
                            <motion.div
                              key={badge.id}
                              whileHover={{ scale: 1.05 }}
                              className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:shadow-md transition border border-gray-200 dark:border-gray-600"
                            >
                              <div 
                                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-2"
                                style={{ 
                                  background: `${getBadgeColor(badge.id)}30`,
                                  color: getBadgeColor(badge.id)
                                }}
                              >
                                {getBadgeIcon(badge.name)}
                              </div>
                              <p className="font-medium text-gray-800 dark:text-white text-sm">
                                {badge.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {badge.description}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {badge.points_required} pts
                              </p>
                              {badge.awarded_at && (
                                <p className="text-xs text-green-500 dark:text-green-400 mt-2 flex items-center justify-center gap-1">
                                  <FaCheckCircle />
                                  Débloqué
                                </p>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <FaMedal className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            Aucun badge débloqué
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Continuez à vous entraîner pour débloquer des badges !
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'challenges' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      {challenges.length > 0 ? (
                        <div className="space-y-4">
                          {challenges.map((challenge) => (
                            <div
                              key={challenge.id}
                              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition"
                            >
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                  <div className="p-3 bg-[#57a1ce]/10 dark:bg-[#57a1ce]/20 rounded-xl flex-shrink-0">
                                    <FaGift className="text-[#57a1ce] text-2xl" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-white">
                                      {challenge.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {challenge.description}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                      <span>{challenge.points_reward} pts</span>
                                      <span className={`badge ${getDifficultyColor(challenge.difficulty)}`}>
                                        {getDifficultyLabel(challenge.difficulty)}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FaClock />
                                        {formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right w-full md:w-auto">
                                  <span className={`badge ${getStatusBadgeClass(challenge.status)}`}>
                                    {getStatusLabel(challenge.status)}
                                  </span>
                                  {challenge.status === 'in_progress' && (
                                    <div className="flex items-center gap-2 mt-2 justify-end">
                                      <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        <div 
                                          className="h-full bg-[#57a1ce] rounded-full"
                                          style={{ width: `${challenge.progress}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {challenge.progress}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <FaRocket className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            Aucun défi disponible pour le moment
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'ranking' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <FaCrown className="text-yellow-400 text-2xl" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          Classement des adhérents
                        </h3>
                      </div>
                      {ranking.length > 0 ? (
                        <div className="space-y-2">
                          {ranking.map((user, index) => (
                            <motion.div
                              key={user.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex items-center justify-between p-4 rounded-xl transition border ${
                                index === 0 
                                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' 
                                  : index === 1 
                                  ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
                                  : index === 2 
                                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700' 
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                  index === 0 
                                    ? 'bg-yellow-400 text-white dark:bg-yellow-500' 
                                    : index === 1 
                                    ? 'bg-gray-400 text-white dark:bg-gray-500' 
                                    : index === 2 
                                    ? 'bg-orange-400 text-white dark:bg-orange-500' 
                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                  {index + 1}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-[#57a1ce]/20 dark:bg-[#57a1ce]/30 flex items-center justify-center text-[#57a1ce] dark:text-[#7bb8de]">
                                    <FaUser />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">
                                      {user.first_name} {user.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {user.total_points} points
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {index === 0 && <FaCrown className="text-yellow-400 text-2xl" />}
                              {index === 1 && <FaMedal className="text-gray-400 dark:text-gray-500 text-2xl" />}
                              {index === 2 && <FaMedal className="text-orange-400 dark:text-orange-500 text-2xl" />}
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <FaCrown className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            Aucun classement disponible
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Gamification;