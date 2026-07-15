import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  FaEnvelope, FaLock, FaArrowRight, FaInfoCircle,
  FaRunning, FaDumbbell, FaUserGraduate
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/common/Logo';

const loginSchema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis'),
  password: yup.string().required('Mot de passe requis'),
});

const Login = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      
      if (result.success) {
        toast.success(`Bienvenue ${result.user.first_name} ! 👋`);
        
        if (result.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (result.user.role === 'coach') {
          navigate('/coach/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
      isDark 
        ? 'bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    }`}>
      {/* Arrière-plan décoratif - adapté au mode */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float ${
          isDark ? 'bg-[#57a1ce]/10' : 'bg-[#57a1ce]/20'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float ${
          isDark ? 'bg-[#afadb3]/10' : 'bg-[#afadb3]/20'
        }`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float ${
          isDark ? 'bg-[#57a1ce]/5' : 'bg-[#57a1ce]/10'
        }`} style={{ animationDelay: '4s' }}></div>
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
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex justify-center mb-4"
            >
              <Logo size="lg" withText={false} />
            </motion.div>
            <h1 className={`text-4xl font-display font-bold ${
              isDark ? 'text-white' : 'text-logo-gradient'
            }`}>
              Connexion
            </h1>
            <p className={`mt-2 font-medium ${
              isDark ? 'text-gray-400' : 'text-theme-secondary'
            }`}>
              Connectez-vous à votre espace sportif
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <FaEnvelope className={`inline mr-2 ${isDark ? 'text-[#57a1ce]' : 'text-[#57a1ce]'}`} />
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  isDark 
                    ? 'bg-dark-700 border-dark-600 text-black placeholder-gray-400 focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20' 
                    : 'input-logo'
                } ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="votre@email.com"
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <FaLock className={`inline mr-2 ${isDark ? 'text-[#57a1ce]' : 'text-[#57a1ce]'}`} />
                Mot de passe
              </label>
              <input
                {...register('password')}
                type="password"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  isDark 
                    ? 'bg-dark-700 border-dark-600 text-black placeholder-gray-400 focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20' 
                    : 'input-logo'
                } ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="••••••••"
              />
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            <div className="text-right">
              <Link 
                to="/forgot-password" 
                className={`text-sm hover:underline transition ${
                  isDark ? 'text-[#57a1ce] hover:text-[#7bb8de]' : 'text-[#57a1ce] hover:text-[#3d7fa8]'
                }`}
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="btn-logo w-full flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white"></div>
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className={isDark ? 'text-gray-400' : 'text-theme-secondary'}>
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-[#57a1ce] hover:text-[#3d7fa8] font-semibold hover:underline transition">
                S'inscrire
              </Link>
            </p>
          </div>

          <div className={`mt-6 flex justify-center gap-4 ${
            isDark ? 'text-gray-600' : 'text-gray-300'
          }`}>
            <FaRunning className="text-xl hover:text-[#57a1ce] transition-colors cursor-pointer" />
            <FaDumbbell className="text-xl hover:text-[#57a1ce] transition-colors cursor-pointer" />
            <FaUserGraduate className="text-xl hover:text-[#57a1ce] transition-colors cursor-pointer" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;