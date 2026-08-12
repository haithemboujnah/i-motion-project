import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChartLine, FaExclamationTriangle, FaCalendar, FaCheckCircle,
  FaUsers, FaUserCheck, FaUserTimes, FaClock, FaEnvelope,
  FaFilePdf, FaDownload, FaEye, FaBrain,
  FaChartPie, FaChartBar, FaArrowUp, FaArrowDown,
  FaShieldAlt, FaTimesCircle, FaSpinner, FaFilter,
  FaSearch, FaSlidersH, FaLightbulb, FaRocket,
  FaCalendarAlt, FaUserPlus, FaUserMinus,
  FaMinus, FaThumbsUp, FaThumbsDown, FaHeart
} from 'react-icons/fa';
import { FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa6';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminAnalytics = () => {
  const [churnData, setChurnData] = useState({
    stats: { total: 0, critical_count: 0, high_risk_count: 0, medium_risk_count: 0, low_risk_count: 0, safe_count: 0 },
    predictions: [],
    adherents: []
  });
  const [prediction, setPrediction] = useState(null);
  const [retentionReport, setRetentionReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [viewMode, setViewMode] = useState('cards');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [churnRes, predRes, reportRes] = await Promise.all([
        adminService.getChurnAnalysis(),
        adminService.getPrediction(),
        adminService.getRetentionReport()
      ]);
      
      if (churnRes.success) {
        setChurnData({
          stats: churnRes.data.stats || { total: 0, critical_count: 0, high_risk_count: 0, medium_risk_count: 0, low_risk_count: 0, safe_count: 0 },
          predictions: churnRes.data.predictions || [],
          adherents: churnRes.data.adherents || []
        });
      }
      
      setPrediction(predRes.data.prediction);
      setRetentionReport(reportRes.data.report);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: FaChartLine },
    { id: 'risk', label: 'Analyse des risques', icon: FaExclamationTriangle },
    { id: 'prediction', label: 'Prédictions', icon: FaBrain },
    { id: 'retention', label: 'Fidélisation', icon: FaUserCheck },
    { id: 'actions', label: 'Actions recommandées', icon: FaRocket }
  ];

  // ✅ Calcul des métriques de santé
  const getHealthScore = () => {
    const stats = churnData.stats;
    const total = stats.total || 1;
    const safe = stats.safe_count || 0;
    const critical = stats.critical_count || 0;
    const high = stats.high_risk_count || 0;
    
    const healthScore = Math.round(((safe / total) * 100) - ((critical + high) / total) * 20);
    return Math.max(0, Math.min(100, healthScore));
  };

  const healthScore = getHealthScore();

  // ✅ Couleur en fonction du score
  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  // ✅ Icône de tendance
  const getTrendIcon = (trend) => {
    if (trend === 'positive') return <FaArrowTrendUp className="text-green-500" />;
    if (trend === 'negative') return <FaArrowTrendDown className="text-red-500" />;
    return <FaMinus className="text-yellow-500" />;
  };

  // ✅ Recommandations dynamiques
  const getSmartRecommendations = () => {
    const stats = churnData.stats;
    const recommendations = [];
    
    if (stats.critical_count > 0) {
      recommendations.push({
        id: 1,
        title: '🔴 Intervention urgente',
        description: `${stats.critical_count} adhérent(s) en risque critique. Contact immédiat requis.`,
        priority: 'high',
        action: '📞 Appeler immédiatement',
        icon: FaExclamationTriangle,
        color: 'red'
      });
    }
    
    if (stats.high_risk_count > 0) {
      recommendations.push({
        id: 2,
        title: '🟠 Surveillance renforcée',
        description: `${stats.high_risk_count} adhérent(s) à risque élevé. Programme de réengagement recommandé.`,
        priority: 'high',
        action: '📊 Suivi personnalisé',
        icon: FaChartLine,
        color: 'orange'
      });
    }
    
    if (stats.medium_risk_count > 0) {
      recommendations.push({
        id: 3,
        title: '🟡 Attention modérée',
        description: `${stats.medium_risk_count} adhérent(s) à risque moyen. Maintenir le contact.`,
        priority: 'medium',
        action: '📧 Email de suivi',
        icon: FaEnvelope,
        color: 'yellow'
      });
    }
    
    if (stats.critical_count === 0 && stats.high_risk_count === 0 && stats.medium_risk_count === 0) {
      recommendations.push({
        id: 4,
        title: '✅ Excellente santé',
        description: 'Tous les adhérents sont en bonne santé. Continuez ainsi !',
        priority: 'low',
        action: '🌟 Maintenir l\'élan',
        icon: FaThumbsUp,
        color: 'green'
      });
    }
    
    if (retentionReport && retentionReport.avg_attendance < 50) {
      recommendations.push({
        id: 5,
        title: '📊 Améliorer l\'assiduité',
        description: `Assiduité moyenne de ${retentionReport.avg_attendance}%. Proposer des rappels.`,
        priority: 'medium',
        action: '⏰ Activer les rappels',
        icon: FaClock,
        color: 'blue'
      });
    }
    
    return recommendations;
  };

  // ✅ KPI Cards
  const renderKPICards = () => {
    const stats = churnData.stats;
    const total = stats.total || 1;
    
    const kpis = [
      { 
        label: 'Santé globale', 
        value: `${healthScore}%`, 
        icon: FaHeart, 
        color: getHealthColor(healthScore),
        subtitle: `${stats.safe_count} adhérents sécurisés`
      },
      { 
        label: 'Taux de risque', 
        value: `${Math.round(((stats.critical_count || 0) + (stats.high_risk_count || 0)) / total * 100)}%`, 
        icon: FaExclamationTriangle, 
        color: 'text-red-500',
        subtitle: `${(stats.critical_count || 0) + (stats.high_risk_count || 0)} à risque`
      },
      { 
        label: 'Adhérents actifs', 
        value: stats.safe_count || 0, 
        icon: FaUserCheck, 
        color: 'text-green-500',
        subtitle: `${Math.round((stats.safe_count / total) * 100)}% du total`
      },
      { 
        label: 'Churn potentiel', 
        value: stats.critical_count || 0, 
        icon: FaUserMinus, 
        color: 'text-red-500',
        subtitle: 'À surveiller de près'
      }
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{kpi.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${kpi.color} bg-opacity-10`}>
                  <Icon className={`text-2xl ${kpi.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  // ✅ Distribution des risques
  const renderRiskDistribution = () => {
    const stats = churnData.stats;
    const total = stats.total || 1;
    
    const riskLevels = [
      { label: 'Critique', value: stats.critical_count || 0, color: 'bg-red-500', textColor: 'text-red-500' },
      { label: 'Élevé', value: stats.high_risk_count || 0, color: 'bg-orange-500', textColor: 'text-orange-500' },
      { label: 'Moyen', value: stats.medium_risk_count || 0, color: 'bg-yellow-500', textColor: 'text-yellow-500' },
      { label: 'Faible', value: stats.low_risk_count || 0, color: 'bg-green-500', textColor: 'text-green-500' },
      { label: 'Safe', value: stats.safe_count || 0, color: 'bg-blue-500', textColor: 'text-blue-500' }
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FaChartPie className="text-indigo-500" />
          Distribution des risques
        </h3>
        <div className="space-y-3">
          {riskLevels.map((level) => {
            const percentage = total > 0 ? Math.round((level.value / total) * 100) : 0;
            return (
              <div key={level.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{level.label}</span>
                  <span className={`font-semibold ${level.textColor}`}>
                    {level.value} ({percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1 }}
                    className={`h-2 rounded-full ${level.color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Total adhérents</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">{total}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Sains</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {Math.round(((stats.safe_count || 0) / total) * 100)}%
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Graphique de tendance (CORRIGÉ - avec valeurs par défaut)
  const renderTrendChart = () => {
    if (!prediction) return null;
    
    // ✅ S'assurer que les données sont valides
    const historicalData = prediction.history && prediction.history.length > 0 
      ? prediction.history.map(v => typeof v === 'number' && !isNaN(v) ? v : 0)
      : [5, 8, 6, 12, 9, 7];
    
    const futureData = prediction.forecast && prediction.forecast.length > 0
      ? prediction.forecast.map(v => typeof v === 'number' && !isNaN(v) ? v : 0)
      : [7, 9, 12];
    
    const labels = prediction.labels && prediction.labels.length > 0
      ? prediction.labels
      : ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    
    // ✅ Si les données sont vides, ne pas afficher le graphique
    if (historicalData.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FaChartLine className="text-indigo-500" />
            Évolution et prédiction
          </h3>
          <div className="text-center py-8">
            <p className="text-gray-500">Données insuffisantes pour le graphique</p>
          </div>
        </div>
      );
    }
    
    const allData = [...historicalData, ...futureData];
    const maxValue = Math.max(...allData, 1);
    const width = 600;
    const height = 150;
    const padding = 20;
    
    // ✅ Séparer les données historiques et futures
    const historicalPoints = historicalData.map((value, i) => ({
      x: padding + (i / (historicalData.length - 1 || 1)) * width * 0.6,
      y: padding + height - (value / maxValue) * height * 0.8
    }));
    
    const futurePoints = futureData.map((value, i) => ({
      x: padding + width * 0.6 + (i / (futureData.length - 1 || 1)) * width * 0.4,
      y: padding + height - (value / maxValue) * height * 0.8
    }));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <FaChartLine className="text-indigo-500" />
            Évolution et prédiction
          </h3>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-green-500">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Historique
            </span>
            <span className="flex items-center gap-1 text-xs text-red-500">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Prédiction
            </span>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <svg className="w-full min-w-[500px]" viewBox={`0 0 ${width + padding * 2} ${height + padding * 2 + 30}`}>
            {/* Grille */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = padding + (i / 4) * height;
              return (
                <line
                  key={`grid-${i}`}
                  x1={padding}
                  y1={y}
                  x2={padding + width}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* ✅ Zone sous la courbe - Historique (sécurisé) */}
            {historicalPoints.length > 1 && (
              <polygon
                points={`
                  ${padding},${padding + height}
                  ${historicalPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  ${padding + width * 0.6},${padding + height}
                `}
                fill="rgba(79, 70, 229, 0.1)"
              />
            )}

            {/* ✅ Courbe historique (sécurisée) */}
            {historicalPoints.length > 1 && (
              <polyline
                points={historicalPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* ✅ Points historiques (sécurisés) */}
            {historicalPoints.map((p, i) => (
              <circle
                key={`hist-${i}`}
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#4f46e5"
              />
            ))}

            {/* Ligne de séparation */}
            <line
              x1={padding + width * 0.6}
              y1={padding}
              x2={padding + width * 0.6}
              y2={padding + height}
              stroke="#e5e7eb"
              strokeWidth="2"
              strokeDasharray="6 4"
            />

            {/* ✅ Zone sous la courbe - Prédiction (sécurisée) */}
            {futurePoints.length > 1 && (
              <polygon
                points={`
                  ${padding + width * 0.6},${padding + height}
                  ${futurePoints.map(p => `${p.x},${p.y}`).join(' ')}
                  ${padding + width},${padding + height}
                `}
                fill="rgba(239, 68, 68, 0.1)"
              />
            )}

            {/* ✅ Courbe prédiction (sécurisée) */}
            {futurePoints.length > 1 && (
              <polyline
                points={futurePoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* ✅ Points de prédiction (sécurisés) */}
            {futurePoints.map((p, i) => (
              <circle
                key={`pred-${i}`}
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#ef4444"
                stroke="white"
                strokeWidth="2"
              />
            ))}

            {/* Labels */}
            {allData.map((_, i) => {
              const x = padding + (i / (allData.length - 1 || 1)) * width;
              const label = i < labels.length ? labels[i] : `M+${i - historicalData.length + 1}`;
              return (
                <text
                  key={`label-${i}`}
                  x={x}
                  y={padding + height + 20}
                  fontSize="9"
                  fill="#6b7280"
                  textAnchor="middle"
                  transform={allData.length > 8 ? `rotate(-30, ${x}, ${padding + height + 20})` : ''}
                >
                  {label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Prédiction stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Tendance</p>
            <p className="text-sm font-semibold flex items-center justify-center gap-1">
              {getTrendIcon(prediction.trend)}
              {prediction.trend === 'positive' ? 'Positive' : 
               prediction.trend === 'negative' ? 'Négative' : 'Stable'}
            </p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Churn prévu</p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {prediction.predicted_churn || 0}
            </p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Confiance</p>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {prediction.confidence || 85}%
            </p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Impact</p>
            <p className="text-sm font-semibold flex items-center justify-center gap-1">
              {prediction.trend === 'positive' ? '📉' : 
               prediction.trend === 'negative' ? '📈' : '➡️'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Actions recommandées
  const renderRecommendations = () => {
    const recommendations = getSmartRecommendations();
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FaLightbulb className="text-yellow-500" />
          Actions recommandées
          <span className="text-sm font-normal text-gray-400">({recommendations.length})</span>
        </h3>
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const Icon = rec.icon;
            const colorClasses = {
              red: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/30',
              orange: 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800/30',
              yellow: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800/30',
              green: 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800/30',
              blue: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800/30'
            };
            return (
              <div
                key={rec.id}
                className={`p-4 rounded-lg border ${colorClasses[rec.color] || 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`text-xl mt-0.5 ${
                    rec.color === 'red' ? 'text-red-500' :
                    rec.color === 'orange' ? 'text-orange-500' :
                    rec.color === 'yellow' ? 'text-yellow-500' :
                    rec.color === 'green' ? 'text-green-500' :
                    'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-800 dark:text-white">{rec.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {rec.priority === 'high' ? '🔴 Priorité haute' :
                         rec.priority === 'medium' ? '🟡 Priorité moyenne' :
                         '🟢 Information'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
                        {rec.action}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                  📊 Analyse prédictive
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Analyse du churn et prévisions avec visualisations avancées
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'cards' ? 'compact' : 'cards')}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <FaSlidersH />
                  {viewMode === 'cards' ? 'Vue compacte' : 'Vue détaillée'}
                </button>
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
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'overview' && (
                    <>
                      {renderKPICards()}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {renderRiskDistribution()}
                        {renderTrendChart()}
                      </div>
                      <div className="mt-6">
                        {renderRecommendations()}
                      </div>
                    </>
                  )}

                  {activeTab === 'risk' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {renderRiskDistribution()}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <FaExclamationTriangle className="text-red-500" />
                          Détails des risques
                        </h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {churnData.stats.critical_count || 0}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Critique</p>
                            </div>
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {churnData.stats.high_risk_count || 0}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Élevé</p>
                            </div>
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {churnData.stats.medium_risk_count || 0}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Moyen</p>
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-semibold">Recommandation :</span>
                              {churnData.stats.critical_count > 0 || churnData.stats.high_risk_count > 0 ? (
                                ' Une action immédiate est requise pour les adhérents à risque critique et élevé.'
                              ) : churnData.stats.medium_risk_count > 0 ? (
                                ' Une surveillance régulière est recommandée pour les adhérents à risque moyen.'
                              ) : (
                                ' Tous les adhérents sont en bonne santé. Continuez ainsi !'
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'prediction' && (
                    <div className="space-y-6">
                      {renderTrendChart()}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                          <div className="text-4xl mb-2">
                            {prediction?.trend === 'positive' ? '📈' : 
                             prediction?.trend === 'negative' ? '📉' : '➡️'}
                          </div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            {prediction?.trend === 'positive' ? 'Tendance positive' : 
                             prediction?.trend === 'negative' ? 'Tendance négative' : 'Tendance stable'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Confiance: {prediction?.confidence || 85}%
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                          <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                            {prediction?.predicted_churn || 0}
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">Churn prévu</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Sur 3 mois</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                          <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                            {prediction?.history?.length || 0}
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">Points de données</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Historique analysé</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'retention' && retentionReport && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <FaUserCheck className="text-green-500" />
                          Statistiques de fidélisation
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                              {retentionReport.total_users || 0}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm text-green-600 dark:text-green-400">Actifs</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {retentionReport.active_users || 0}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">Inactifs</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {retentionReport.inactive_users || 0}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-600 dark:text-blue-400">Durée de vie</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {retentionReport.avg_user_lifetime || 0} jours
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Assiduité</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Moyenne</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  {retentionReport.avg_attendance || 0}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                                <div 
                                  className="h-2 bg-green-500 rounded-full"
                                  style={{ width: `${Math.min(retentionReport.avg_attendance || 0, 100)}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Séances moyennes</span>
                                <span className="font-semibold">
                                  {retentionReport.avg_sessions || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Activité récente</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">7 derniers jours</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {retentionReport.active_last_7_days || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">30 derniers jours</span>
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {retentionReport.active_last_30_days || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Taux de rétention</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {retentionReport.total_users > 0 
                                  ? Math.round((retentionReport.active_last_30_days / retentionReport.total_users) * 100) 
                                  : 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'actions' && (
                    <div className="space-y-6">
                      {renderRecommendations()}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800/30">
                          <div className="flex items-center gap-3 mb-3">
                            <FaRocket className="text-blue-600 dark:text-blue-400 text-2xl" />
                            <h4 className="font-semibold text-gray-800 dark:text-white">Actions rapides</h4>
                          </div>
                          <div className="space-y-2">
                            <button className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm flex items-center gap-2">
                              <FaEnvelope className="text-blue-500" />
                              Envoyer un email à tous les adhérents à risque
                            </button>
                            <button className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm flex items-center gap-2">
                              <FaCalendar className="text-green-500" />
                              Planifier une campagne de réengagement
                            </button>
                            <button className="w-full text-left px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm flex items-center gap-2">
                              <FaUserPlus className="text-purple-500" />
                              Créer un programme de fidélisation
                            </button>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800/30">
                          <div className="flex items-center gap-3 mb-3">
                            <FaShieldAlt className="text-green-600 dark:text-green-400 text-2xl" />
                            <h4 className="font-semibold text-gray-800 dark:text-white">Bonnes pratiques</h4>
                          </div>
                          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li className="flex items-start gap-2">
                              <FaCheckCircle className="text-green-500 mt-0.5" />
                              <span>Suivi hebdomadaire des adhérents à risque</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <FaCheckCircle className="text-green-500 mt-0.5" />
                              <span>Communication personnalisée et régulière</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <FaCheckCircle className="text-green-500 mt-0.5" />
                              <span>Offres de réengagement adaptées aux profils</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <FaCheckCircle className="text-green-500 mt-0.5" />
                              <span>Analyse continue des données de churn</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAnalytics;