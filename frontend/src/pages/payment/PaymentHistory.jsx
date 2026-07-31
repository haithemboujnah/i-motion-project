import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaHistory, FaArrowLeft, FaCheckCircle, FaTimesCircle,
  FaClock, FaCreditCard, FaDownload, FaFileInvoice,
  FaCalendar, FaEuroSign, FaSearch, FaFilter, FaTimes,
  FaEye
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
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
    applyFilters(term, filterStatus);
  };

  const handleFilterStatus = (status) => {
    setFilterStatus(status);
    applyFilters(searchTerm, status);
  };

  const applyFilters = (term, status) => {
    let filtered = transactions.filter(t => 
      t.transaction_id?.toLowerCase().includes(term) ||
      t.payment_method?.toLowerCase().includes(term) ||
      t.status?.toLowerCase().includes(term)
    );

    if (status !== 'all') {
      filtered = filtered.filter(t => t.status === status);
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
      return '0,00 €';
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return '0,00 €';
    }
    return `${numAmount.toFixed(2)} €`;
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate('/subscription')}
                className="p-2 rounded-xl hover:bg-gray-200 transition"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                  <FaHistory className="text-[#57a1ce]" />
                  Historique des paiements
                </h1>
                <p className="text-gray-500 mt-1">
                  Retrouvez l'historique de toutes vos transactions
                </p>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
                <p className="text-sm text-green-600">Réussis</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
                <p className="text-sm text-yellow-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
                <p className="text-sm text-blue-600">Total dépensé</p>
                <p className="text-2xl font-bold text-blue-600">{formatAmount(stats.totalAmount)}</p>
              </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une transaction..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20 transition-all bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFilterStatus('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === 'all'
                        ? 'bg-[#57a1ce] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => handleFilterStatus('completed')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === 'completed'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Réussis
                  </button>
                  <button
                    onClick={() => handleFilterStatus('pending')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === 'pending'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    En attente
                  </button>
                  <button
                    onClick={() => handleFilterStatus('failed')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === 'failed'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Échoués
                  </button>
                </div>
              </div>
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
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Montant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Méthode
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredTransactions.map((transaction) => {
                            const amount = getSafeAmount(transaction);
                            
                            return (
                              <tr key={transaction.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <FaCalendar className="text-gray-400 text-sm" />
                                    <span className="text-sm text-gray-600">
                                      {formatDate(transaction.created_at)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">
                                      {transaction.metadata?.plan_name || 'Paiement I-Motion'}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate max-w-[150px]">
                                      ID: {transaction.transaction_id?.substring(0, 12) || 'N/A'}...
                                    </p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {formatAmount(amount)}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="flex items-center gap-2 text-sm text-gray-600">
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
                  <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                    <FaFileInvoice className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Aucune transaction
                    </h3>
                    <p className="text-gray-500">
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

      {/* ✅ Modal Détails Transaction */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                Détails de la transaction
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedTransaction(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID Transaction</p>
                  <p className="font-medium text-gray-800 text-sm break-all">
                    {selectedTransaction.transaction_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-800">
                    {formatDate(selectedTransaction.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Montant</p>
                  <p className="font-medium text-gray-800 text-lg">
                    {formatAmount(getSafeAmount(selectedTransaction))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className={`badge ${getStatusBadge(selectedTransaction.status)}`}>
                    {getStatusLabel(selectedTransaction.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Méthode de paiement</p>
                  <p className="font-medium text-gray-800">
                    {selectedTransaction.payment_method || 'Carte bancaire'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <p className="font-medium text-gray-800">
                    {selectedTransaction.metadata?.plan_name || 'I-Motion'}
                  </p>
                </div>
              </div>

              {selectedTransaction.metadata && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500 mb-2">Informations supplémentaires</p>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
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