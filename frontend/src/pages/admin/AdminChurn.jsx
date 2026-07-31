import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaExclamationTriangle, FaChartLine, FaUsers,
  FaUserCheck, FaUserTimes, FaShieldAlt,
  FaBell, FaEye, FaClock, FaArrowRight,
  FaCheckCircle, FaTimesCircle,
  FaInfoCircle, FaRobot, FaBrain
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminChurn = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    adherents: [],
    stats: {
      total: 0,
      critical_count: 0,
      high_risk_count: 0,
      medium_risk_count: 0,
      low_risk_count: 0,
      safe_count: 0
    },
    predictions: []
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getChurnAnalysis();
      setData(response.data);
    } catch (error) {
      console.error('Error fetching churn data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    const colors = {
      'Critique': 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      'Élevé': 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      'Moyen': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      'Faible': 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      'Safe': 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    };
    return colors[level] || 'text-gray-600 bg-gray-100 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200 dark:border-gray-700';
  };

  const getRiskIcon = (level) => {
    const icons = {
      'Critique': <FaTimesCircle className="text-red-500 dark:text-red-400" />,
      'Élevé': <FaExclamationTriangle className="text-orange-500 dark:text-orange-400" />,
      'Moyen': <FaExclamationTriangle className="text-yellow-500 dark:text-yellow-400" />,
      'Faible': <FaCheckCircle className="text-green-500 dark:text-green-400" />,
      'Safe': <FaShieldAlt className="text-blue-500 dark:text-blue-400" />
    };
    return icons[level] || <FaInfoCircle className="text-gray-500 dark:text-gray-400" />;
  };

  const getRiskLabel = (level) => {
    const labels = {
      'Critique': 'Action immédiate requise',
      'Élevé': 'Surveillance renforcée',
      'Moyen': 'À surveiller',
      'Faible': 'Bon suivi',
      'Safe': 'Excellent'
    };
    return labels[level] || 'Inconnu';
  };

  const filteredAdherents = data.adherents.filter(a => {
    if (filter === 'all') return true;
    return a.churn?.risk_level === filter;
  });

  const handleViewAdherent = (adherentId) => {
    navigate(`/admin/users?view=${adherentId}`);
  };

  const handleViewInCoach = (adherentId) => {
    window.open(`/coach/adherents/${adherentId}`, '_blank');
  };

  const statsCards = [
    { 
      label: 'Total adhérents', 
      value: data.stats.total || 0, 
      icon: FaUsers, 
      color: '#4f46e5' 
    },
    { 
      label: 'Critique', 
      value: data.stats.critical_count || 0, 
      icon: FaTimesCircle, 
      color: '#ef4444' 
    },
    { 
      label: 'Élevé', 
      value: data.stats.high_risk_count || 0, 
      icon: FaExclamationTriangle, 
      color: '#f97316' 
    },
    { 
      label: 'Moyen', 
      value: data.stats.medium_risk_count || 0, 
      icon: FaExclamationTriangle, 
      color: '#eab308' 
    },
    { 
      label: 'Faible', 
      value: data.stats.low_risk_count || 0, 
      icon: FaCheckCircle, 
      color: '#22c55e' 
    },
    { 
      label: 'Safe', 
      value: data.stats.safe_count || 0, 
      icon: FaShieldAlt, 
      color: '#3b82f6' 
    }
  ];

  const riskLevels = ['all', 'Critique', 'Élevé', 'Moyen', 'Faible', 'Safe'];

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-theme-primary flex items-center gap-3">
                  <FaBrain className="text-purple-500 dark:text-purple-400" />
                  Prédiction de désabonnement (Churn)
                </h1>
                <p className="text-theme-secondary mt-1">
                  Analyse prédictive du risque de désabonnement des adhérents
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FaRobot className="text-purple-500 dark:text-purple-400" />
                <span className="text-sm text-theme-secondary">Modèle ML actif</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {/* Statistiques */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-theme-card rounded-xl p-4 shadow-sm border border-theme hover:shadow-md transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ background: `${stat.color}15` }}>
                            <Icon style={{ color: stat.color }} className="text-lg" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-theme-primary">{stat.value}</p>
                            <p className="text-xs text-theme-secondary">{stat.label}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Filtres */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {riskLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setFilter(level)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                        filter === level
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-theme-card text-theme-secondary hover:bg-theme-hover border border-theme'
                      }`}
                    >
                      {level === 'all' ? 'Tous' : level}
                      {level !== 'all' && (
                        <span className="ml-1 text-xs">
                          ({data.stats[`${level.toLowerCase()}_count`] || 0})
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Liste des adhérents */}
                <div className="bg-theme-card rounded-xl shadow-sm border border-theme overflow-hidden">
                  {filteredAdherents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-theme-secondary border-b border-theme">
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Adhérent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Risque
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Score
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Facteurs
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                          {filteredAdherents.map((adherent) => (
                            <tr key={adherent.id} className="hover:bg-theme-hover transition">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                                    {adherent.first_name?.[0]}{adherent.last_name?.[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium text-theme-primary">
                                      {adherent.first_name} {adherent.last_name}
                                    </p>
                                    <p className="text-sm text-theme-secondary">{adherent.email}</p>
                                    <p className="text-xs text-theme-muted">
                                      ID: #{adherent.id}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {getRiskIcon(adherent.churn?.risk_level)}
                                  <span className={`badge ${getRiskColor(adherent.churn?.risk_level)}`}>
                                    {adherent.churn?.risk_level || 'Inconnu'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-24 h-2 bg-theme-secondary rounded-full">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        adherent.churn?.risk_score >= 80 ? 'bg-red-500' :
                                        adherent.churn?.risk_score >= 60 ? 'bg-orange-500' :
                                        adherent.churn?.risk_score >= 40 ? 'bg-yellow-500' :
                                        adherent.churn?.risk_score >= 20 ? 'bg-green-500' :
                                        'bg-blue-500'
                                      }`}
                                      style={{ width: `${Math.min(adherent.churn?.risk_score || 0, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-theme-primary">
                                    {adherent.churn?.risk_score || 0}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  {Object.entries(adherent.churn?.factors || {}).slice(0, 2).map(([key, value]) => (
                                    <p key={key} className="text-xs text-theme-secondary flex items-center gap-1">
                                      <FaInfoCircle className="text-theme-muted text-xs" />
                                      {value}
                                    </p>
                                  ))}
                                  {Object.keys(adherent.churn?.factors || {}).length > 2 && (
                                    <p className="text-xs text-theme-muted">
                                      +{Object.keys(adherent.churn?.factors || {}).length - 2} autres facteurs
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => handleViewAdherent(adherent.id)}
                                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
                                  >
                                    <FaEye className="text-xs" />
                                    Voir dans Admin
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FaCheckCircle className="text-4xl text-green-500 dark:text-green-400 mx-auto mb-3" />
                      <p className="text-theme-secondary">Aucun adhérent trouvé pour ce filtre</p>
                    </div>
                  )}
                </div>

                {/* Section ML Info */}
                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <FaRobot className="text-purple-600 dark:text-purple-400 text-xl" />
                    <div>
                      <h4 className="font-medium text-purple-800 dark:text-purple-300">Modèle de Machine Learning</h4>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        Le modèle analyse 13 caractéristiques pour prédire le risque de désabonnement
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminChurn;