import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, FaSearch, FaFilter, FaEye, FaEdit,
  FaCalendar, FaClock, FaCheck, FaTimes,
  FaSpinner, FaUser, FaEnvelope, FaPhone,
  FaCrown, FaCreditCard, FaCalendarCheck,
  FaArrowLeft, FaPlus, FaSync, FaBan
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import { coachService } from '../../services/coachService';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';

const CoachSubscriptions = () => {
  const navigate = useNavigate();
  const [adherents, setAdherents] = useState([]);
  const [filteredAdherents, setFilteredAdherents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    pending: 0
  });

  useEffect(() => {
    fetchAdherents();
  }, []);

  const fetchAdherents = async () => {
    try {
      setLoading(true);
      const response = await coachService.getAdherentsWithSubscriptions();
      
      if (response.success) {
        const data = response.data.adherents || [];
        setAdherents(data);
        setFilteredAdherents(data);
        
        // Calculer les statistiques
        const total = data.length;
        const active = data.filter(a => a.hasActiveSubscription).length;
        const expired = data.filter(a => !a.hasActiveSubscription && a.subscription).length;
        const pending = data.filter(a => a.subscription?.status === 'pending_renewal').length;
        
        setStats({ total, active, expired, pending });
      }
    } catch (error) {
      console.error('Error fetching adherents:', error);
      toast.error('Erreur lors du chargement des adhérents');
    } finally {
      setLoading(false);
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
    let filtered = adherents.filter(a =>
      a.first_name?.toLowerCase().includes(term) ||
      a.last_name?.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term)
    );

    if (status === 'active') {
      filtered = filtered.filter(a => a.hasActiveSubscription);
    } else if (status === 'expired') {
      filtered = filtered.filter(a => !a.hasActiveSubscription && a.subscription);
    } else if (status === 'pending') {
      filtered = filtered.filter(a => a.subscription?.status === 'pending_renewal');
    } else if (status === 'no_subscription') {
      filtered = filtered.filter(a => !a.subscription);
    }

    setFilteredAdherents(filtered);
  };

  const getStatusBadge = (adherent) => {
    if (!adherent.subscription) {
      return { label: 'Sans abonnement', color: 'badge-info' };
    }
    if (adherent.hasActiveSubscription) {
      return { label: '✅ Actif', color: 'badge-success' };
    }
    if (adherent.subscription.status === 'pending_renewal') {
      return { label: '⏳ En attente', color: 'badge-warning' };
    }
    if (adherent.subscription.status === 'cancelled' || adherent.subscription.status === 'renewal_rejected') {
      return { label: '❌ Annulé', color: 'badge-danger' };
    }
    return { label: '📅 Expiré', color: 'badge-danger' };
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CoachNavbar />
      <div className="flex">
        <CoachSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <FaCrown className="text-yellow-500" />
                  Abonnements des adhérents
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Gérez les abonnements de vos adhérents
                </p>
              </div>
              <button
                onClick={fetchAdherents}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <FaSync className={`text-sm ${loading ? 'animate-spin' : ''}`} />
                Rafraîchir
              </button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total adhérents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-800/30">
                <p className="text-sm text-green-600 dark:text-green-400">✅ Actifs</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 shadow-sm border border-red-200 dark:border-red-800/30">
                <p className="text-sm text-red-600 dark:text-red-400">❌ Expirés</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.expired}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 shadow-sm border border-yellow-200 dark:border-yellow-800/30">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">⏳ En attente</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un adhérent..."
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
                    onClick={() => handleFilter('expired')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === 'expired'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    ❌ Expirés
                  </button>
                  <button
                    onClick={() => handleFilter('pending')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === 'pending'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    ⏳ En attente
                  </button>
                  <button
                    onClick={() => handleFilter('no_subscription')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === 'no_subscription'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Sans abonnement
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des adhérents */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredAdherents.length > 0 ? (
                  filteredAdherents.map((adherent) => {
                    const status = getStatusBadge(adherent);
                    const daysRemaining = adherent.subscription ? getDaysRemaining(adherent.subscription.end_date) : 0;
                    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
                    
                    return (
                      <div
                        key={adherent.id}
                        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 transition-all duration-300 hover:shadow-lg ${
                          isExpiringSoon 
                            ? 'border-yellow-400' 
                            : adherent.hasActiveSubscription 
                              ? 'border-green-200 dark:border-green-800/30' 
                              : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[#57a1ce]/20 flex items-center justify-center text-[#57a1ce] text-xl font-bold">
                              {adherent.first_name?.[0]}{adherent.last_name?.[0]}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800 dark:text-white">
                                {adherent.first_name} {adherent.last_name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{adherent.email}</p>
                            </div>
                          </div>
                          <span className={`badge ${status.color}`}>
                            {status.label}
                          </span>
                        </div>

                        {/* Informations abonnement */}
                        {adherent.subscription ? (
                          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500 dark:text-gray-400">Plan</p>
                                <p className="font-medium text-gray-800 dark:text-white">
                                  {adherent.subscription.plan_name || adherent.subscription.plan_type}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400">Montant</p>
                                <p className="font-medium text-gray-800 dark:text-white">
                                  {adherent.subscription.amount} DT
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400">Début</p>
                                <p className="font-medium text-gray-800 dark:text-white">
                                  {formatDate(adherent.subscription.start_date)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400">Fin</p>
                                <p className="font-medium text-gray-800 dark:text-white">
                                  {formatDate(adherent.subscription.end_date)}
                                </p>
                              </div>
                            </div>
                            {adherent.hasActiveSubscription && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full">
                                  <div 
                                    className="h-1.5 bg-green-500 rounded-full"
                                    style={{ 
                                      width: `${Math.min((daysRemaining / 30) * 100, 100)}%` 
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {daysRemaining} jours restants
                                </span>
                              </div>
                            )}
                            {isExpiringSoon && (
                              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                                  ⚠️ Expire dans {daysRemaining} jours
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Aucun abonnement actif
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => navigate(`/coach/adherents/${adherent.id}`)}
                            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                          >
                            <FaEye className="text-sm" />
                            Voir
                          </button>
                          {adherent.subscription && (
                            <button
                              onClick={() => navigate(`/coach/subscriptions/${adherent.id}/detail`)}
                              className="flex-1 px-4 py-2 bg-[#57a1ce] hover:bg-[#3d7fa8] text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                            >
                              <FaEdit className="text-sm" />
                              Gérer
                            </button>
                          )}
                          {!adherent.subscription && (
                            <button
                              onClick={() => navigate(`/coach/subscriptions/${adherent.id}/create`)}
                              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                            >
                              <FaPlus className="text-sm" />
                              Créer
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-xl">
                    <FaUsers className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Aucun adhérent trouvé
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'Essayez une autre recherche' : 'Aucun adhérent avec abonnement'}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoachSubscriptions;