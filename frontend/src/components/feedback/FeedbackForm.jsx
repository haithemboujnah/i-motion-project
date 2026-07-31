import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaTimes, FaCheck, FaStar, FaExclamationTriangle,
  FaLightbulb, FaSmile, FaFrown, FaMeh,
  FaSpinner, FaRobot
} from 'react-icons/fa';
import { feedbackService } from '../../services/feedbackService';
import toast from 'react-hot-toast';

const FeedbackForm = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [formData, setFormData] = useState({
    type: 'complaint',
    category: 'autres',
    subject: '',
    message: '',
    rating: 3,
    priority: 'medium'
  });

  const types = [
    { value: 'complaint', label: 'Réclamation', icon: FaExclamationTriangle, color: 'text-red-500' },
    { value: 'suggestion', label: 'Suggestion', icon: FaLightbulb, color: 'text-yellow-500' },
    { value: 'compliment', label: 'Compliment', icon: FaSmile, color: 'text-green-500' }
  ];

  const categories = [
    { value: 'seances', label: 'Séances' },
    { value: 'coach', label: 'Coach' },
    { value: 'application', label: 'Application' },
    { value: 'paiement', label: 'Paiement' },
    { value: 'equipement', label: 'Équipement' },
    { value: 'autres', label: 'Autres' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRating = (rating) => {
    setFormData({ ...formData, rating });
  };

  const handleAnalyze = async () => {
    if (!formData.message.trim()) {
      toast.error('Veuillez écrire un message pour analyse');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await feedbackService.analyzeFeedback({
        message: formData.message,
        rating: formData.rating,
        subject: formData.subject
      });
      
      if (response.success) {
        setAnalysis(response.data);
        toast.success('Analyse terminée !');
      }
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      toast.error('Erreur lors de l\'analyse');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      toast.error('Veuillez décrire votre feedback');
      return;
    }

    setLoading(true);
    try {
      const response = await feedbackService.create(formData);
      
      if (response.success) {
        toast.success('Feedback envoyé avec succès !');
        if (onSuccess) onSuccess(response.data);
        if (onClose) onClose();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentEmoji = (sentiment) => {
    const map = {
      'positive': '😊',
      'negative': '😞',
      'neutral': '😐'
    };
    return map[sentiment] || '😐';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-dark-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-dark">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            💬 Envoyer un feedback
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition"
          >
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de feedback
            </label>
            <div className="grid grid-cols-3 gap-2">
              {types.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-3 rounded-xl border-2 text-center transition ${
                      isSelected
                        ? 'border-[#57a1ce] bg-[#57a1ce]/10'
                        : 'border-gray-200 dark:border-dark hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`text-2xl mx-auto mb-1 ${type.color}`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Catégorie
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-logo"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sujet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sujet
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="input-logo"
              placeholder="Ex: Problème de réservation"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              className="input-logo"
              placeholder="Décrivez votre expérience..."
            />
            <div className="flex justify-between mt-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="text-sm text-[#57a1ce] hover:text-[#3d7fa8] flex items-center gap-2 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <FaRobot /> Analyser avec IA
                  </>
                )}
              </button>
              {analysis && (
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  Sentiment: {getSentimentEmoji(analysis.sentiment_analysis?.sentiment)}
                  {(analysis.sentiment_analysis?.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Note ({formData.rating}/5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRating(star)}
                  className="text-3xl transition hover:scale-110"
                >
                  <FaStar
                    className={star <= formData.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Résultat de l'analyse */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gray-50 dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark"
            >
              <h4 className="font-medium text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <FaRobot className="text-[#57a1ce]" />
                Analyse IA
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Sentiment</span>
                  <p className="font-medium capitalize">
                    {analysis.sentiment_analysis?.sentiment}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Confiance</span>
                  <p className="font-medium">
                    {(analysis.sentiment_analysis?.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Catégorie</span>
                  <p className="font-medium">{analysis.auto_category}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Priorité</span>
                  <p className={`font-medium capitalize ${
                    analysis.priority === 'high' ? 'text-red-500' :
                    analysis.priority === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {analysis.priority}
                  </p>
                </div>
              </div>
              {analysis.recommendations?.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 {analysis.recommendations[0]}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark">
            <button
              type="submit"
              disabled={loading}
              className="btn-logo flex-1 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin inline mr-2" />
                  Envoi...
                </>
              ) : (
                <>
                  <FaCheck className="inline mr-2" />
                  Envoyer
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Annuler
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default FeedbackForm;