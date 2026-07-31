import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaTrophy, FaStar, FaMedal, FaFire, 
  FaRocket, FaCrown, FaGift, FaUser,
  FaCheckCircle, FaClock, FaArrowUp
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import { gamificationService } from '../../services/gamificationService';
import toast from 'react-hot-toast';

const Gamification = () => {
  const { isDark } = useTheme();
  const [points, setPoints] = useState({ total_points: 0, badges_count: 0 });
  const [badges, setBadges] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);
      const [pointsRes, badgesRes, challengesRes, rankingRes] = await Promise.all([
        gamificationService.getPoints(),
        gamificationService.getBadges(),
        gamificationService.getChallenges(),
        gamificationService.getRanking(10)
      ]);
      
      setPoints(pointsRes.data.points || { total_points: 0, badges_count: 0 });
      setBadges(badgesRes.data.badges || []);
      setChallenges(challengesRes.data.challenges || []);
      setRanking(rankingRes.data.ranking || []);
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
    };
    return colors[badgeId] || '#A78BFA';
  };

  const getBadgeIcon = (name) => {
    if (name.includes('Débutant')) return <FaStar className="text-2xl" />;
    if (name.includes('Régulier')) return <FaFire className="text-2xl" />;
    if (name.includes('Déterminé')) return <FaRocket className="text-2xl" />;
    if (name.includes('Expert')) return <FaCrown className="text-2xl" />;
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

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-display font-bold text-theme-primary mb-6">
              🏆 Gamification
            </h1>

            {loading ? (
              <div className="flex justify-center py-12">
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

                {/* Onglets */}
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-2 rounded-xl font-medium transition ${
                      activeTab === 'overview'
                        ? 'bg-[#57a1ce] text-white dark:bg-[#57a1ce] dark:text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    Aperçu
                  </button>
                  <button
                    onClick={() => setActiveTab('badges')}
                    className={`px-6 py-2 rounded-xl font-medium transition ${
                      activeTab === 'badges'
                        ? 'bg-[#57a1ce] text-white dark:bg-[#57a1ce] dark:text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    Badges
                  </button>
                  <button
                    onClick={() => setActiveTab('challenges')}
                    className={`px-6 py-2 rounded-xl font-medium transition ${
                      activeTab === 'challenges'
                        ? 'bg-[#57a1ce] text-white dark:bg-[#57a1ce] dark:text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    Défis
                  </button>
                  <button
                    onClick={() => setActiveTab('ranking')}
                    className={`px-6 py-2 rounded-xl font-medium transition ${
                      activeTab === 'ranking'
                        ? 'bg-[#57a1ce] text-white dark:bg-[#57a1ce] dark:text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    Classement
                  </button>
                </div>

                {/* Contenu */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Badges récents */}
                      <div className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme">
                        <h3 className="text-lg font-semibold text-theme-primary mb-4">
                          🎖️ Badges récents
                        </h3>
                        {badges.length > 0 ? (
                          <div className="grid grid-cols-3 gap-4">
                            {badges.slice(0, 6).map((badge) => (
                              <div
                                key={badge.id}
                                className="text-center p-4 bg-theme-secondary rounded-xl hover:bg-theme-hover transition border border-theme"
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
                                <p className="text-sm font-medium text-theme-primary">{badge.name}</p>
                                <p className="text-xs text-theme-muted">{badge.points_required} pts</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-theme-muted py-8">
                            Aucun badge débloqué
                          </p>
                        )}
                      </div>

                      {/* Défis en cours */}
                      <div className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme">
                        <h3 className="text-lg font-semibold text-theme-primary mb-4">
                          🎯 Défis en cours
                        </h3>
                        {challenges.filter(c => c.status === 'in_progress' || c.status === 'not_started').length > 0 ? (
                          <div className="space-y-4">
                            {challenges.filter(c => c.status === 'in_progress' || c.status === 'not_started').slice(0, 3).map((challenge) => (
                              <div key={challenge.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-theme-primary">{challenge.name}</span>
                                  <span className={`badge ${getDifficultyColor(challenge.difficulty)}`}>
                                    {challenge.difficulty}
                                  </span>
                                </div>
                                <p className="text-sm text-theme-secondary mb-2">{challenge.description}</p>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-theme-muted">{challenge.points_reward} pts</span>
                                  {challenge.status === 'in_progress' && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        <div 
                                          className="h-full bg-[#57a1ce] rounded-full"
                                          style={{ width: `${challenge.progress}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-theme-muted">{challenge.progress}%</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-theme-muted py-8">
                            Aucun défi disponible
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'badges' && (
                    <div className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {badges.length > 0 ? (
                          badges.map((badge) => (
                            <motion.div
                              key={badge.id}
                              whileHover={{ scale: 1.05 }}
                              className="text-center p-4 bg-theme-secondary rounded-xl hover:bg-theme-hover transition border border-theme"
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
                              <p className="font-medium text-theme-primary">{badge.name}</p>
                              <p className="text-xs text-theme-secondary mt-1">{badge.description}</p>
                              <p className="text-xs text-theme-muted mt-1">{badge.points_required} pts</p>
                              {badge.awarded_at && (
                                <p className="text-xs text-green-500 dark:text-green-400 mt-2 flex items-center justify-center gap-1">
                                  <FaCheckCircle />
                                  Débloqué
                                </p>
                              )}
                            </motion.div>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-12">
                            <FaMedal className="text-6xl text-theme-muted mx-auto mb-4" />
                            <p className="text-theme-secondary">Aucun badge débloqué</p>
                            <p className="text-sm text-theme-muted">Continuez à vous entraîner pour débloquer des badges !</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'challenges' && (
                    <div className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme">
                      <div className="space-y-4">
                        {challenges.length > 0 ? (
                          challenges.map((challenge) => (
                            <div
                              key={challenge.id}
                              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-[#57a1ce]/10 dark:bg-[#57a1ce]/20 rounded-xl">
                                    <FaGift className="text-[#57a1ce] text-2xl" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-theme-primary">{challenge.name}</h4>
                                    <p className="text-sm text-theme-secondary">{challenge.description}</p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-theme-muted">
                                      <span>{challenge.points_reward} pts</span>
                                      <span className={`badge ${getDifficultyColor(challenge.difficulty)}`}>
                                        {challenge.difficulty}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FaClock />
                                        {new Date(challenge.start_date).toLocaleDateString('fr-FR')} - {new Date(challenge.end_date).toLocaleDateString('fr-FR')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`badge ${
                                    challenge.status === 'completed' ? 'badge-success' :
                                    challenge.status === 'in_progress' ? 'badge-warning' :
                                    'badge-info'
                                  }`}>
                                    {challenge.status === 'completed' ? '✅ Terminé' :
                                     challenge.status === 'in_progress' ? '🔄 En cours' :
                                     '⏳ À venir'}
                                  </span>
                                  {challenge.status === 'in_progress' && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        <div 
                                          className="h-full bg-[#57a1ce] rounded-full"
                                          style={{ width: `${challenge.progress}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-theme-muted">{challenge.progress}%</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <FaRocket className="text-6xl text-theme-muted mx-auto mb-4" />
                            <p className="text-theme-secondary">Aucun défi disponible pour le moment</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'ranking' && (
                    <div className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme">
                      <div className="flex items-center gap-2 mb-4">
                        <FaCrown className="text-yellow-400 text-2xl" />
                        <h3 className="text-lg font-semibold text-theme-primary">Classement des adhérents</h3>
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
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.total_points} points</p>
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
                        <p className="text-center text-theme-muted py-8">
                          Aucun classement disponible
                        </p>
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