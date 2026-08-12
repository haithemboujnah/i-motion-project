import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaHistory, FaArrowLeft, FaCheckCircle, FaTimesCircle,
  FaClock, FaCreditCard, FaDownload, FaFileInvoice,
  FaCalendar, FaEuroSign, FaSearch, FaFilter, FaTimes,
  FaEye, FaUserTie, FaUser
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCoach, setFilterCoach] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [coaches, setCoaches] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getTransactions(50);
      const data = response.data.transactions || [];
      setTransactions(data);
      setFilteredTransactions(data);
      
      // ✅ Extraire les coachs uniques des transactions
      const uniqueCoaches = {};
      data.forEach(t => {
        if (t.metadata?.coach_id) {
          const coachKey = t.metadata.coach_id;
          if (!uniqueCoaches[coachKey]) {
            uniqueCoaches[coachKey] = {
              id: t.metadata.coach_id,
              name: t.metadata.coach_name || `Coach ${t.metadata.coach_id}`
            };
          }
        }
      });
      setCoaches(Object.values(uniqueCoaches));
      
      // Calculer les statistiques
      const completed = data.filter(t => t.status === 'completed').length;
      const pending = data.filter(t => t.status === 'pending').length;
      const failed = data.filter(t => t.status === 'failed' || t.status === 'cancelled').length;
      
      const totalAmount = data.reduce((sum, t) => {
        const amount = parseFloat(t.amount) || 0;
        return sum + amount;
      }, 0);
      
      setStats({
        total: data.length,
        completed,
        pending,
        failed,
        totalAmount
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, filterStatus, filterCoach);
  };

  const handleFilterStatus = (status) => {
    setFilterStatus(status);
    applyFilters(searchTerm, status, filterCoach);
  };

  const handleFilterCoach = (coachId) => {
    setFilterCoach(coachId);
    applyFilters(searchTerm, filterStatus, coachId);
  };

  const applyFilters = (term, status, coachId) => {
    let filtered = transactions.filter(t => 
      t.transaction_id?.toLowerCase().includes(term) ||
      t.payment_method?.toLowerCase().includes(term) ||
      t.status?.toLowerCase().includes(term) ||
      t.metadata?.plan_name?.toLowerCase().includes(term) ||
      t.metadata?.coach_name?.toLowerCase().includes(term)
    );

    if (status !== 'all') {
      filtered = filtered.filter(t => t.status === status);
    }

    if (coachId !== 'all') {
      filtered = filtered.filter(t => t.metadata?.coach_id == coachId);
    }

    setFilteredTransactions(filtered);
  };

  // ✅ Afficher les détails de la transaction
  const showTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'completed': 'badge-success',
      'pending': 'badge-warning',
      'failed': 'badge-danger',
      'cancelled': 'badge-danger',
      'refunded': 'badge-info'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'completed': <FaCheckCircle className="text-green-500" />,
      'pending': <FaClock className="text-yellow-500" />,
      'failed': <FaTimesCircle className="text-red-500" />,
      'cancelled': <FaTimesCircle className="text-red-500" />,
      'refunded': <FaClock className="text-blue-500" />
    };
    return icons[status] || <FaClock className="text-gray-500" />;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'completed': 'Réussi',
      'pending': 'En attente',
      'failed': 'Échoué',
      'cancelled': 'Annulé',
      'refunded': 'Remboursé'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0,00 DT';
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return '0,00 DT';
    }
    return `${numAmount.toFixed(2)} DT`;
  };

  const getSafeAmount = (transaction) => {
    if (!transaction) return 0;
    if (transaction.amount !== undefined && transaction.amount !== null) {
      const num = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate('/subscription')}
                className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <FaArrowLeft className="text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <FaHistory className="text-[#57a1ce]" />
                  Historique des paiements
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Retrouvez l'historique de toutes vos transactions
                </p>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-800/30">
                <p className="text-sm text-green-600 dark:text-green-400">Réussis</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 shadow-sm border border-yellow-200 dark:border-yellow-800/30">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">En attente</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 shadow-sm border border-blue-200 dark:border-blue-800/30">
                <p className="text-sm text-blue-600 dark:text-blue-400">Total dépensé</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatAmount(stats.totalAmount)}</p>
              </div>
            </div>

            {/* Filtres */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Rechercher une transaction..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20 transition-all"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleFilterStatus('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === 'all'
                        ? 'bg-[#57a1ce] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => handleFilterStatus('completed')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === 'completed'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Réussis
                  </button>
                  <button
                    onClick={() => handleFilterStatus('pending')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === 'pending'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    En attente
                  </button>
                  <button
                    onClick={() => handleFilterStatus('failed')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === 'failed'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Échoués
                  </button>
                </div>
              </div>

              {/* ✅ Filtre par Coach */}
              {coaches.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <FaUserTie className="text-[#57a1ce]" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Filtrer par coach :</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleFilterCoach('all')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        filterCoach === 'all'
                          ? 'bg-[#57a1ce] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Tous
                    </button>
                    {coaches.map((coach) => (
                      <button
                        key={coach.id}
                        onClick={() => handleFilterCoach(coach.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                          filterCoach == coach.id
                            ? 'bg-[#57a1ce] text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <FaUser className="text-xs" />
                        {coach.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Liste des transactions */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {filteredTransactions.length > 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Transaction
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Montant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Coach
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Méthode
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredTransactions.map((transaction) => {
                            const amount = getSafeAmount(transaction);
                            const coachName = transaction.metadata?.coach_name || 'Non assigné';
                            
                            return (
                              <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <FaCalendar className="text-gray-400 text-sm" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                      {formatDate(transaction.created_at)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                                      {transaction.metadata?.plan_name || 'Paiement I-Motion'}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[150px]">
                                      ID: {transaction.transaction_id?.substring(0, 12) || 'N/A'}...
                                    </p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatAmount(amount)}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <FaUserTie className="text-[#57a1ce] text-sm" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {coachName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <FaCreditCard className="text-gray-400" />
                                    {transaction.payment_method || 'Carte bancaire'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`badge ${getStatusBadge(transaction.status)} flex items-center gap-1 w-fit`}>
                                    {getStatusIcon(transaction.status)}
                                    {getStatusLabel(transaction.status)}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => showTransactionDetails(transaction)}
                                    className="text-sm text-[#57a1ce] hover:text-[#3d7fa8] transition flex items-center gap-1"
                                  >
                                    <FaEye className="text-xs" />
                                    Détail
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <FaFileInvoice className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Aucune transaction
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Vous n'avez pas encore effectué de paiement
                    </p>
                    <button
                      onClick={() => navigate('/subscription')}
                      className="btn-logo text-sm inline-block mt-4"
                    >
                      S'abonner maintenant
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* ✅ Modal Détails Transaction avec Coach */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Détails de la transaction
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedTransaction(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ID Transaction</p>
                  <p className="font-medium text-gray-800 dark:text-white text-sm break-all">
                    {selectedTransaction.transaction_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {formatDate(selectedTransaction.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Montant</p>
                  <p className="font-medium text-gray-800 dark:text-white text-lg">
                    {formatAmount(getSafeAmount(selectedTransaction))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                  <span className={`badge ${getStatusBadge(selectedTransaction.status)}`}>
                    {getStatusLabel(selectedTransaction.status)}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Coach</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FaUserTie className="text-[#57a1ce] text-lg" />
                    <p className="font-medium text-gray-800 dark:text-white">
                      {selectedTransaction.metadata?.coach_name || 'Non assigné'}
                    </p>
                    {selectedTransaction.metadata?.coach_id && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        (ID: {selectedTransaction.metadata.coach_id})
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Méthode de paiement</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {selectedTransaction.payment_method || 'Carte bancaire'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {selectedTransaction.metadata?.plan_name || 'I-Motion'}
                  </p>
                </div>
              </div>

              {selectedTransaction.metadata && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Informations supplémentaires</p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedTransaction(null);
                }}
                className="w-full btn-secondary mt-4"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;