import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheck, FaTimes, FaClock, FaCalendar,
  FaUser, FaEnvelope, FaSpinner, FaEye,
  FaUserTie, FaCrown, FaCreditCard, FaSearch,
  FaFilter, FaArrowLeft, FaArrowRight, FaSync,
  FaChartLine, FaUsers
} from 'react-icons/fa';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { paymentService } from '../../services/paymentService';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminRenewals = () => {
  const [renewals, setRenewals] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [duration, setDuration] = useState('monthly');
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('renewals');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [renewalsRes, subscriptionsRes] = await Promise.all([
        paymentService.getPendingRenewals(),
        adminService.getAllSubscriptions()
      ]);
      
      setRenewals(renewalsRes.data.renewals || []);
      
      // ✅ Récupérer les abonnements avec les infos des coaches
      const subs = subscriptionsRes.data.subscriptions || [];
      setSubscriptions(subs);
      setFilteredSubscriptions(subs);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (renewal) => {
    setProcessing(renewal.id);
    try {
      await paymentService.approveRenewal(renewal.id, duration);
      toast.success('✅ Renouvellement approuvé avec succès');
      fetchData();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (renewal) => {
    if (!window.confirm('Êtes-vous sûr de vouloir refuser ce renouvellement ?')) {
      return;
    }
    
    setProcessing(renewal.id);
    try {
      await paymentService.rejectRenewal(renewal.id, rejectReason || 'Non spécifié');
      toast.success('❌ Renouvellement refusé');
      fetchData();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du rejet');
    } finally {
      setProcessing(null);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, filterStatus);
  };

  const handleFilter = (status) => {
    setFilterStatus(status);
    applyFilters(searchTerm, status);
  };

  const applyFilters = (term, status) => {
    let filtered = subscriptions.filter(s =>
      s.user_first_name?.toLowerCase().includes(term) ||
      s.user_last_name?.toLowerCase().includes(term) ||
      s.user_email?.toLowerCase().includes(term) ||
      s.coach_first_name?.toLowerCase().includes(term) ||
      s.coach_last_name?.toLowerCase().includes(term) ||
      s.plan_name?.toLowerCase().includes(term)
    );

    if (status !== 'all') {
      filtered = filtered.filter(s => s.status === status);
    }

    setFilteredSubscriptions(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending_renewal': 'badge-warning',
      'active': 'badge-success',
      'renewal_rejected': 'badge-danger',
      'cancelled': 'badge-danger',
      'expired': 'badge-danger',
      'inactive': 'badge-info'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending_renewal': 'En attente',
      'active': 'Actif',
      'renewal_rejected': 'Refusé',
      'cancelled': 'Annulé',
      'expired': 'Expiré',
      'inactive': 'Inactif'
    };
    return labels[status] || status;
  };

  const getDurationLabel = (duration) => {
    const labels = {
      'monthly': 'Mensuel',
      'quarterly': 'Trimestriel',
      'yearly': 'Annuel',
      'session': 'Séance'
    };
    return labels[duration] || duration;
  };

  const tabs = [
    { id: 'renewals', label: 'Demandes de renouvellement', icon: FaClock, count: renewals.length },
    { id: 'subscriptions', label: 'Tous les abonnements', icon: FaCrown, count: subscriptions.length }
  ];

  // ✅ Statistiques des abonnements
  const getSubscriptionStats = () => {
    const total = subscriptions.length;
    const active = subscriptions.filter(s => s.status === 'active').length;
    const pending = subscriptions.filter(s => s.status === 'pending_renewal').length;
    const expired = subscriptions.filter(s => s.status === 'expired' || s.status === 'cancelled').length;
    const withCoach = subscriptions.filter(s => s.coach_id).length;
    
    return { total, active, pending, expired, withCoach };
  };

  const stats = getSubscriptionStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <FaClock className="text-yellow-500" />
                  Gestion des renouvellements
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Gérez les demandes de renouvellement et consultez tous les abonnements
                </p>
              </div>
              <button
                onClick={fetchData}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <FaSync className={`text-sm ${loading ? 'animate-spin' : ''}`} />
                Rafraîchir
              </button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total abonnements</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-800/30">
                <p className="text-sm text-green-600 dark:text-green-400">✅ Actifs</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 shadow-sm border border-yellow-200 dark:border-yellow-800/30">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">⏳ En attente</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 shadow-sm border border-blue-200 dark:border-blue-800/30">
                <p className="text-sm text-blue-600 dark:text-blue-400">👨‍🏫 Avec coach</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.withCoach}</p>
              </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="text-sm" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activeTab === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : activeTab === 'renewals' ? (
              // ✅ Section Demandes de renouvellement
              renewals.length > 0 ? (
                <div className="space-y-4">
                  {renewals.map((renewal) => (
                    <motion.div
                      key={renewal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                              <FaUser />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800 dark:text-white">
                                {renewal.first_name} {renewal.last_name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <FaEnvelope className="text-xs" />
                                {renewal.email}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Plan actuel</p>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {renewal.plan_name || renewal.plan_type}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Montant</p>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {renewal.amount} DT
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Expiration</p>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {formatDate(renewal.end_date)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Jours restants</p>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {renewal.days_remaining || '0'} jours
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <span className={`badge ${getStatusBadge(renewal.status)}`}>
                              {getStatusLabel(renewal.status)}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Demandé le {formatDate(renewal.renewal_requested_at)}
                            </span>
                            {renewal.coach_first_name && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <FaUserTie className="text-[#57a1ce]" />
                                Coach: {renewal.coach_first_name} {renewal.coach_last_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setSelectedRenewal(renewal);
                              setShowModal(true);
                            }}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                            disabled={processing === renewal.id}
                          >
                            {processing === renewal.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <>
                                <FaEye />
                                Traiter
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <FaCheck className="text-6xl text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Aucune demande en attente
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Toutes les demandes de renouvellement ont été traitées
                  </p>
                </div>
              )
            ) : (
              // ✅ Section Tous les abonnements
              <>
                {/* Filtres et recherche */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <FaSearch className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        placeholder="Rechercher un adhérent ou un coach..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20 transition-all"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          filterStatus === 'all'
                            ? 'bg-[#57a1ce] text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Tous
                      </button>
                      <button
                        onClick={() => handleFilter('active')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          filterStatus === 'active'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        ✅ Actifs
                      </button>
                      <button
                        onClick={() => handleFilter('pending_renewal')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          filterStatus === 'pending_renewal'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        ⏳ En attente
                      </button>
                      <button
                        onClick={() => handleFilter('expired')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          filterStatus === 'expired' || filterStatus === 'cancelled'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        ❌ Expirés/Annulés
                      </button>
                    </div>
                  </div>
                </div>

                {/* Liste des abonnements */}
                {filteredSubscriptions.length > 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Adhérent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Coach
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Plan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Montant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Expiration
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredSubscriptions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#57a1ce]/20 flex items-center justify-center text-[#57a1ce] font-bold text-sm">
                                    {sub.user_first_name?.[0]}{sub.user_last_name?.[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800 dark:text-white text-sm">
                                      {sub.user_first_name} {sub.user_last_name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {sub.user_email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {sub.coach_id ? (
                                  <div className="flex items-center gap-2">
                                    <FaUserTie className="text-[#57a1ce] text-sm" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {sub.coach_first_name} {sub.coach_last_name}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400 dark:text-gray-500">Non assigné</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-medium text-gray-800 dark:text-white">
                                  {sub.plan_name || sub.plan_type}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-medium text-gray-800 dark:text-white">
                                  {sub.amount} DT
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`badge ${getStatusBadge(sub.status)}`}>
                                  {getStatusLabel(sub.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {formatDate(sub.end_date)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {filteredSubscriptions.length} abonnements affichés
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <FaCrown className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Aucun abonnement trouvé
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'Essayez une autre recherche' : 'Aucun abonnement dans cette catégorie'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal de traitement */}
      {showModal && selectedRenewal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Traiter le renouvellement
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Adhérent</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {selectedRenewal.first_name} {selectedRenewal.last_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedRenewal.email}</p>
                {selectedRenewal.coach_first_name && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <FaUserTie className="text-[#57a1ce]" />
                    Coach: {selectedRenewal.coach_first_name} {selectedRenewal.coach_last_name}
                  </p>
                )}
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Expiration actuelle</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {formatDate(selectedRenewal.end_date)}
                </p>
              </div>

              <div>
                <label className="label-custom">Durée du renouvellement</label>
                <select
                  className="input-logo dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="monthly">1 mois</option>
                  <option value="quarterly">3 mois</option>
                  <option value="yearly">1 an</option>
                </select>
              </div>

              <div>
                <label className="label-custom">Motif de rejet (si applicable)</label>
                <textarea
                  className="input-logo dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="2"
                  placeholder="Raison du rejet..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleApprove(selectedRenewal)}
                  disabled={processing === selectedRenewal.id}
                  className="flex-1 btn-logo bg-green-500 hover:bg-green-600"
                >
                  {processing === selectedRenewal.id ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <>
                      <FaCheck /> Approuver
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleReject(selectedRenewal)}
                  disabled={processing === selectedRenewal.id}
                  className="flex-1 btn-secondary text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {processing === selectedRenewal.id ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <>
                      <FaTimes /> Refuser
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminRenewals;