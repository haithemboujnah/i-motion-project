import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Logo from '../common/Logo2';
import { authService } from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import ThemeToggle from '../common/ThemeToggle';

const AdherentNavbar = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [unreadCount, setUnreadCount] = useState(0);

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
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="bg-theme-card border-b border-theme sticky top-0 z-50 shadow-sm">
      <div className="container-custom py-3">
        <div className="flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-xs font-medium text-[#57a1ce] bg-[#57a1ce]/10 px-2.5 py-0.5 rounded-full hidden sm:inline">
              Adhérent
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link 
              to="/notifications" 
              className="relative p-2 rounded-xl hover:bg-[#57a1ce]/10 transition dark:hover:bg-[#57a1ce]/20"
            >
              <FaBell className="text-theme-secondary text-xl dark:text-theme-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            
            <Link 
              to="/profile" 
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#57a1ce]/10 transition dark:hover:bg-[#57a1ce]/20"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#57a1ce] to-[#3d7fa8] flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-theme-primary leading-tight">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-theme-secondary">Adhérent</p>
              </div>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <FaSignOutAlt className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdherentNavbar;