import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHome, FaCalendar, FaChartLine, FaBookOpen,
  FaDumbbell, FaTrophy, FaBell, FaUser, FaHistory, FaQrcode,
  FaRunning, FaFire, FaStar, FaArrowLeft, FaCrown, FaRobot,
  FaComment
} from 'react-icons/fa';
import { gamificationService } from '../../services/gamificationService';
import { sessionService } from '../../services/sessionService';
import { performanceService } from '../../services/performanceService';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = () => {
  const { isDark } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [stats, setStats] = useState({
    points: 0,
    streak: '0 jours',
    sessions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const pointsRes = await gamificationService.getPoints();
      const totalPoints = pointsRes.data.points?.total_points || 0;
      
      const sessionsRes = await sessionService.getMySessions();
      const sessions = sessionsRes.data.sessions || [];
      
      const streak = calculateStreak(sessions);
      
      const statsRes = await performanceService.getStats();
      const attendance = statsRes.data.attendance || {};
      
      setStats({
        points: totalPoints,
        streak: `${streak} jour${streak > 1 ? 's' : ''}`,
        sessions: attendance.total || 0
      });
    } catch (error) {
      console.error('Error fetching sidebar stats:', error);
      setStats({
        points: 0,
        streak: '0 jours',
        sessions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (sessions) => {
    if (!sessions || sessions.length === 0) return 0;
    
    const sortedSessions = [...sessions]
      .filter(s => s.status === 'completed' || s.status === 'confirmed')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedSessions.length === 0) return 0;
    
    let streak = 1;
    const today = new Date();
    const lastSessionDate = new Date(sortedSessions[0].date);
    const diffDays = Math.floor((today - lastSessionDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) return 0;
    
    for (let i = 1; i < sortedSessions.length; i++) {
      const prevDate = new Date(sortedSessions[i - 1].date);
      const currDate = new Date(sortedSessions[i].date);
      const dayDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        streak++;
      } else if (dayDiff > 1) {
        break;
      }
    }
    
    return streak;
  };

  const menuItems = [
    { path: '/dashboard', icon: FaHome, label: 'Tableau de bord', description: "Vue d'ensemble", badge: null },
    { path: '/sessions', icon: FaCalendar, label: 'Séances', description: 'Réserver et gérer', badge: null },
    { path: '/performance', icon: FaChartLine, label: 'Performances', description: 'Suivi de progression', badge: null },
    { path: '/programs', icon: FaDumbbell, label: 'Programmes', description: 'Personnalisés', badge: 'IA' },
    { path: '/exercises', icon: FaBookOpen, label: 'Exercices', description: 'Bibliothèque', badge: null },
    { path: '/subscription', icon: FaCrown, label: 'Abonnement', description: 'Gérer mon abonnement', badge: "€"}, 
    { path: '/payment/history', icon: FaHistory, label: 'Historique Paiements', description: 'Mes transactions', badge: null},
    { path: '/gamification', icon: FaTrophy, label: 'Gamification', description: 'Points et badges', badge: null },
    { path: '/chatbot', icon: FaRobot, label: 'Assistant IA', description: 'Chatbot intelligent', badge: "IA" },
    { path: '/qr-code', icon: FaQrcode, label: 'Mon QR Code' },
    { path: '/feedback', icon: FaComment, label: 'Feedback'}
  ];

  return (
    <aside 
      className={`bg-theme-card border-r border-theme h-[calc(100vh-73px)] sticky top-[73px] overflow-y-auto transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* En-tête avec bouton de collapse */}
      <div className="p-4 border-b border-theme bg-gradient-to-r from-[#57a1ce]/5 to-[#afadb3]/5 flex items-center justify-between">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#57a1ce] to-[#3d7fa8] flex items-center justify-center shadow-lg shadow-[#57a1ce]/20">
              <FaRunning className="text-white text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-theme-primary leading-tight">
                I-Motion
              </h2>
              <p className="text-xs text-theme-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Espace Adhérent
              </p>
            </div>
          </motion.div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-theme-hover transition text-theme-secondary hover:text-theme-primary"
        >
          <FaArrowLeft className={`text-sm transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#57a1ce]/10 to-[#afadb3]/10 text-[#57a1ce] shadow-sm'
                    : 'text-theme-secondary hover:bg-theme-hover hover:text-[#57a1ce]'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
            >
              <div className="relative">
                <Icon className={`text-xl transition-all duration-200 ${isCollapsed ? 'text-2xl' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
              </div>
              
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium truncate text-theme-primary">{item.label}</p>
                  <p className="text-[10px] text-theme-secondary truncate">{item.description}</p>
                </motion.div>
              )}

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer avec statistiques */}
      {!isCollapsed && (
        <div className="absolute bottom-50 left-0 right-0 p-4 border-t border-theme bg-theme-card">
          {loading ? (
            <div className="flex justify-center py-1">
              <div className="w-4 h-4 border-2 border-[#57a1ce] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-theme-secondary">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>En ligne</span>
              </div>
              <div className="flex items-center gap-1" title="Série actuelle">
                <FaFire className="text-orange-400 text-xs" />
                <span>{stats.streak}</span>
              </div>
              <div className="flex items-center gap-1" title="Points totaux">
                <FaStar className="text-yellow-400 text-xs" />
                <span>{stats.points} pts</span>
              </div>
              <div className="flex items-center gap-1" title="Nombre de séances">
                <FaCalendar className="text-[#57a1ce] text-xs" />
                <span>{stats.sessions}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;