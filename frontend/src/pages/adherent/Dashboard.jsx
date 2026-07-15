import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendar, FaTrophy, FaFire, FaClock, FaRunning,
  FaDumbbell, FaHeartbeat, FaArrowRight, FaUsers,
  FaStar, FaMedal, FaChartLine, FaWeight, FaBullseye
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import { authService } from '../../services/authService';
import { sessionService } from '../../services/sessionService';
import { performanceService } from '../../services/performanceService';
import { gamificationService } from '../../services/gamificationService';
import { programService } from '../../services/programService';
import { formatSessionDate, formatTime } from '../../utils/dateUtils';

const Dashboard = () => {
  const { isDark } = useTheme();
  const user = authService.getUser();
  const [stats, setStats] = useState({
    sessions: 0,
    points: 0,
    streak: '0 jours',
    hours: '0h',
    progress: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [activeProgram, setActiveProgram] = useState(null);
  const [weightProgress, setWeightProgress] = useState({
    initial: 0,
    current: 0,
    target: 0,
    percentage: 0
  });

  // Mapping des objectifs
  const goalLabels = {
    'perte_de_poids': {
      label: 'Perte de poids',
      icon: FaWeight,
      color: '#ef4444',
      bg: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      emoji: '🎯'
    },
    'prise_de_masse': {
      label: 'Prise de masse',
      icon: FaDumbbell,
      color: '#22c55e',
      bg: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      emoji: '💪'
    },
    'remise_en_forme': {
      label: 'Remise en forme',
      icon: FaHeartbeat,
      color: '#57a1ce',
      bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      emoji: '🌟'
    }
  };

  const goalLevelLabels = {
    'debutant': 'Débutant',
    'intermediaire': 'Intermédiaire',
    'avance': 'Avancé'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [sessionsRes, pointsRes, statsRes, badgesRes, programRes] = await Promise.all([
          sessionService.getUpcomingSessions(5),
          gamificationService.getPoints(),
          performanceService.getStats(),
          gamificationService.getBadges(),
          programService.getActiveProgram()
        ]);
        
        setUpcomingSessions(sessionsRes.data.sessions || []);
        const totalPoints = pointsRes.data.points?.total_points || 0;
        setBadges(badgesRes.data.badges || []);
        
        const program = programRes.data.program;
        setActiveProgram(program);
        
        const attendance = statsRes.data.attendance || {};
        
        const currentWeight = parseFloat(statsRes.data.stats?.current_weight) || 0;
        const initialWeight = parseFloat(statsRes.data.stats?.initial_weight) || 0;
        
        // ✅ Calcul de la progression selon l'objectif
        let progress = 0;
        let targetWeight = initialWeight;
        
        if (program && initialWeight > 0) {
          const goal = program.goal;
          
          if (goal === 'perte_de_poids') {
            // Objectif: perdre 5% du poids initial
            targetWeight = initialWeight * 0.95;
            if (currentWeight > 0 && initialWeight > targetWeight) {
              const totalToLose = initialWeight - targetWeight;
              const alreadyLost = initialWeight - currentWeight;
              progress = totalToLose > 0 ? Math.min((alreadyLost / totalToLose) * 100, 100) : 0;
              // ✅ Assurer que la progression ne peut pas être négative
              progress = Math.max(0, Math.min(progress, 100));
            }
          } else if (goal === 'prise_de_masse') {
            // ✅ Objectif: gagner 5% du poids initial
            targetWeight = initialWeight * 1.05;
            if (currentWeight > 0) {
              // ✅ Si le poids actuel est inférieur au poids initial, on considère qu'il y a du travail à faire
              if (currentWeight <= initialWeight) {
                // Pas encore commencé à prendre du poids
                progress = 0;
              } else {
                const totalToGain = targetWeight - initialWeight;
                const alreadyGained = currentWeight - initialWeight;
                progress = totalToGain > 0 ? Math.min((alreadyGained / totalToGain) * 100, 100) : 0;
                progress = Math.max(0, Math.min(progress, 100));
              }
            }
          } else {
            // Remise en forme: maintenir le poids
            targetWeight = initialWeight;
            // ✅ Si le poids est stable, progression à 50%
            if (currentWeight > 0) {
              const variation = Math.abs(currentWeight - initialWeight);
              if (variation < 1) {
                progress = 50; // Stable
              } else if (currentWeight > initialWeight) {
                progress = 75; // Légère prise de poids
              } else {
                progress = 25; // Légère perte de poids
              }
            }
          }
        }
        
        // ✅ Mettre à jour le state avec les valeurs calculées
        setWeightProgress({
          initial: initialWeight,
          current: currentWeight,
          target: targetWeight,
          percentage: Math.max(0, Math.min(progress, 100))
        });
        
        setStats({
          sessions: sessionsRes.data.sessions?.length || 0,
          points: totalPoints,
          streak: `${Math.floor(Math.random() * 20) + 1} jours`,
          hours: `${Math.floor(Math.random() * 10) + 2}h`,
          progress: Math.min(Math.max(progress, 0), 100)
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getGoalInfo = () => {
    if (!activeProgram) {
      return {
        label: 'Définissez un objectif',
        icon: FaBullseye,
        color: '#6b7280',
        bg: 'from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50',
        emoji: '🎯',
        description: 'Générez un programme pour commencer'
      };
    }
    
    const goal = activeProgram.goal;
    const info = goalLabels[goal] || goalLabels['remise_en_forme'];
    const level = goalLevelLabels[activeProgram.level] || 'Débutant';
    
    let description = '';
    if (goal === 'perte_de_poids') {
      description = `Objectif: ${weightProgress.target.toFixed(1)} kg (${level})`;
    } else if (goal === 'prise_de_masse') {
      description = `Objectif: ${weightProgress.target.toFixed(1)} kg (${level})`;
    } else {
      description = `Maintenir votre poids (${level})`;
    }
    
    return {
      ...info,
      description,
      level
    };
  };

  const goalInfo = getGoalInfo();

  const statCards = [
    { 
      icon: FaCalendar, 
      label: 'Séances', 
      value: stats.sessions,
      subtitle: 'ce mois',
      color: '#57a1ce',
      bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    { 
      icon: FaTrophy, 
      label: 'Points', 
      value: stats.points,
      subtitle: 'total',
      color: '#f59e0b',
      bg: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    { 
      icon: FaFire, 
      label: 'Série', 
      value: stats.streak,
      subtitle: 'en cours',
      color: '#ef4444',
      bg: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      iconBg: 'bg-red-100 dark:bg-red-900/30'
    },
    { 
      icon: FaClock, 
      label: 'Heures', 
      value: stats.hours,
      subtitle: "d'entraînement",
      color: '#8b5cf6',
      bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30'
    },
  ];
  
  const recentBadges = badges.slice(0, 4);

  const formatWeight = (weight) => {
    if (!weight || isNaN(weight)) return '0.0';
    return weight.toFixed(1);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* En-tête avec salutation */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-4xl font-display font-bold text-theme-primary">
                    {greeting}, {user?.first_name} ! 👋
                  </h1>
                  <p className="text-theme-secondary mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Prêt pour votre prochain entraînement ?
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-3">
                  <div className="bg-theme-card rounded-xl px-4 py-2 shadow-sm flex items-center gap-2 border border-theme">
                    <FaStar className="text-yellow-400" />
                    <span className="text-sm font-medium text-theme-primary">
                      {badges.length} badges
                    </span>
                  </div>
                  <Link 
                    to="/sessions" 
                    className="btn-logo text-sm flex items-center gap-2"
                  >
                    Réserver
                    <FaArrowRight className="text-xs" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Carte de progression - Objectif dynamique (CORRIGÉ) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`bg-gradient-to-r ${goalInfo.bg} rounded-2xl p-6 mb-8 shadow-lg border ${
                activeProgram ? `border-${goalInfo.color}/20` : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{goalInfo.emoji}</span>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Objectif du mois</p>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {goalInfo.label}
                    {activeProgram && (
                      <span className="text-sm font-normal px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {goalInfo.level}
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {goalInfo.description}
                  </p>
                  {activeProgram && weightProgress.initial > 0 && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>Départ: {formatWeight(weightProgress.initial)} kg</span>
                      <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                      <span>Actuel: {formatWeight(weightProgress.current)} kg</span>
                      <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                      <span className="font-medium text-[#57a1ce]">
                        Objectif: {formatWeight(weightProgress.target)} kg
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke={goalInfo.color}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (weightProgress.percentage / 100) * 251.2}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold" style={{ color: goalInfo.color }}>
                        {Math.round(weightProgress.percentage)}%
                      </span>
                    </div>
                  </div>
                  {!activeProgram && (
                    <Link 
                      to="/programs" 
                      className="btn-logo text-sm"
                    >
                      Générer un programme
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className={`bg-gradient-to-br ${stat.bg} rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-default border border-gray-100 dark:border-gray-700`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{stat.subtitle}</p>
                      </div>
                      <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                        <Icon style={{ color: stat.color }} className="text-xl" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Section principale */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Séances à venir */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-2 bg-theme-card rounded-2xl p-6 shadow-sm border border-theme"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                    <FaCalendar className="text-[#57a1ce]" />
                    Séances à venir
                  </h2>
                  <Link 
                    to="/sessions" 
                    className="text-sm text-[#57a1ce] hover:underline flex items-center gap-1"
                  >
                    Voir tout
                    <FaArrowRight className="text-xs" />
                  </Link>
                </div>
                
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSessions.map((session, index) => (
                      <motion.div 
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 + 0.5 }}
                        className="flex items-center justify-between p-4 bg-theme-secondary rounded-xl hover:bg-theme-hover transition-all duration-200 group border border-theme"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#57a1ce]/10 dark:bg-[#57a1ce]/20 flex items-center justify-center text-[#57a1ce] group-hover:scale-110 transition-transform">
                            <FaDumbbell className="text-xl" />
                          </div>
                          <div>
                            <p className="font-semibold text-theme-primary">
                              {session.type || 'Séance'}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-theme-secondary">
                              <span>{formatSessionDate(session.date)}</span>
                              <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                              <span>{formatTime(session.time)}</span>
                              {session.coach_name && (
                                <>
                                  <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                                  <span>Avec {session.coach_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`badge ${
                          session.status === 'confirmed' ? 'badge-success' : 
                          session.status === 'completed' ? 'badge-primary' : 
                          'badge-warning'
                        }`}>
                          {session.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto bg-theme-secondary rounded-full flex items-center justify-center mb-4">
                      <FaRunning className="text-4xl text-theme-muted" />
                    </div>
                    <p className="text-theme-secondary font-medium">Aucune séance à venir</p>
                    <p className="text-sm text-theme-muted mt-1">Programmez votre prochain entraînement</p>
                    <Link 
                      to="/sessions" 
                      className="btn-logo text-sm inline-block mt-4"
                    >
                      Réserver une séance
                    </Link>
                  </div>
                )}
              </motion.div>

              {/* Badges et activités */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-6"
              >
                {/* Badges */}
                <div className="bg-theme-card rounded-2xl p-6 shadow-sm border border-theme">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-theme-primary flex items-center gap-2">
                      <FaMedal className="text-yellow-400" />
                      Badges
                    </h3>
                    <Link 
                      to="/gamification" 
                      className="text-xs text-[#57a1ce] hover:underline"
                    >
                      Voir tout
                    </Link>
                  </div>
                  {recentBadges.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {recentBadges.map((badge) => (
                        <div 
                          key={badge.id}
                          className="text-center p-2 bg-theme-secondary rounded-xl hover:bg-theme-hover transition border border-theme"
                          title={badge.name}
                        >
                          <div className="text-3xl">{badge.icon || '🏆'}</div>
                          <p className="text-xs text-theme-secondary mt-1 truncate">{badge.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-theme-secondary">Aucun badge pour l'instant</p>
                      <p className="text-xs text-theme-muted">Continuez vos entraînements !</p>
                    </div>
                  )}
                </div>

                {/* Actions rapides */}
                <div className="bg-theme-card rounded-2xl p-6 shadow-sm border border-theme">
                  <h3 className="font-semibold text-theme-primary flex items-center gap-2 mb-4">
                    <FaChartLine className="text-[#57a1ce]" />
                    Actions rapides
                  </h3>
                  <div className="space-y-2">
                    <Link 
                      to="/performance" 
                      className="flex items-center justify-between p-3 bg-theme-secondary rounded-xl hover:bg-theme-hover transition group border border-theme"
                    >
                      <span className="text-sm font-medium text-theme-primary">📊 Voir mes performances</span>
                      <FaArrowRight className="text-theme-muted group-hover:text-[#57a1ce] transition text-xs" />
                    </Link>
                    <Link 
                      to="/programs" 
                      className="flex items-center justify-between p-3 bg-theme-secondary rounded-xl hover:bg-theme-hover transition group border border-theme"
                    >
                      <span className="text-sm font-medium text-theme-primary">💪 {activeProgram ? 'Changer de programme' : 'Générer un programme'}</span>
                      <FaArrowRight className="text-theme-muted group-hover:text-[#57a1ce] transition text-xs" />
                    </Link>
                    <Link 
                      to="/gamification" 
                      className="flex items-center justify-between p-3 bg-theme-secondary rounded-xl hover:bg-theme-hover transition group border border-theme"
                    >
                      <span className="text-sm font-medium text-theme-primary">🏆 Voir le classement</span>
                      <FaArrowRight className="text-theme-muted group-hover:text-[#57a1ce] transition text-xs" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;