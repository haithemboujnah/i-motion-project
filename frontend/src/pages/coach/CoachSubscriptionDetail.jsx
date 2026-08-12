import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaUser, FaCalendar, FaCreditCard,
  FaEdit, FaSave, FaTimes, FaTrash, FaSync,
  FaClock, FaCheck, FaSpinner, FaCrown,
  FaCalendarCheck, FaEnvelope, FaPhone
} from 'react-icons/fa';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import { coachService } from '../../services/coachService';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';

const CoachSubscriptionDetail = () => {
  const { adherentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adherent, setAdherent] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendMonths, setExtendMonths] = useState(1);

  useEffect(() => {
    fetchData();
  }, [adherentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await coachService.getAdherentSubscriptionDetail(adherentId);
      
      if (response.success) {
        setAdherent(response.data.adherent);
        setSubscription(response.data.subscription);
        setTransactions(response.data.transactions || []);
        setStats(response.data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching subscription detail:', error);
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, duration = null) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir ${action === 'extend' ? 'prolonger' : action === 'cancel' ? 'annuler' : 'renouveler'} l'abonnement ?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await coachService.updateAdherentSubscription(adherentId, {
        action,
        duration
      });
      
      if (response.success) {
        toast.success(response.message);
        fetchData();
        setShowExtendModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'action');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'active': 'badge-success',
      'pending_renewal': 'badge-warning',
      'renewal_rejected': 'badge-danger',
      'cancelled': 'badge-danger',
      'expired': 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Actif',
      'pending_renewal': 'En attente de renouvellement',
      'renewal_rejected': 'Renouvellement refusé',
      'cancelled': 'Annulé',
      'expired': 'Expiré'
    };
    return labels[status] || status;
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return '0 DT';
    return `${amount} DT`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CoachNavbar />
        <div className="flex">
          <CoachSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="spinner"></div>
          </main>
        </div>
      </div>
    );
  }

  if (!adherent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CoachNavbar />
        <div className="flex">
          <CoachSidebar />
          <main className="flex-1 p-6">
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400">Adhérent non trouvé</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CoachNavbar />
      <div className="flex">
        <CoachSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate('/coach/subscriptions')}
                className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <FaArrowLeft className="text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                Détails de l'abonnement
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Carte adhérent */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-[#57a1ce]/20 flex items-center justify-center text-[#57a1ce] text-3xl font-bold">
                    {adherent.first_name?.[0]}{adherent.last_name?.[0]}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-4">
                    {adherent.first_name} {adherent.last_name}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">{adherent.email}</p>
                  <div className="flex justify-center gap-2 mt-2">
                    <span className="badge-primary">{adherent.level || 'Niveau non défini'}</span>
                    <span className="badge-info">{adherent.goal || 'Objectif non défini'}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                    Membre depuis {formatDate(adherent.created_at)}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold text-[#57a1ce]">
                        {stats.total_sessions || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Séances</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500">
                        {stats.completed_sessions || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Terminées</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-500">
                        {stats.sessions_last_30_days || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">30 jours</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Détails abonnement */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2 space-y-6"
              >
                {/* Abonnement */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <FaCrown className="text-yellow-500" />
                      Abonnement
                    </h3>
                    {subscription && (
                      <span className={`badge ${getStatusBadge(subscription.status)}`}>
                        {getStatusLabel(subscription.status)}
                      </span>
                    )}
                  </div>

                  {subscription ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {subscription.plan_name || subscription.plan_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Montant</p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {formatAmount(subscription.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Date de début</p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {formatDate(subscription.start_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Date de fin</p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {formatDate(subscription.end_date)}
                        </p>
                      </div>
                      {subscription.renewal_count > 0 && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Nombre de renouvellements</p>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {subscription.renewal_count}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">Aucun abonnement actif</p>
                    </div>
                  )}

                  {/* Actions */}
                  {subscription && subscription.status === 'active' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3">
                      <button
                        onClick={() => setShowExtendModal(true)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                      >
                        <FaCalendarCheck />
                        Prolonger
                      </button>
                      <button
                        onClick={() => handleAction('renew')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading ? <FaSpinner className="animate-spin" /> : <FaSync />}
                        Renouveler
                      </button>
                      <button
                        onClick={() => handleAction('cancel')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                        Annuler
                      </button>
                    </div>
                  )}
                </div>

                {/* Transactions */}
                {transactions.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                      <FaCreditCard className="text-blue-500" />
                      Historique des transactions
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Montant</th>
                            <th className="pb-3">Méthode</th>
                            <th className="pb-3">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction) => (
                            <tr key={transaction.id} className="border-b dark:border-gray-700 last:border-0">
                              <td className="py-3 text-sm text-gray-800 dark:text-gray-300">
                                {formatDateTime(transaction.created_at)}
                              </td>
                              <td className="py-3 font-medium text-gray-800 dark:text-white">
                                {formatAmount(transaction.amount)}
                              </td>
                              <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                                {transaction.payment_method || 'Carte bancaire'}
                              </td>
                              <td className="py-3">
                                <span className={`badge ${
                                  transaction.status === 'completed' ? 'badge-success' :
                                  transaction.status === 'pending' ? 'badge-warning' :
                                  'badge-danger'
                                }`}>
                                  {transaction.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Prolonger */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FaCalendarCheck className="text-green-500" />
                Prolonger l'abonnement
              </h2>
              <button
                onClick={() => setShowExtendModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Prolonger l'abonnement de <strong>{adherent.first_name} {adherent.last_name}</strong>
              </p>

              <div>
                <label className="label-custom">Durée de prolongation</label>
                <select
                  className="input-logo dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(parseInt(e.target.value))}
                >
                  <option value={1}>1 mois</option>
                  <option value={3}>3 mois</option>
                  <option value={6}>6 mois</option>
                  <option value={12}>1 an</option>
                </select>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleAction('extend', extendMonths)}
                  disabled={actionLoading}
                  className="flex-1 btn-logo flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Prolongation...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      Prolonger
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowExtendModal(false)}
                  className="btn-secondary flex-1"
                  disabled={actionLoading}
                >
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CoachSubscriptionDetail;