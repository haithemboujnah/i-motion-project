import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendar, FaClock, FaUser, FaPlus, FaSearch, 
  FaFilter, FaCheck, FaTimes, FaEye, FaEdit,
  FaTrash, FaSpinner, FaQrcode, FaImage
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import QRImageScanner from '../../components/qr/QRImageScanner';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [adherents, setAdherents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    adherent_id: '',
    date: '',
    time: '',
    duration: 60,
    type: 'EMS'
  });

  const sessionTypes = ['EMS', 'Cardio', 'Musculation', 'Yoga', 'Pilates', 'CrossFit'];

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

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await coachService.createSession(formData);
      toast.success('Séance créée avec succès');
      setShowCreateModal(false);
      setFormData({ adherent_id: '', date: '', time: '', duration: 60, type: 'EMS' });
      fetchData();
    } catch (error) {
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
    // Fermer le scanner après 2 secondes
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

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'reserved', label: 'Réservée' },
    { value: 'confirmed', label: 'Confirmée' },
    { value: 'completed', label: 'Terminée' },
    { value: 'cancelled', label: 'Annulée' }
  ];

  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    ...sessionTypes.map(type => ({ value: type, label: type }))
  ];

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
                  onClick={() => {
                    setSelectedSessionId(null);
                    setShowQRScanner(true);
                  }}
                  className="btn-logo text-sm flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <FaQrcode /> Scanner QR
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
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
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(session.status)}`}>
                                  {session.status}
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
                            {/* Actions pour le coach */}
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
                                <button
                                  onClick={() => {
                                    setSelectedSessionId(session.id);
                                    setShowQRScanner(true);
                                  }}
                                  className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                                  title="Scanner QR"
                                >
                                  <FaQrcode />
                                </button>
                              </>
                            )}
                            {session.status === 'confirmed' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(session.id, 'completed')}
                                  className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                                  title="Terminer"
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSessionId(session.id);
                                    setShowQRScanner(true);
                                  }}
                                  className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                                  title="Scanner QR"
                                >
                                  <FaQrcode />
                                </button>
                              </>
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
                      onClick={() => setShowCreateModal(true)}
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

      {/* Modal Scanner QR Code */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-dark">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FaQrcode className="text-purple-500" />
                Scanner QR Code
              </h2>
              <button
                onClick={() => setShowQRScanner(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition text-gray-500 dark:text-gray-400"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-4">
              <QRImageScanner 
                sessionId={selectedSessionId}
                onScanComplete={handleQRScanComplete}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-dark">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                <FaPlus className="inline mr-2 text-[#57a1ce]" />
                Créer une séance
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition text-gray-500 dark:text-gray-400"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="p-4 space-y-4">
              <div>
                <label className="label-custom">Adhérent *</label>
                <select
                  required
                  className="input-logo"
                  value={formData.adherent_id}
                  onChange={(e) => setFormData({ ...formData, adherent_id: e.target.value })}
                >
                  <option value="">Sélectionner un adhérent</option>
                  {adherents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.first_name} {a.last_name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-custom">Date *</label>
                <input
                  type="date"
                  required
                  className="input-logo"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="label-custom">Heure *</label>
                <input
                  type="time"
                  required
                  className="input-logo"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div>
                <label className="label-custom">Durée (minutes)</label>
                <input
                  type="number"
                  className="input-logo"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  min="15"
                  max="120"
                />
              </div>
              <div>
                <label className="label-custom">Type</label>
                <select
                  className="input-logo"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {sessionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-logo flex-1 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin inline mr-2" />
                      Création...
                    </>
                  ) : (
                    'Créer'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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