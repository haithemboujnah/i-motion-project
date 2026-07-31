import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  FaEnvelope, FaLock, FaUser, FaUserPlus, 
  FaUserTie, FaDumbbell, FaArrowLeft,
  FaShieldAlt, FaCheckCircle, FaUserTag,
  FaUserCog, FaIdCard
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/common/Logo';

const registerSchema = yup.object({
  first_name: yup.string().min(2, 'Minimum 2 caractères').required('Prénom requis'),
  last_name: yup.string().min(2, 'Minimum 2 caractères').required('Nom requis'),
  email: yup.string().email('Email invalide').required('Email requis'),
  password: yup.string().min(8, 'Minimum 8 caractères').required('Mot de passe requis'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas')
    .required('Confirmation requise'),
  role: yup.string().oneOf(['adherent', 'coach']).required('Rôle requis'),
});

const Register = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('adherent');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      role: 'adherent'
    }
  });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...userData } = data;
      const result = await registerUser(userData);
      
      if (result.success) {
        toast.success(`🎉 Inscription réussie en tant que ${userData.role === 'coach' ? 'Coach' : 'Adhérent'} !`);
        navigate('/login');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'adherent',
      label: 'Adhérent',
      icon: FaDumbbell,
      description: 'Accès aux séances, suivi et gamification',
      color: 'primary'
    },
    {
      value: 'coach',
      label: 'Coach',
      icon: FaUserTie,
      description: 'Gestion des séances et suivi des adhérents',
      color: 'secondary'
    }
  ];

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
      isDark 
        ? 'bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    }`}>
      {/* Arrière-plan décoratif */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-20 -left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-20 ${
          isDark ? 'bg-[#57a1ce]/10' : 'bg-[#57a1ce]/20'
        }`}></div>
        <div className={`absolute bottom-20 -right-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-20 ${
          isDark ? 'bg-[#afadb3]/10' : 'bg-[#afadb3]/20'
        }`}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-lg z-10"
      >
        <div className={`rounded-3xl shadow-2xl p-8 ${
          isDark 
            ? 'bg-dark-800/80 backdrop-blur-xl border border-dark-700' 
            : 'glass'
        }`}>
          <Link 
            to="/login" 
            className={`inline-flex items-center gap-2 transition mb-6 ${
              isDark ? 'text-gray-400 hover:text-[#57a1ce]' : 'text-theme-secondary hover:text-[#57a1ce]'
            }`}
          >
            <FaArrowLeft />
            Retour
          </Link>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" withText={false} />
            </div>
            <h1 className={`text-3xl font-display font-bold ${
              isDark ? 'text-black' : 'text-theme-primary'
            }`}>
              Créer un compte
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-theme-secondary'}>
              Rejoignez la communauté I-Motion
            </p>
          </div>

          {/* Sélection du rôle */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <FaShieldAlt className="text-[#57a1ce]" />
              Type de compte
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.value;
                return (
                  <motion.button
                    key={role.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleRoleSelect(role.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left relative ${
                      isSelected
                        ? 'border-[#57a1ce] bg-[#57a1ce]/10'
                        : isDark 
                          ? 'border-dark-600 hover:border-[#57a1ce]/50 hover:bg-dark-700' 
                          : 'border-gray-200 hover:border-[#57a1ce]/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected 
                          ? 'bg-[#57a1ce]/20' 
                          : isDark ? 'bg-dark-700' : 'bg-gray-100'
                      }`}>
                        <Icon className={`text-xl ${
                          isSelected ? 'text-[#57a1ce]' : isDark ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className={`font-semibold ${
                          isSelected ? 'text-[#57a1ce]' : isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {role.label}
                        </p>
                        <p className={`text-xs mt-0.5 ${
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {role.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <FaCheckCircle className="absolute top-2 right-2 text-[#57a1ce]" />
                    )}
                  </motion.button>
                );
              })}
            </div>
            <input type="hidden" {...register('role')} />
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <FaUser className="text-[#57a1ce]" />
                  Prénom
                </label>
                <input
                  {...register('first_name')}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isDark 
                      ? 'bg-dark-700 border-dark-600 text-black placeholder-gray-400 focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20' 
                      : 'input-logo'
                  } ${errors.first_name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  placeholder="Votre prénom"
                />
                {errors.first_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <FaIdCard className="text-[#57a1ce]" />
                  Nom
                </label>
                <input
                  {...register('last_name')}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isDark 
                      ? 'bg-dark-700 border-dark-600 text-black placeholder-gray-400 focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20' 
                      : 'input-logo'
                  } ${errors.last_name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  placeholder="Votre nom"
                />
                {errors.last_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <FaEnvelope className="text-[#57a1ce]" />
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
                placeholder="votre@gmail.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <FaLock className="text-[#57a1ce]" />
                Mot de passe
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={isPasswordVisible ? 'text' : 'password'}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isDark 
                      ? 'bg-dark-700 border-dark-600 text-black placeholder-gray-400 focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20' 
                      : 'input-logo'
                  } ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className={`absolute right-3 top-3.5 ${
                    isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Minimum 8 caractères
              </p>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <FaUserCog className="text-[#57a1ce]" />
                Confirmer le mot de passe
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  isDark 
                    ? 'bg-dark-700 border-dark-600 text-black placeholder-gray-400 focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20' 
                    : 'input-logo'
                } ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
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
                  Inscription...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  S'inscrire
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Déjà un compte ?{' '}
              <Link to="/login" className="text-[#57a1ce] hover:text-[#3d7fa8] font-semibold hover:underline transition">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;