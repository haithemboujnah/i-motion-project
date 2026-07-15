import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaPlus, FaFilter, FaSearch, FaExclamationTriangle,
  FaLightbulb, FaSmile, FaClock, FaCheckCircle
} from 'react-icons/fa';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import FeedbackForm from '../../components/feedback/FeedbackForm';
import { feedbackService } from '../../services/feedbackService';
import toast from 'react-hot-toast';

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackService.getMyFeedbacks();
      setFeedbacks(response.data.feedbacks || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Erreur lors du chargement des feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      'complaint': <FaExclamationTriangle className="text-red-500" />,
      'suggestion': <FaLightbulb className="text-yellow-500" />,
      'compliment': <FaSmile className="text-green-500" />
    };
    return icons[type] || icons['complaint'];
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'badge-warning',
      'in_progress': 'badge-info',
      'resolved': 'badge-success'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'En attente',
      'in_progress': 'En cours',
      'resolved': 'Résolu'
    };
    return labels[status] || status;
  };

  const filteredFeedbacks = filter === 'all' 
    ? feedbacks 
    : feedbacks.filter(f => f.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                  💬 Mes Feedback
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Gérez vos réclamations, suggestions et compliments
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="btn-logo text-sm flex items-center gap-2"
              >
                <FaPlus /> Nouveau feedback
              </button>
            </div>

            {/* Filtres */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['all', 'pending', 'in_progress', 'resolved'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    filter === status
                      ? 'bg-[#57a1ce] text-white shadow-lg'
                      : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover'
                  }`}
                >
                  {status === 'all' ? 'Tous' : getStatusLabel(status)}
                  <span className="ml-1 text-xs opacity-70">
                    ({feedbacks.filter(f => status === 'all' || f.status === status).length})
                  </span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : filteredFeedbacks.length > 0 ? (
              <div className="space-y-4">
                {filteredFeedbacks.map((feedback, index) => (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getTypeIcon(feedback.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white">
                            {feedback.subject || 'Sans sujet'}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="capitalize">{feedback.category}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{new Date(feedback.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`badge ${getStatusBadge(feedback.status)}`}>
                        {getStatusLabel(feedback.status)}
                      </span>
                    </div>

                    <p className="mt-3 text-gray-600 dark:text-gray-300">
                      {feedback.message}
                    </p>

                    {/* Note */}
                    {feedback.rating && (
                      <div className="mt-2 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({feedback.rating}/5)
                        </span>
                      </div>
                    )}

                    {/* Réponse admin */}
                    {feedback.admin_response && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          📨 Réponse de l'administrateur
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                          {feedback.admin_response}
                        </p>
                        {feedback.resolved_at && (
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                            Résolu le {new Date(feedback.resolved_at).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-dark-card rounded-xl">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Aucun feedback
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Partagez votre expérience en envoyant un feedback
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-logo text-sm inline-block mt-4"
                >
                  Envoyer un feedback
                </button>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Modal Formulaire */}
      {showForm && (
        <FeedbackForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            fetchFeedbacks();
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
};

export default Feedback;