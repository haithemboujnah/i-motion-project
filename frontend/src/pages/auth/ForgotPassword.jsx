import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaArrowLeft, FaCheckCircle, FaCopy } from 'react-icons/fa';
import { authService } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import Logo from '../../components/common/Logo';

const ForgotPassword = () => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      setIsSent(true);
      
      // ✅ Construire le lien de réinitialisation
      const token = response.data?.reset_token;
      if (token) {
        const resetUrl = `${window.location.origin}/reset-password?token=${token}`;
        setResetLink(resetUrl);
      }
      
      toast.success('Email de réinitialisation envoyé !');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resetLink);
    toast.success('Lien copié dans le presse-papier !');
  };

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
              Mot de passe oublié
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          {isSent ? (
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
                Email envoyé !
              </h3>
              <p className={`text-sm mb-6 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Un lien de réinitialisation a été envoyé à <strong>{email}</strong>
              </p>
              
              {resetLink && (
                <div className={`mb-6 p-4 rounded-xl border ${
                  isDark 
                    ? 'bg-dark-700/50 border-dark-600' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-xs mb-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    📋 Lien de réinitialisation :
                  </p>
                  <div className={`flex items-center gap-2 rounded-lg p-2 border ${
                    isDark 
                      ? 'bg-dark-800 border-dark-600' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <code className={`text-xs flex-1 break-all ${
                      isDark ? 'text-[#57a1ce]' : 'text-[#57a1ce]'
                    }`}>
                      {resetLink}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className={`p-2 rounded-lg transition ${
                        isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-100'
                      }`}
                      title="Copier le lien"
                    >
                      <FaCopy className="text-[#57a1ce]" />
                    </button>
                  </div>
                  <p className={`text-xs mt-2 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    ⚠️ Ce lien expire dans 1 heure
                  </p>
                </div>
              )}
              
              <p className={`text-xs mb-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Vérifiez vos spams si vous ne recevez pas l'email
              </p>
              
              <Link
                to="/login"
                className="btn-logo w-full inline-block text-center text-sm"
              >
                Retour à la connexion
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <FaEnvelope className={`inline mr-2 ${isDark ? 'text-[#57a1ce]' : 'text-[#57a1ce]'}`} />
                  Email
                </label>
                <input
                  type="email"
                  required
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isDark 
                      ? 'bg-dark-700 border-dark-600 text-black placeholder-gray-400 focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20' 
                      : 'input-logo'
                  }`}
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Vous recevrez un lien de réinitialisation par email
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-logo w-full flex items-center justify-center gap-2 text-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white"></div>
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le lien de réinitialisation'
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

export default ForgotPassword;