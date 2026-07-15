import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHome, FaUsers, FaCalendar, FaChartLine,
  FaBell, FaUser, FaDumbbell,
  FaExclamationTriangle, FaTrophy,
  FaBookOpen, FaRunning, FaFire, FaHistory,
  FaStar, FaArrowLeft, FaCrown, FaRobot
} from 'react-icons/fa';
import { coachService } from '../../services/coachService';
import { useTheme } from '../../context/ThemeContext';

const CoachSidebar = () => {
  const { isDark } = useTheme();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [stats, setStats] = useState({
    totalAdherents: 0,
    totalSessions: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [atRiskRes, statsRes] = await Promise.all([
          coachService.getAtRiskAdherents(),
          coachService.getStats()
        ]);
        setAtRiskCount(atRiskRes.data.adherents?.length || 0);
        setStats({
          totalAdherents: statsRes.data.stats?.total_adherents || 0,
          totalSessions: statsRes.data.stats?.total_sessions || 0
        });
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
      }
    };
    fetchData();
  }, []);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const menuItems = [
    { 
      path: '/coach/dashboard', 
      icon: FaHome, 
      label: 'Tableau de bord', 
      description: "Vue d'ensemble", 
      iconColor: '#57a1ce' 
    },
    { 
      path: '/coach/adherents', 
      icon: FaUsers, 
      label: 'Tous les adhérents', 
      description: 'Gestion complète', 
      iconColor: '#22c55e', 
      badge: stats.totalAdherents, 
      badgeColor: 'bg-green-500' 
    },
    { 
      path: '/coach/adherents?filter=at-risk', 
      icon: FaExclamationTriangle, 
      label: 'À surveiller', 
      description: 'Adhérents à risque', 
      iconColor: '#ef4444', 
      badge: atRiskCount > 0 ? atRiskCount : null, 
      badgeColor: atRiskCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-gray-300',
      badgeIcon: 'AI',
      badgeIconColor: 'bg-red-500'
    },
    { 
      path: '/coach/sessions', 
      icon: FaCalendar, 
      label: 'Séances', 
      description: 'Gestion des séances', 
      iconColor: '#8b5cf6' 
    },
    { 
      path: '/coach/performances', 
      icon: FaChartLine, 
      label: 'Performances', 
      description: 'Suivi des progrès', 
      iconColor: '#f59e0b' 
    },
    { 
      path: '/coach/exercises', 
      icon: FaBookOpen, 
      label: 'Exercices', 
      description: 'Bibliothèque', 
      iconColor: '#ec4899' 
    },
    { 
      path: '/coach/attendance-history', 
      icon: FaHistory, 
      label: 'Historique pointages',
      description: 'Voir les pointages'
    },
    { 
      path: '/coach/notifications', 
      icon: FaBell, 
      label: 'Notifications', 
      description: 'Alertes', 
      iconColor: '#3b82f6' 
    },
    { 
      path: '/profile', 
      icon: FaUser, 
      label: 'Mon Profil', 
      description: 'Vos informations', 
      iconColor: '#6b7280' 
    }
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
              <FaDumbbell className="text-white text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-theme-primary leading-tight">
                Espace Coach
              </h2>
              <p className="text-xs text-theme-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Professionnel
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
          const active = isActive(item.path);
          
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
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`absolute -top-1 -right-2 min-w-[18px] h-[18px] ${item.badgeColor} text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md`}>
                    {item.badge}
                  </span>
                )}
                {item.badgeIcon && (
                  <span className={`absolute -top-1 -right-2 min-w-[18px] h-[18px] ${item.badgeIconColor} text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md`}>
                    {item.badgeIcon}
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
          <div className="flex items-center justify-between text-xs text-theme-secondary">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>En ligne</span>
            </div>
            <div className="flex items-center gap-1" title="Séances totales">
              <FaCalendar className="text-[#8b5cf6] text-xs" />
              <span>{stats.totalSessions}</span>
            </div>
            <div className="flex items-center gap-1" title="Adhérents totaux">
              <FaUsers className="text-[#22c55e] text-xs" />
              <span>{stats.totalAdherents}</span>
            </div>
            <div className="flex items-center gap-1" title="Adhérents à risque">
              <FaExclamationTriangle className="text-red-500 text-xs" />
              <span>{atRiskCount}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default CoachSidebar;