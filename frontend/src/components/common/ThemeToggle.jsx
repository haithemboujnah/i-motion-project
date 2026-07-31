import React from 'react';
import { motion } from 'framer-motion';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
        isDark ? 'bg-gray-700' : 'bg-gray-300'
      } ${className}`}
      aria-label="Toggle theme"
    >
      <div
        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
          isDark ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <FaMoon className="text-gray-700 text-sm" />
        ) : (
          <FaSun className="text-yellow-500 text-sm" />
        )}
      </div>
    </motion.button>
  );
};

export default ThemeToggle;