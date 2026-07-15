import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendar, FaSearch, FaFilter, FaPlus,
  FaEdit, FaTrash, FaEye, FaTimes, FaCheck,
  FaUser, FaClock, FaSpinner, FaDownload,
  FaUserTie, FaSave
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminSessions = () => {
  const { isDark } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [formData, setFormData] = useState({
    adherent_id: '',
    coach_id: '',
    date: '',
    time: '',
    duration: 60,
    type: 'EMS'
  });
  const [adherents, setAdherents] = useState([]);
  const [coaches, setCoaches] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, statsRes, adherentsRes, coachesRes] = await Promise.all([
        adminService.getSessions(),
        adminService.getSessionStats(),
        adminService.getUsers({ role: 'adherent' }),
        adminService.getUsers({ role: 'coach' })
      ]);
      
      setSessions(sessionsRes.data.sessions || []);
      setFilteredSessions(sessionsRes.data.sessions || []);
      setStats(statsRes.data.stats || {});
      setAdherents(adherentsRes.data.users || []);
      setCoaches(coachesRes.data.users || []);
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
      s.adherent_first_name?.toLowerCase().includes(term) ||
      s.adherent_last_name?.toLowerCase().includes(term) ||
      s.adherent_email?.toLowerCase().includes(term) ||
      s.type?.toLowerCase().includes(term)
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

  // ✅ Ouvrir le modal de visualisation
  const handleViewSession = (session) => {
    setSelectedSession(session);
    setShowViewModal(true);
  };

  // ✅ Ouvrir le modal d'édition
  const handleEditClick = (session) => {
    setSelectedSession(session);
    setFormData({
      adherent_id: session.adherent_id || '',
      coach_id: session.coach_id || '',
      date: session.date ? new Date(session.date).toISOString().split('T')[0] : '',
      time: session.time || '',
      duration: session.duration || 60,
      type: session.type || 'EMS'
    });
    setShowEditModal(true);
  };

  // ✅ Créer une séance
  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.createSession(formData);
      toast.success('Séance créée avec succès');
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Mettre à jour une séance
  const handleUpdateSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.updateSession(selectedSession.id, formData);
      toast.success('Séance mise à jour avec succès');
      setShowEditModal(false);
      setSelectedSession(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Supprimer une séance
  const handleDeleteSession = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) return;
    
    try {
      await adminService.deleteSession(id);
      toast.success('Séance supprimée avec succès');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      adherent_id: '',
      coach_id: '',
      date: '',
      time: '',
      duration: 60,
      type: 'EMS'
    });
  };

  const statsCards = stats ? [
    { label: 'Total', value: stats.total_sessions || 0, color: '#4f46e5' },
    { label: 'Terminées', value: stats.completed_sessions || 0, color: '#22c55e' },
    { label: 'Réservées', value: stats.reserved_sessions || 0, color: '#f59e0b' },
    { label: 'Annulées', value: stats.cancelled_sessions || 0, color: '#ef4444' }
  ] : [];

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-theme-primary">
                  📅 Gestion des séances
                </h1>
                <p className="text-theme-secondary mt-1">
                  Gérez toutes les séances de la plateforme
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-logo text-sm flex items-center gap-2"
              >
                <FaPlus /> Nouvelle séance
              </button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {statsCards.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-theme-card rounded-xl p-4 shadow-sm border border-theme"
                >
                  <p className="text-sm text-theme-secondary">{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Filtres */}
            <div className="bg-theme-card rounded-xl p-4 shadow-sm border border-theme mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-3.5 text-theme-secondary" />
                  <input
                    type="text"
                    placeholder="Rechercher un adhérent..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="input-logo pl-10"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => handleFilterStatus(e.target.value)}
                  className="input-logo w-40"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="reserved">Réservée</option>
                  <option value="confirmed">Confirmée</option>
                  <option value="completed">Terminée</option>
                  <option value="cancelled">Annulée</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => handleFilterType(e.target.value)}
                  className="input-logo w-40"
                >
                  <option value="all">Tous les types</option>
                  <option value="EMS">EMS</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Musculation">Musculation</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {filteredSessions.length > 0 ? (
                  <div className="bg-theme-card rounded-xl shadow-sm border border-theme overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-theme-secondary border-b border-theme">
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Séance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Adhérent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Coach
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                          {filteredSessions.map((session) => (
                            <tr key={session.id} className="hover:bg-theme-hover transition">
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-theme-primary">{session.type || 'Séance'}</p>
                                  <div className="flex items-center gap-2 text-sm text-theme-secondary">
                                    <FaCalendar className="text-xs" />
                                    {new Date(session.date).toLocaleDateString('fr-FR')}
                                    <FaClock className="text-xs ml-2" />
                                    {session.time?.substring(0, 5)}
                                  </div>
                                  <p className="text-xs text-theme-muted">{session.duration} min</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {session.adherent_first_name ? (
                                  <div>
                                    <p className="font-medium text-theme-primary">
                                      {session.adherent_first_name} {session.adherent_last_name}
                                    </p>
                                    <p className="text-sm text-theme-secondary">{session.adherent_email}</p>
                                  </div>
                                ) : (
                                  <span className="text-theme-muted">Non assigné</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {session.coach_first_name ? (
                                  <p className="font-medium text-theme-primary">
                                    {session.coach_first_name} {session.coach_last_name}
                                  </p>
                                ) : (
                                  <span className="text-theme-muted">Non assigné</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`badge ${getStatusBadge(session.status)}`}>
                                  {getStatusLabel(session.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewSession(session)}
                                    className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                    title="Voir"
                                  >
                                    <FaEye className="text-sm" />
                                  </button>
                                  <button
                                    onClick={() => handleEditClick(session)}
                                    className="p-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition"
                                    title="Modifier"
                                  >
                                    <FaEdit className="text-sm" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSession(session.id)}
                                    className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                                    title="Supprimer"
                                  >
                                    <FaTrash className="text-sm" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-theme-card rounded-xl border border-theme">
                    <FaCalendar className="text-6xl text-theme-muted mx-auto mb-4" />
                    <p className="text-theme-secondary">Aucune séance trouvée</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-theme">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                <FaPlus className="inline mr-2 text-indigo-600" />
                Nouvelle séance
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateSession}>
              <div className="space-y-4">
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
                  <label className="label-custom">Coach</label>
                  <select
                    className="input-logo"
                    value={formData.coach_id}
                    onChange={(e) => setFormData({ ...formData, coach_id: e.target.value })}
                  >
                    <option value="">Sélectionner un coach</option>
                    {coaches.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} ({c.email})
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
                    <option value="EMS">EMS</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Musculation">Musculation</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Pilates">Pilates</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-logo flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-50"
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
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-theme">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                <FaEdit className="inline mr-2 text-yellow-600" />
                Modifier la séance
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSession(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateSession}>
              <div className="space-y-4">
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
                  <label className="label-custom">Coach</label>
                  <select
                    className="input-logo"
                    value={formData.coach_id}
                    onChange={(e) => setFormData({ ...formData, coach_id: e.target.value })}
                  >
                    <option value="">Sélectionner un coach</option>
                    {coaches.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} ({c.email})
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
                    <option value="EMS">EMS</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Musculation">Musculation</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Pilates">Pilates</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-logo flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin inline mr-2" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <FaSave className="inline mr-2" />
                      Mettre à jour
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedSession(null);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de visualisation */}
      {showViewModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-theme">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                <FaEye className="inline mr-2 text-blue-600" />
                Détails de la séance
              </h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedSession(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-semibold text-gray-800">{selectedSession.type || 'Séance'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Statut</p>
                  <span className={`badge ${getStatusBadge(selectedSession.status)}`}>
                    {getStatusLabel(selectedSession.status)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Date et heure</p>
                <p className="font-semibold text-gray-800">
                  {new Date(selectedSession.date).toLocaleDateString('fr-FR')} à {selectedSession.time?.substring(0, 5)}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Durée</p>
                <p className="font-semibold text-gray-800">{selectedSession.duration} minutes</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Adhérent</p>
                  {selectedSession.adherent_first_name ? (
                    <>
                      <p className="font-semibold text-gray-800">
                        {selectedSession.adherent_first_name} {selectedSession.adherent_last_name}
                      </p>
                      <p className="text-xs text-gray-500">{selectedSession.adherent_email}</p>
                    </>
                  ) : (
                    <p className="text-gray-400">Non assigné</p>
                  )}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Coach</p>
                  {selectedSession.coach_first_name ? (
                    <p className="font-semibold text-gray-800">
                      {selectedSession.coach_first_name} {selectedSession.coach_last_name}
                    </p>
                  ) : (
                    <p className="text-gray-400">Non assigné</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Créé le</p>
                <p className="font-semibold text-gray-800">
                  {new Date(selectedSession.created_at).toLocaleString('fr-FR')}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedSession(null);
                }}
                className="btn-secondary w-full"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSessions;