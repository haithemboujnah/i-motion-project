import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaCheckCircle, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { authService } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import Logo from '../../components/common/Logo';

const ResetPassword = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast.error('Token manquant');
        navigate('/login');
        return;
      }
      
      try {
        await authService.validateResetToken(token);
        setIsValid(true);
      } catch (error) {
        toast.error('Token invalide ou expiré');
        navigate('/login');
      }
    };
    
    validateToken();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.resetPassword(token, password, confirmPassword);
      setIsReset(true);
      toast.success('Mot de passe réinitialisé avec succès !');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValid) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-dark-900' : 'bg-gray-50'
      }`}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
      isDark 
        ? 'bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    }`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float ${
          isDark ? 'bg-[#57a1ce]/10' : 'bg-[#57a1ce]/20'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float ${
          isDark ? 'bg-[#afadb3]/10' : 'bg-[#afadb3]/20'
        }`} style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md z-10"
      >
        <div className={`rounded-3xl shadow-2xl p-8 ${
          isDark 
            ? 'bg-dark-800/80 backdrop-blur-xl border border-dark-700' 
            : 'glass'
        }`}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" withText={false} />
            </div>
            <h1 className={`text-3xl font-display font-bold ${
              isDark ? 'text-black' : 'text-logo-gradient'
            }`}>
              Nouveau mot de passe
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              Choisissez un nouveau mot de passe sécurisé
            </p>
          </div>

          {isReset ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                isDark ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
                <FaCheckCircle className="text-green-500 text-4xl" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${
                isDark ? 'text-black' : 'text-gray-800'
              }`}>
                Mot de passe réinitialisé !
              </h3>
              <p className={`text-sm mb-6 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Votre mot de passe a été modifié avec succès
              </p>
              <Link
                to="/login"
                className="btn-logo w-full inline-block text-center text-sm"
              >
                Se connecter
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <FaLock className={`inline mr-2 ${isDark ? 'text-[#57a1ce]' : 'text-[#57a1ce]'}`} />
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      isDark 
                        ? 'bg-dark-700 border-dark-600 text-black placeholder-gray-400 focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20' 
                        : 'input-logo'
                    }`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength="8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-3.5 transition ${
                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Minimum 8 caractères
                </p>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <FaLock className={`inline mr-2 ${isDark ? 'text-[#57a1ce]' : 'text-[#57a1ce]'}`} />
                  Confirmer le mot de passe
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isDark 
                      ? 'bg-dark-700 border-dark-600 text-black placeholder-gray-400 focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20' 
                      : 'input-logo'
                  }`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-logo w-full flex items-center justify-center gap-2 text-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white"></div>
                    Réinitialisation...
                  </>
                ) : (
                  'Réinitialiser le mot de passe'
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className={`inline-flex items-center gap-2 transition ${
                    isDark 
                      ? 'text-[#57a1ce] hover:text-[#7bb8de]' 
                      : 'text-[#57a1ce] hover:text-[#3d7fa8]'
                  }`}
                >
                  <FaArrowLeft />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;