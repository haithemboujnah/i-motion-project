import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaBell, FaSignOutAlt, FaUser, 
  FaShieldAlt, FaSearch, FaBars, FaTimes
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../common/Logo2';
import { authService } from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import ThemeToggle from '../common/ThemeToggle';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationService.getUnreadCount();
        setUnreadCount(response.data.unread_count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    fetchUnreadCount();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-300 bg-theme-card border-b border-theme ${
        isScrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="ml-2 text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full dark:bg-indigo-900/30 dark:text-indigo-400">
              Admin
            </span>
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center gap-1">
            <Link 
              to="/admin/users" 
              className="px-3 py-2 rounded-lg text-sm text-theme-secondary hover:text-indigo-600 hover:bg-indigo-50 transition dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
            >
              Utilisateurs
            </Link>
            <Link 
              to="/admin/programs" 
              className="px-3 py-2 rounded-lg text-sm text-theme-secondary hover:text-indigo-600 hover:bg-indigo-50 transition dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
            >
              Programmes
            </Link>
            <Link 
              to="/admin/analytics" 
              className="px-3 py-2 rounded-lg text-sm text-theme-secondary hover:text-indigo-600 hover:bg-indigo-50 transition dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
            >
              Analyse
            </Link>
            <Link 
              to="/admin/supervision" 
              className="px-3 py-2 rounded-lg text-sm text-theme-secondary hover:text-indigo-600 hover:bg-indigo-50 transition dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
            >
              Supervision
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link 
              to="/admin/notifications" 
              className="relative p-2 rounded-lg hover:bg-gray-100 transition dark:hover:bg-gray-700/50"
            >
              <FaBell className="text-theme-secondary text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Profil */}
            <Link 
              to="/profile" 
              className="flex items-center gap-3 pl-3 border-l border-theme"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-theme-primary">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-theme-secondary">Administrateur</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm dark:bg-indigo-900/30 dark:text-indigo-400">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            </Link>

            {/* Déconnexion */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition dark:hover:bg-red-900/20 dark:hover:text-red-400"
              title="Déconnexion"
            >
              <FaSignOutAlt className="text-xl" />
            </button>

            {/* Menu Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition dark:hover:bg-gray-700/50"
            >
              {isMobileMenuOpen ? (
                <FaTimes className="text-theme-secondary text-xl" />
              ) : (
                <FaBars className="text-theme-secondary text-xl" />
              )}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-theme py-3 space-y-1"
            >
              <Link
                to="/admin/users"
                className="block px-4 py-3 rounded-lg text-theme-secondary hover:text-indigo-600 hover:bg-indigo-50 transition dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Utilisateurs
              </Link>
              <Link
                to="/admin/programs"
                className="block px-4 py-3 rounded-lg text-theme-secondary hover:text-indigo-600 hover:bg-indigo-50 transition dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Programmes
              </Link>
              <Link
                to="/admin/analytics"
                className="block px-4 py-3 rounded-lg text-theme-secondary hover:text-indigo-600 hover:bg-indigo-50 transition dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Analyse
              </Link>
              <Link
                to="/admin/supervision"
                className="block px-4 py-3 rounded-lg text-theme-secondary hover:text-indigo-600 hover:bg-indigo-50 transition dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Supervision
              </Link>
              <div className="border-t border-theme my-2"></div>
              <Link
                to="/profile"
                className="block px-4 py-3 rounded-lg text-theme-secondary hover:text-indigo-600 hover:bg-indigo-50 transition dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Mon Profil
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="block w-full text-left px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition dark:hover:bg-red-900/20 dark:text-red-400"
              >
                Déconnexion
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default AdminNavbar;