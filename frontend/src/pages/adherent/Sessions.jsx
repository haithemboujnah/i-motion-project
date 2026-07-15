import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCalendar, FaClock, FaUser, FaCheck, FaTimes,
  FaBell, FaSpinner, FaInfoCircle, FaEye,
  FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaChevronDown, FaChevronUp, FaStar
} from 'react-icons/fa';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import { sessionService } from '../../services/sessionService';
import { formatDate, formatTime, formatSessionDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [sendingReminder, setSendingReminder] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [selectedDate]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      const availableResponse = await sessionService.getAvailableSessions(selectedDate);
      setAvailableSessions(availableResponse.data.sessions || []);
      
      const mySessionsResponse = await sessionService.getMySessions();
      setSessions(mySessionsResponse.data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Erreur lors du chargement des séances');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Réservation par les adhérents
  const handleReserve = async (sessionId) => {
    try {
      await sessionService.reserveSession(sessionId);
      toast.success('✅ Séance réservée avec succès !');
      fetchSessions();
      setSelectedSession(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la réservation');
    }
  };

  // ✅ Annulation de séances (avec confirmation)
  const handleCancel = async (sessionId) => {
    try {
      await sessionService.cancelSession(sessionId);
      toast.success('❌ Séance annulée avec succès');
      setShowCancelConfirm(null);
      fetchSessions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'annulation');
    }
  };

  // ✅ Envoyer un rappel immédiat
  const handleSendReminder = async (sessionId) => {
    setSendingReminder(sessionId);
    try {
      const response = await api.post(`/reminders/send/${sessionId}`);
      if (response.data.success) {
        // ✅ Afficher à qui le rappel a été envoyé
        const sentTo = response.data.data?.sent_to;
        const sessionInfo = response.data.data?.session;
        
        let message = '📨 Rappel envoyé avec succès !';
        if (sentTo) {
          message = `📨 Rappel envoyé à ${sentTo.name} (${sentTo.email})`;
        }
        if (sessionInfo) {
          message += `\n📅 ${sessionInfo.date} à ${sessionInfo.time} - ${sessionInfo.type}`;
        }
        
        toast.success(message, { duration: 5000 });
        
        // Mettre à jour le statut du bouton
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, reminder_sent_manual: true } : s
        ));
      } else {
        toast.error(response.data.error || 'Erreur lors de l\'envoi du rappel');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors de l\'envoi du rappel';
      toast.error(errorMsg);
    } finally {
      setSendingReminder(null);
    }
  };

  // ✅ Envoyer un feedback après la séance
  const handleSendFeedback = async (sessionId) => {
    if (feedbackRating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }
    
    try {
      await api.post('/feedback', {
        session_id: sessionId,
        rating: feedbackRating,
        message: feedbackComment,
        type: 'compliment',
        category: 'seances'
      });
      toast.success('⭐ Merci pour votre retour !');
      setFeedbackModal(null);
      setFeedbackRating(0);
      setFeedbackComment('');
      fetchSessions();
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast.error('Erreur lors de l\'envoi du feedback');
    }
  };

  // ✅ Vérifier si le rappel est disponible (24h avant)
  const isReminderAvailable = (session) => {
    if (session.status === 'cancelled' || session.status === 'completed') return false;
    if (session.reminder_sent_manual) return false;
    if (!session.id) return false; // ✅ Vérifier que l'ID existe
    
    const now = new Date();
    const sessionDate = new Date(session.date);
    const sessionTime = session.time.split(':');
    sessionDate.setHours(parseInt(sessionTime[0]), parseInt(sessionTime[1]), 0);
    
    const diffMs = sessionDate - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Rappel disponible si séance dans moins de 24h et plus de 1h
    return diffHours > 1 && diffHours <= 24;
  };

  // ✅ Vérifier si le feedback est disponible (séance terminée et pas encore notée)
  const isFeedbackAvailable = (session) => {
    return session.status === 'completed' && !session.feedback_given;
  };

  const getSessionStatus = (session) => {
    const statusMap = {
      'reserved': { label: 'Réservée', color: 'badge-warning', icon: '⏳' },
      'confirmed': { label: 'Confirmée', color: 'badge-primary', icon: '✅' },
      'completed': { label: 'Terminée', color: 'badge-success', icon: '✅' },
      'cancelled': { label: 'Annulée', color: 'badge-danger', icon: '❌' }
    };
    return statusMap[session.status] || { label: session.status, color: 'badge-info', icon: 'ℹ️' };
  };

  const getSessionTypeIcon = (type) => {
    const icons = {
      'EMS': '⚡',
      'Cardio': '🏃',
      'Musculation': '💪',
      'Yoga': '🧘',
      'Pilates': '🧘‍♀️'
    };
    return icons[type] || '🏋️';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-6">
              📅 Mes Séances
            </h1>

            {/* Onglets */}
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-2.5 rounded-xl font-medium transition whitespace-nowrap ${
                  activeTab === 'upcoming'
                    ? 'bg-[#57a1ce] text-white shadow-lg shadow-[#57a1ce]/25'
                    : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover'
                }`}
              >
                📅 À venir
                <span className="ml-2 text-xs opacity-70">
                  ({sessions.filter(s => s.status === 'reserved' || s.status === 'confirmed').length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`px-6 py-2.5 rounded-xl font-medium transition whitespace-nowrap ${
                  activeTab === 'available'
                    ? 'bg-[#57a1ce] text-white shadow-lg shadow-[#57a1ce]/25'
                    : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover'
                }`}
              >
                📋 Disponibles
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2.5 rounded-xl font-medium transition whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'bg-[#57a1ce] text-white shadow-lg shadow-[#57a1ce]/25'
                    : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover'
                }`}
              >
                📜 Historique
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Onglet "À venir" */}
                  {activeTab === 'upcoming' && (
                    <div className="space-y-4">
                      {sessions.filter(s => s.status === 'reserved' || s.status === 'confirmed').length > 0 ? (
                        sessions.filter(s => s.status === 'reserved' || s.status === 'confirmed').map((session) => {
                          const status = getSessionStatus(session);
                          const canSendReminder = isReminderAvailable(session);
                          const isSending = sendingReminder === session.id;
                          
                          return (
                            <motion.div
                              key={session.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm hover:shadow-md transition border border-gray-100 dark:border-dark"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                  <div className="p-3 bg-[#57a1ce]/10 dark:bg-[#57a1ce]/20 rounded-xl">
                                    <span className="text-3xl">
                                      {getSessionTypeIcon(session.type)}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="font-semibold text-gray-800 dark:text-white">
                                        {session.type || 'Séance'}
                                      </h3>
                                      <span className={`badge ${status.color}`}>
                                        {status.icon} {status.label}
                                      </span>
                                      {session.status === 'confirmed' && (
                                        <span className="badge-success text-xs">
                                          👍 Confirmée par le coach
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                      <span className="flex items-center gap-1">
                                        <FaCalendar className="text-xs" />
                                        {formatSessionDate(session.date)}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FaClock className="text-xs" />
                                        {formatTime(session.time)}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FaUser className="text-xs" />
                                        {session.coach_name || 'Coach à définir'}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FaClock className="text-xs" />
                                        {session.duration || 60} min
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Bouton Détails */}
                                  <button
                                    onClick={() => {
                                      setSelectedSession(session);
                                      setShowDetails(true);
                                    }}
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-dark-hover text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-secondary transition"
                                    title="Voir les détails"
                                  >
                                    <FaEye className="text-sm" />
                                  </button>
                                  
                                  {/* Bouton Rappel */}
                                  {canSendReminder && (
                                    <button
                                      onClick={() => handleSendReminder(session.id)}
                                      disabled={isSending}
                                      className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition disabled:opacity-50"
                                      title="Envoyer un rappel"
                                    >
                                      {isSending ? (
                                        <FaSpinner className="animate-spin text-sm" />
                                      ) : (
                                        <FaBell className="text-sm" />
                                      )}
                                    </button>
                                  )}
                                  
                                  {/* Annulation */}
                                  {session.status !== 'cancelled' && session.status !== 'completed' && (
                                    <button
                                      onClick={() => setShowCancelConfirm(session.id)}
                                      className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                      title="Annuler la séance"
                                    >
                                      <FaTimes />
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Information sur le rappel */}
                              {canSendReminder && (
                                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                                  <FaInfoCircle className="text-blue-500 dark:text-blue-400 text-sm" />
                                  <p className="text-xs text-blue-700 dark:text-blue-300">
                                    💡 Un rappel automatique vous sera envoyé 1 heure avant la séance
                                  </p>
                                </div>
                              )}
                              
                              {/* Modal de confirmation d'annulation */}
                              {showCancelConfirm === session.id && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white dark:bg-dark-card rounded-2xl max-w-md w-full p-6"
                                  >
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                      ⚠️ Annuler la séance
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                      Êtes-vous sûr de vouloir annuler cette séance du{' '}
                                      <strong>{formatSessionDate(session.date)} à {formatTime(session.time)}</strong> ?
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                                      Cette action est irréversible.
                                    </p>
                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => handleCancel(session.id)}
                                        className="btn-logo flex-1 bg-red-500 hover:bg-red-600"
                                      >
                                        <FaTimes className="inline mr-2" />
                                        Annuler
                                      </button>
                                      <button
                                        onClick={() => setShowCancelConfirm(null)}
                                        className="btn-secondary flex-1"
                                      >
                                        Retour
                                      </button>
                                    </div>
                                  </motion.div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark">
                          <div className="text-6xl mb-4">📅</div>
                          <p className="text-gray-500 dark:text-gray-400">Aucune séance à venir</p>
                          <button
                            onClick={() => setActiveTab('available')}
                            className="btn-logo text-sm inline-block mt-4"
                          >
                            Voir les séances disponibles
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Onglet "Disponibles" - inchangé */}
                  {activeTab === 'available' && (
                    <div>
                      <div className="mb-4 flex items-center gap-4">
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            📅 Date
                          </label>
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="input-logo mt-1"
                          />
                        </div>
                        <button
                          onClick={() => {
                            // Régénérer les séances disponibles pour le coach (si admin)
                            // Ou simplement recharger
                            fetchSessions();
                          }}
                          className="mt-6 px-4 py-2 bg-[#57a1ce] text-white rounded-lg hover:bg-[#3d7fa8] transition text-sm"
                        >
                          🔄 Actualiser
                        </button>
                      </div>
                      
                      {loading ? (
                        <div className="flex justify-center py-12">
                          <div className="spinner"></div>
                        </div>
                      ) : availableSessions.length > 0 ? (
                        <div className="space-y-4">
                          {availableSessions.map((session) => (
                            <div key={session.id} className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm hover:shadow-md transition border border-gray-100 dark:border-dark">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <span className="text-3xl">{getSessionTypeIcon(session.type)}</span>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white">
                                      {session.type || 'Séance'}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                      <span className="flex items-center gap-1">
                                        <FaClock className="text-xs" />
                                        {formatTime(session.time)}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FaUser className="text-xs" />
                                        {session.coach_name || 'Coach'}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FaClock className="text-xs" />
                                        {session.duration || 60} min
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleReserve(session.id)}
                                  className="btn-logo text-sm flex items-center gap-2"
                                >
                                  <FaCheck />
                                  Réserver
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark">
                          <div className="text-6xl mb-4">📭</div>
                          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Aucune séance disponible
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            Aucune séance n'est disponible pour le <strong>{new Date(selectedDate).toLocaleDateString('fr-FR')}</strong>.
                          </p>
                          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                              onClick={() => {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                setSelectedDate(tomorrow.toISOString().split('T')[0]);
                              }}
                              className="btn-secondary text-sm"
                            >
                              📅 Voir demain
                            </button>
                            <button
                              onClick={() => {
                                const nextWeek = new Date();
                                nextWeek.setDate(nextWeek.getDate() + 7);
                                setSelectedDate(nextWeek.toISOString().split('T')[0]);
                              }}
                              className="btn-secondary text-sm"
                            >
                              📅 Voir dans une semaine
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}


                  {/* Onglet "Historique" avec feedback */}
                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      {sessions.filter(s => s.status === 'completed' || s.status === 'cancelled').length > 0 ? (
                        sessions.filter(s => s.status === 'completed' || s.status === 'cancelled').map((session) => {
                          const status = getSessionStatus(session);
                          const canFeedback = isFeedbackAvailable(session);
                          
                          return (
                            <div key={session.id} className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark opacity-75 hover:opacity-100 transition">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                  <div className="p-3 bg-gray-100 dark:bg-dark-hover rounded-xl">
                                    <span className="text-3xl">{getSessionTypeIcon(session.type)}</span>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white">
                                      {session.type || 'Séance'}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                      <span className="flex items-center gap-1">
                                        <FaCalendar className="text-xs" />
                                        {formatDate(session.date)}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FaClock className="text-xs" />
                                        {formatTime(session.time)}
                                      </span>
                                      {session.coach_name && (
                                        <span className="flex items-center gap-1">
                                          <FaUser className="text-xs" />
                                          {session.coach_name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`badge ${status.color}`}>
                                    {status.icon} {status.label}
                                  </span>
                                  
                                  {/* Bouton Feedback */}
                                  {canFeedback && (
                                    <button
                                      onClick={() => {
                                        setFeedbackModal(session.id);
                                        setFeedbackRating(0);
                                        setFeedbackComment('');
                                      }}
                                      className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"
                                      title="Donner mon avis"
                                    >
                                      <FaStar className="text-sm" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark">
                          <FaCalendar className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">Aucun historique de séances</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Commencez à réserver des séances pour voir votre historique
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>

      {/* Modal Détails de la séance */}
      {showDetails && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-card rounded-2xl max-w-lg w-full p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                📋 Détails de la séance
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-secondary rounded-xl">
                <span className="text-4xl">{getSessionTypeIcon(selectedSession.type)}</span>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {selectedSession.type || 'Séance'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getSessionStatus(selectedSession).icon} {getSessionStatus(selectedSession).label}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Date</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {formatSessionDate(selectedSession.date)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Heure</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {formatTime(selectedSession.time)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Durée</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {selectedSession.duration || 60} minutes
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Coach</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {selectedSession.coach_name || 'À définir'}
                  </p>
                </div>
              </div>

              {selectedSession.status === 'confirmed' && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✅ Séance confirmée par le coach
                  </p>
                </div>
              )}

              {isReminderAvailable(selectedSession) && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    🔔 Vous recevrez un rappel 1 heure avant la séance
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowDetails(false)}
                className="btn-secondary w-full"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Feedback */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-card rounded-2xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ⭐ Donner mon avis
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Comment s'est passée votre séance ?
            </p>

            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedbackRating(star)}
                  className="text-4xl transition hover:scale-110"
                >
                  <FaStar
                    className={star <= feedbackRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              className="input-logo mb-4"
              rows="3"
              placeholder="Votre commentaire (optionnel)..."
            />

            <div className="flex gap-3">
              <button
                onClick={() => handleSendFeedback(feedbackModal)}
                className="btn-logo flex-1"
              >
                <FaCheck className="inline mr-2" />
                Envoyer
              </button>
              <button
                onClick={() => {
                  setFeedbackModal(null);
                  setFeedbackRating(0);
                  setFeedbackComment('');
                }}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Sessions;