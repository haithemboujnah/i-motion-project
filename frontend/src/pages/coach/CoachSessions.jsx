import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendar, FaClock, FaUser, FaPlus, FaSearch, 
  FaFilter, FaCheck, FaTimes, FaEye, FaEdit,
  FaTrash, FaSpinner, FaQrcode, FaImage,
  FaBolt, FaWeight, FaHandSparkles, FaUserMd
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import { coachService } from '../../services/coachService';
import { authService } from '../../services/authService';
import { formatDate, formatTime, formatSessionDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const CoachSessions = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [adherents, setAdherents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    adherent_id: '',
    date: '',
    time: '',
    duration: 20,
    type: 'EMS'
  });

  // ✅ Types de séances basés sur vos exercices
  const sessionTypes = [
    { value: 'EMS', label: 'EMS', icon: '⚡', color: '#57a1ce' },
    { value: 'I-Model', label: 'I-Model', icon: '🏋️', color: '#22c55e' },
    { value: 'I-Shape', label: 'I-Shape', icon: '💆', color: '#8b5cf6' },
    { value: 'I-Face', label: 'I-Face', icon: '✨', color: '#ec4899' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'reserved', label: 'Réservée' },
    { value: 'confirmed', label: 'Confirmée' },
    { value: 'completed', label: 'Terminée' },
    { value: 'cancelled', label: 'Annulée' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, adherentsRes] = await Promise.all([
        coachService.getSessions(),
        coachService.getAdherents()
      ]);
      
      setSessions(sessionsRes.data.sessions || []);
      setFilteredSessions(sessionsRes.data.sessions || []);
      setAdherents(adherentsRes.data.adherents || []);
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
    applyFilters(term, filterStatus, filterType);
  };

  const handleFilterStatus = (status) => {
    setFilterStatus(status);
    applyFilters(searchTerm, status, filterType);
  };

  const handleFilterType = (type) => {
    setFilterType(type);
    applyFilters(searchTerm, filterStatus, type);
  };

  const applyFilters = (term, status, type) => {
    let filtered = sessions.filter(s =>
      s.type?.toLowerCase().includes(term) ||
      s.adherent_first_name?.toLowerCase().includes(term) ||
      s.adherent_last_name?.toLowerCase().includes(term)
    );

    if (status !== 'all') {
      filtered = filtered.filter(s => s.status === status);
    }

    if (type !== 'all') {
      filtered = filtered.filter(s => s.type === type);
    }

    setFilteredSessions(filtered);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'reserved': 'badge-warning',
      'confirmed': 'badge-primary',
      'completed': 'badge-success',
      'cancelled': 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'reserved': 'Réservée',
      'confirmed': 'Confirmée',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  };

  // ✅ Créer une séance (CORRIGÉ)
  const handleCreateSession = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.adherent_id) {
      toast.error('Veuillez sélectionner un adhérent');
      return;
    }
    
    if (!formData.date) {
      toast.error('Veuillez sélectionner une date');
      return;
    }
    
    if (!formData.time) {
      toast.error('Veuillez sélectionner une heure');
      return;
    }
    
    setSubmitting(true);
    try {
      // ✅ Envoyer les données au service
      const response = await coachService.createSession({
        adherent_id: parseInt(formData.adherent_id),
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration) || 20,
        type: formData.type || 'EMS'
      });
      
      console.log('✅ Séance créée:', response);
      toast.success('✅ Séance créée avec succès !');
      setShowCreateModal(false);
      setFormData({ 
        adherent_id: '', 
        date: '', 
        time: '', 
        duration: 20, 
        type: 'EMS' 
      });
      fetchData(); // Recharger les données
    } catch (error) {
      console.error('❌ Error creating session:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (sessionId, status) => {
    try {
      await coachService.updateSessionStatus(sessionId, status);
      toast.success(`Séance ${status === 'completed' ? 'terminée' : 'mise à jour'} avec succès`);
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;
    try {
      await coachService.deleteSession(selectedSession.id);
      toast.success('Séance supprimée avec succès');
      setShowDeleteModal(false);
      setSelectedSession(null);
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleQRScanComplete = (data) => {
    console.log('✅ Pointage effectué:', data);
    toast.success(`✅ ${data.adherent.first_name} ${data.adherent.last_name} pointé !`);
    fetchData();
    setTimeout(() => {
      setShowQRScanner(false);
    }, 2000);
  };

  const getStatusColor = (status) => {
    const colors = {
      'reserved': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'confirmed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  // ✅ Rediriger vers la page de création
  const handleCreateClick = () => {
    navigate('/coach/sessions/create');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
      <CoachNavbar />
      <div className="flex">
        <CoachSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                  📅 Gestion des séances
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Gérez vos séances et pointez les adhérents
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-3">
                <button
                  onClick={handleCreateClick}
                  className="btn-logo text-sm flex items-center gap-2"
                >
                  <FaPlus /> Nouvelle séance
                </button>
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un adhérent ou un type..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark rounded-lg focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => handleFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 dark:border-dark rounded-lg focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={filterType}
                  onChange={(e) => handleFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-200 dark:border-dark rounded-lg focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                >
                  <option value="all">Tous les types</option>
                  {sessionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {filteredSessions.length > 0 ? (
                  <div className="space-y-4">
                    {filteredSessions.map((session) => (
                      <div
                        key={session.id}
                        className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm hover:shadow-md transition border border-gray-100 dark:border-dark"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-[#57a1ce]/10 dark:bg-[#57a1ce]/20">
                              <FaCalendar className="text-[#57a1ce] text-2xl" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                                  {session.type || 'Séance'}
                                </h3>
                                <span className={`badge ${getStatusBadge(session.status)}`}>
                                  {getStatusLabel(session.status)}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <FaCalendar className="text-xs" />
                                  {formatSessionDate(session.date)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FaClock className="text-xs" />
                                  {formatTime(session.time)}
                                </span>
                                <span className="flex items-center gap-1">
                                  {session.duration} min
                                </span>
                              </div>
                              {session.adherent_first_name && (
                                <div className="mt-1">
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    👤 {session.adherent_first_name} {session.adherent_last_name}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {session.adherent_email}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4 md:mt-0 flex-wrap">
                            {/* Actions */}
                            {session.status === 'reserved' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(session.id, 'confirmed')}
                                  className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                                  title="Confirmer"
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(session.id, 'cancelled')}
                                  className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                  title="Annuler"
                                >
                                  <FaTimes />
                                </button>
                              </>
                            )}
                            {session.status === 'confirmed' && (
                              <button
                                onClick={() => handleUpdateStatus(session.id, 'completed')}
                                className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                                title="Terminer"
                              >
                                <FaCheck />
                              </button>
                            )}
                            {session.status === 'completed' && (
                              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                <FaCheck className="text-xs" />
                                Terminée
                              </span>
                            )}
                            {session.status === 'cancelled' && (
                              <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                <FaTimes className="text-xs" />
                                Annulée
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setSelectedSession(session);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                              title="Supprimer"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white dark:bg-dark-card rounded-xl">
                    <FaCalendar className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Aucune séance trouvée</p>
                    <button
                      onClick={handleCreateClick}
                      className="btn-logo text-sm inline-block mt-4"
                    >
                      <FaPlus className="inline mr-2" />
                      Créer une séance
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Suppression */}
      {showDeleteModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Supprimer la séance
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer la séance du{' '}
              <strong>{formatDate(selectedSession.date)}</strong> à{' '}
              <strong>{formatTime(selectedSession.time)}</strong> ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteSession}
                className="btn-logo flex-1 bg-red-500 hover:bg-red-600"
              >
                Supprimer
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSession(null);
                }}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachSessions;