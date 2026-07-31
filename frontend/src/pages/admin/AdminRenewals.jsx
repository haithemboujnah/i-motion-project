import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheck, FaTimes, FaClock, FaCalendar,
  FaUser, FaEnvelope, FaSpinner, FaEye
} from 'react-icons/fa';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { paymentService } from '../../services/paymentService';
import { notificationService } from '../../services/notificationService';
import toast from 'react-hot-toast';

const AdminRenewals = () => {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [duration, setDuration] = useState('monthly');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchRenewals();
  }, []);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPendingRenewals();
      setRenewals(response.data.renewals || []);
    } catch (error) {
      console.error('Error fetching renewals:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (renewal) => {
    setProcessing(renewal.id);
    try {
      await paymentService.approveRenewal(renewal.id, duration);
      toast.success('✅ Renouvellement approuvé avec succès');
      fetchRenewals();
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
      fetchRenewals();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du rejet');
    } finally {
      setProcessing(null);
    }
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
      'cancelled': 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending_renewal': 'En attente',
      'active': 'Actif',
      'renewal_rejected': 'Refusé',
      'cancelled': 'Annulé'
    };
    return labels[status] || status;
  };

  const getDurationLabel = (duration) => {
    const labels = {
      'monthly': 'Mensuel',
      'quarterly': 'Trimestriel',
      'yearly': 'Annuel'
    };
    return labels[duration] || duration;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                  <FaClock className="text-yellow-500" />
                  Gestion des renouvellements
                </h1>
                <p className="text-gray-500 mt-1">
                  Approuvez ou refusez les demandes de renouvellement d'abonnement
                </p>
              </div>
              <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium">
                {renewals.length} demande(s) en attente
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : renewals.length > 0 ? (
              <div className="space-y-4">
                {renewals.map((renewal) => (
                  <motion.div
                    key={renewal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                            <FaUser />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {renewal.first_name} {renewal.last_name}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <FaEnvelope className="text-xs" />
                              {renewal.email}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-gray-500">Plan actuel</p>
                            <p className="text-sm font-medium text-gray-800">
                              {renewal.plan_name || renewal.plan_type}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Montant</p>
                            <p className="text-sm font-medium text-gray-800">
                              {renewal.amount} DT
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Expiration</p>
                            <p className="text-sm font-medium text-gray-800">
                              {formatDate(renewal.end_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Jours restants</p>
                            <p className="text-sm font-medium text-gray-800">
                              {renewal.days_remaining || '0'} jours
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`badge ${getStatusBadge(renewal.status)}`}>
                            {getStatusLabel(renewal.status)}
                          </span>
                          <span className="text-xs text-gray-400">
                            Demandé le {formatDate(renewal.renewal_requested_at)}
                          </span>
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
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                <FaCheck className="text-6xl text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Aucune demande en attente
                </h3>
                <p className="text-gray-500">
                  Toutes les demandes de renouvellement ont été traitées
                </p>
              </div>
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
            className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                Traiter le renouvellement
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Adhérent</p>
                <p className="font-medium text-gray-800">
                  {selectedRenewal.first_name} {selectedRenewal.last_name}
                </p>
                <p className="text-sm text-gray-500">{selectedRenewal.email}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Expiration actuelle</p>
                <p className="font-medium text-gray-800">
                  {formatDate(selectedRenewal.end_date)}
                </p>
              </div>

              <div>
                <label className="label-custom">Durée du renouvellement</label>
                <select
                  className="input-logo"
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
                  className="input-logo"
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
                  className="flex-1 btn-secondary text-red-600 border-red-300 hover:bg-red-50"
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