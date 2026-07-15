import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FaHome, FaUsers, FaDumbbell, FaTrophy,
  FaChartLine, FaEye, FaBell, FaUser,
  FaCog, FaSignOutAlt, FaShieldAlt, FaChartBar,
  FaChevronDown, FaChevronRight, FaBrain,
  FaArrowLeft, FaCalendar, FaBook, FaCalendarAlt,
  FaRunning, FaFire, FaStar, FaRobot, FaComments
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { adminService } from '../../services/adminService';
import { authService } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';

const AdminSidebar = () => {
  const { isDark } = useTheme();
  const location = useLocation();
  const user = authService.getUser();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdherents: 0,
    totalCoaches: 0,
    totalSessions: 0,
    totalPrograms: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getGlobalStats();
        setStats({
          totalUsers: response.data.stats?.total_users || 0,
          totalAdherents: response.data.stats?.total_adherents || 0,
          totalCoaches: response.data.stats?.total_coaches || 0,
          totalSessions: response.data.stats?.total_sessions || 0,
          totalPrograms: response.data.stats?.total_programs || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  const menuItems = [
    { 
      path: '/admin/dashboard', 
      icon: FaHome, 
      label: 'Tableau de bord',
      description: "Vue d'ensemble"
    },
    { 
      path: '/admin/users', 
      icon: FaUsers, 
      label: 'Utilisateurs',
      description: 'Gestion des comptes',
      badge: stats.totalUsers || 0,
      badgeColor: 'bg-green-500'
    },
    { 
      path: '/admin/sessions', 
      icon: FaCalendar, 
      label: 'Séances',
      description: 'Gestion des séances',
      badge: stats.totalSessions || 0,
      badgeColor: 'bg-green-500'
    },
    { 
      path: '/admin/programs', 
      icon: FaDumbbell, 
      label: 'Programmes',
      description: 'Gestion des programmes',
      badge: 'IA',
      badgeColor: 'bg-red-500'
    },
    { 
      path: '/admin/churn', 
      icon: FaBrain, 
      label: 'Prédiction Churn',
      description: 'Analyse des désabonnements',
      badge: 'IA',
      badgeColor: 'bg-red-500'
    },
    { 
      path: '/admin/gamification', 
      icon: FaTrophy, 
      label: 'Gamification',
      description: 'Badges & challenges'
    },
    { 
      path: '/admin/analytics', 
      icon: FaChartLine, 
      label: 'Analyse',
      description: 'Prédictions & tendances'
    },
    { 
      path: '/admin/supervision', 
      icon: FaEye, 
      label: 'Supervision',
      description: 'Activités & rapports'
    },
    { 
      path: '/admin/bi-dashboard', 
      icon: FaChartBar, 
      label: 'BI Dashboard',
      description: 'Tableau de bord décisionnel',
      badge:'BI'
    },
    { 
      path: '/admin/feedback', 
      icon: FaComments, 
      label: 'Feedback',
      description: 'Gestion des avis',
      badge:'IA'
    },
    { 
      path: '/admin/settings', 
      icon: FaCog, 
      label: 'Paramètres',
      description: 'Configuration'
    }
  ];

  const isPathActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <aside 
      className={`bg-theme-card border-r border-theme h-[calc(100vh-73px)] sticky top-[73px] overflow-y-auto transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* En-tête avec bouton de collapse */}
      <div className="p-4 border-b border-theme flex items-center justify-between">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
              <FaShieldAlt className="text-white text-lg" />
            </div>
            <div>
              <p className="text-sm font-semibold text-theme-primary">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-theme-secondary">Administrateur</p>
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
          const isActive = isPathActive(item.path);
          
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
                  <span className={`absolute -top-1 -right-2 min-w-[18px] h-[18px] ${
                    item.badgeColor || 'bg-red-500'
                  } text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md`}>
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
          <div className="flex items-center justify-between text-xs text-theme-secondary">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>En ligne</span>
            </div>
            <div className="flex items-center gap-1" title="Utilisateurs totaux">
              <FaUser className="text-[#8b5cf6] text-xs" />
              <span>{stats.totalUsers}</span>
            </div>
            <div className="flex items-center gap-1" title="Adhérents">
              <FaUsers className="text-[#22c55e] text-xs" />
              <span>{stats.totalAdherents}</span>
            </div>
            <div className="flex items-center gap-1" title="Séances totales">
              <FaCalendar className="text-[#f97316] text-xs" />
              <span>{stats.totalSessions}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer avec bouton déconnexion (mode collapse) */}
      {isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-theme bg-theme-card">
          <button
            onClick={() => authService.logout()}
            className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition"
            title="Déconnexion"
          >
            <FaSignOutAlt className="text-xl" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default AdminSidebar;