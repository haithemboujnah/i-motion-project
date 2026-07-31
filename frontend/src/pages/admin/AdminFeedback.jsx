import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSearch, FaFilter, FaEye, FaCheck, FaTimes,
  FaReply, FaChartLine, FaRobot, FaSpinner,
  FaExclamationTriangle, FaLightbulb, FaSmile,
  FaClock, FaCheckCircle, FaFileExport
} from 'react-icons/fa';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { feedbackService } from '../../services/feedbackService';
import toast from 'react-hot-toast';

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all'
  });
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [feedbacksRes, statsRes] = await Promise.all([
        feedbackService.getAll(),
        feedbackService.getStats()
      ]);
      
      setFeedbacks(feedbacksRes.data.feedbacks || []);
      setFilteredFeedbacks(feedbacksRes.data.feedbacks || []);
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, filters);
  };

  const handleFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(searchTerm, newFilters);
  };

  const applyFilters = (term, currentFilters) => {
    let filtered = feedbacks.filter(f =>
      f.subject?.toLowerCase().includes(term) ||
      f.message?.toLowerCase().includes(term) ||
      f.first_name?.toLowerCase().includes(term) ||
      f.last_name?.toLowerCase().includes(term) ||
      f.email?.toLowerCase().includes(term)
    );

    if (currentFilters.status !== 'all') {
      filtered = filtered.filter(f => f.status === currentFilters.status);
    }

    if (currentFilters.type !== 'all') {
      filtered = filtered.filter(f => f.type === currentFilters.type);
    }

    if (currentFilters.priority !== 'all') {
      filtered = filtered.filter(f => f.priority === currentFilters.priority);
    }

    setFilteredFeedbacks(filtered);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await feedbackService.updateStatus(id, status);
      toast.success(`Statut mis à jour: ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) {
      toast.error('Veuillez écrire une réponse');
      return;
    }

    try {
      await feedbackService.updateStatus(
        selectedFeedback.id,
        'resolved',
        responseText
      );
      toast.success('Réponse envoyée avec succès');
      setShowResponseModal(false);
      setResponseText('');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la réponse');
    }
  };

  const handleAnalyzeBatch = async () => {
    setAnalyzing(true);
    try {
        // ✅ Utiliser les feedbacks existants
        const feedbacksToAnalyze = feedbacks.map(f => ({
        id: f.id,
        message: f.message,
        rating: f.rating,
        subject: f.subject
        }));
        
        const response = await feedbackService.analyzeBatch(feedbacksToAnalyze);
        
        if (response.success) {
        setInsights(response.data.insights);
        toast.success('Analyse terminée !');
        } else {
        toast.error(response.error || 'Erreur lors de l\'analyse');
        }
    } catch (error) {
        console.error('Error analyzing:', error);
        toast.error('Erreur lors de l\'analyse');
    } finally {
        setAnalyzing(false);
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

  const getPriorityBadge = (priority) => {
    const badges = {
      'high': 'badge-danger',
      'medium': 'badge-warning',
      'low': 'badge-success'
    };
    return badges[priority] || 'badge-info';
  };

  const statCards = stats ? [
    { label: 'Total', value: stats.total || 0, color: '#4f46e5' },
    { label: 'En attente', value: stats.pending || 0, color: '#f59e0b' },
    { label: 'Résolus', value: stats.resolved || 0, color: '#22c55e' },
    { label: 'Réclamations', value: stats.complaints || 0, color: '#ef4444' },
    { label: 'Satisfaction', value: stats.avg_rating ? `${stats.avg_rating}/5` : '-', color: '#8b5cf6' }
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  💬 Gestion des Feedback
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Gérez les réclamations, suggestions et compliments des adhérents
                </p>
              </div>
              <button
                onClick={handleAnalyzeBatch}
                disabled={analyzing}
                className="btn-logo text-sm flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    <FaRobot /> Analyser avec IA
                  </>
                )}
              </button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {statCards.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark"
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Insights NLP */}
            {insights && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 mb-6"
              >
                <h3 className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                  <FaRobot /> Analyse IA - Insights
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Total analysé</p>
                    <p className="font-bold text-purple-800 dark:text-purple-300">{insights.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Tendance</p>
                    <p className="font-bold text-purple-800 dark:text-purple-300 capitalize">{insights.trend}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Satisfaction</p>
                    <p className="font-bold text-purple-800 dark:text-purple-300">{insights.avg_satisfaction}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Priorité haute</p>
                    <p className="font-bold text-purple-800 dark:text-purple-300">{insights.priority_counts?.high || 0}</p>
                  </div>
                </div>
                {insights.top_keywords?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {insights.top_keywords.slice(0, 5).map(([keyword, count]) => (
                      <span key={keyword} className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                        {keyword} ({count})
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Filtres */}
            <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="input-logo pl-10"
                  />
                </div>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilter('status', e.target.value)}
                  className="input-logo w-40"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolus</option>
                </select>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilter('type', e.target.value)}
                  className="input-logo w-40"
                >
                  <option value="all">Tous les types</option>
                  <option value="complaint">Réclamations</option>
                  <option value="suggestion">Suggestions</option>
                  <option value="compliment">Compliments</option>
                </select>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilter('priority', e.target.value)}
                  className="input-logo w-40"
                >
                  <option value="all">Toutes priorités</option>
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Basse</option>
                </select>
              </div>
            </div>

            {/* Liste des feedbacks */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : filteredFeedbacks.length > 0 ? (
              <div className="space-y-4">
                {filteredFeedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
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
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {feedback.first_name} {feedback.last_name}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{feedback.email}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="capitalize">{feedback.category}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{new Date(feedback.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${getPriorityBadge(feedback.priority)}`}>
                          {feedback.priority}
                        </span>
                        <span className={`badge ${getStatusBadge(feedback.status)}`}>
                          {feedback.status}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-gray-600 dark:text-gray-300">
                      {feedback.message}
                    </p>

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

                    <div className="mt-4 flex items-center gap-2">
                      {feedback.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(feedback.id, 'in_progress')}
                            className="btn-secondary text-sm"
                          >
                            <FaClock className="inline mr-1" />
                            Prendre en charge
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFeedback(feedback);
                              setShowResponseModal(true);
                            }}
                            className="btn-logo text-sm"
                          >
                            <FaReply className="inline mr-1" />
                            Répondre
                          </button>
                        </>
                      )}
                      {feedback.status === 'in_progress' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedFeedback(feedback);
                              setShowResponseModal(true);
                            }}
                            className="btn-logo text-sm"
                          >
                            <FaCheck className="inline mr-1" />
                            Résoudre
                          </button>
                        </>
                      )}
                      {feedback.status === 'resolved' && (
                        <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                          <FaCheckCircle /> Résolu
                        </span>
                      )}
                    </div>

                    {feedback.admin_response && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          📨 Réponse
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                          {feedback.admin_response}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-dark-card rounded-xl">
                <FaSearch className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucun feedback trouvé</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Réponse */}
      {showResponseModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-lg w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-dark">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Répondre au feedback
              </h2>
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setResponseText('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Adhérent: <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedFeedback.first_name} {selectedFeedback.last_name}
                </span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {selectedFeedback.message}
              </p>
              <form onSubmit={handleRespond}>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows="4"
                  className="input-logo"
                  placeholder="Écrivez votre réponse..."
                  required
                />
                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    className="btn-logo flex-1"
                  >
                    <FaCheck className="inline mr-2" />
                    Répondre
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResponseModal(false);
                      setResponseText('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;