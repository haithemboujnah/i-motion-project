import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartLine, FaExclamationTriangle, FaCalendar, FaCheckCircle,
  FaUsers, FaUserCheck, FaUserTimes, FaClock, FaEnvelope,
  FaFilePdf, FaDownload, FaEye, FaBrain,
  FaChartPie, FaChartBar, FaArrowUp, FaArrowDown,
  FaShieldAlt, FaTimesCircle
} from 'react-icons/fa';
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
  const [activeTab, setActiveTab] = useState('risk');

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
      
      // ✅ Utiliser les vraies données de churn
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
    { id: 'risk', label: 'Analyse des risques', icon: FaExclamationTriangle },
    { id: 'prediction', label: 'Prédiction', icon: FaBrain },
    { id: 'retention', label: 'Fidélisation', icon: FaUserCheck }
  ];

  // ✅ Graphique circulaire des risques (avec données réelles)
  const renderRiskPieChart = () => {
    const stats = churnData.stats;
    const total = stats.total || 1;
    
    const data = [
      { label: 'Critique', value: stats.critical_count || 0, color: '#ef4444', icon: '🔴' },
      { label: 'Élevé', value: stats.high_risk_count || 0, color: '#f97316', icon: '🟠' },
      { label: 'Moyen', value: stats.medium_risk_count || 0, color: '#eab308', icon: '🟡' },
      { label: 'Faible', value: stats.low_risk_count || 0, color: '#22c55e', icon: '🟢' },
      { label: 'Safe', value: stats.safe_count || 0, color: '#3b82f6', icon: '🔵' }
    ];

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let currentAngle = 0;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = (percentage / 100) * circumference;
              const strokeDashoffset = circumference - strokeDasharray;
              currentAngle += strokeDasharray;
              
              return (
                <circle
                  key={index}
                  cx="96"
                  cy="96"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000"
                  style={{ strokeDashoffset: strokeDashoffset }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">Total adhérents</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-600">{item.icon} {item.label}</span>
              <span className="text-xs font-semibold">{Math.round((item.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ✅ Graphique sinusoïdal des risques (avec données réelles)
  const renderRiskSinusoidalChart = () => {
    const stats = churnData.stats;
    
    const points = [
      { label: 'Critique', value: stats.critical_count || 0, color: '#ef4444' },
      { label: 'Élevé', value: stats.high_risk_count || 0, color: '#f97316' },
      { label: 'Moyen', value: stats.medium_risk_count || 0, color: '#eab308' },
      { label: 'Faible', value: stats.low_risk_count || 0, color: '#22c55e' },
      { label: 'Safe', value: stats.safe_count || 0, color: '#3b82f6' }
    ];

    const maxValue = Math.max(...points.map(p => p.value), 1);
    const width = 500;
    const height = 150;
    const padding = 20;

    return (
      <div className="w-full">
        <svg className="w-full" viewBox={`0 0 ${width + padding * 2} ${height + padding * 2}`}>
          {/* Grille */}
          {[0, 1, 2, 3].map((i) => {
            const y = padding + (i / 3) * height;
            return (
              <line
                key={i}
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

          {/* Courbe sinusoïdale */}
          <path
            d={`
              M ${padding},${padding + height - (points[0].value / maxValue) * height * 0.8}
              ${points.map((p, i) => {
                const x = padding + (i / (points.length - 1)) * width;
                const y = padding + height - (p.value / maxValue) * height * 0.8;
                const prevX = i > 0 ? padding + ((i - 1) / (points.length - 1)) * width : x;
                const prevY = i > 0 ? padding + height - (points[i - 1].value / maxValue) * height * 0.8 : y;
                const cpX = (prevX + x) / 2;
                return `Q ${cpX},${prevY} ${x},${y}`;
              }).join(' ')}
            `}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3"
          />

          {/* Points */}
          {points.map((p, i) => {
            const x = padding + (i / (points.length - 1)) * width;
            const y = padding + height - (p.value / maxValue) * height * 0.8;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="6" fill="white" stroke={p.color} strokeWidth="2.5" />
                <circle cx={x} cy={y} r="3" fill={p.color} />
                <text x={x} y={padding + height + 20} fontSize="10" fill="#6b7280" textAnchor="middle">
                  {p.label}
                </text>
                <text x={x} y={y - 10} fontSize="10" fill={p.color} textAnchor="middle" fontWeight="bold">
                  {p.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // ✅ Graphique de tendance (prédiction)
  const renderPredictionChart = () => {
    if (!prediction) return null;
    
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    const historicalData = [5, 8, 6, 12, 9, 7];
    const futureData = [7, 9, 12, 15];
    
    const maxValue = Math.max(...historicalData, ...futureData, 1);
    const width = 600;
    const height = 150;
    const padding = 20;

    return (
      <div className="w-full">
        <svg className="w-full" viewBox={`0 0 ${width + padding * 2} ${height + padding * 2 + 30}`}>
          {/* Grille */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding + (i / 4) * height;
            return (
              <line
                key={i}
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

          {/* Zone sous la courbe (historique) */}
          <polygon
            points={`
              ${padding},${padding + height}
              ${historicalData.map((value, i) => {
                const x = padding + (i / (historicalData.length - 1)) * width * 0.6;
                const y = padding + height - (value / maxValue) * height * 0.8;
                return `${x},${y}`;
              }).join(' ')}
              ${padding + width * 0.6},${padding + height}
            `}
            fill="rgba(79, 70, 229, 0.15)"
          />

          {/* Courbe historique */}
          <polyline
            points={historicalData.map((value, i) => {
              const x = padding + (i / (historicalData.length - 1)) * width * 0.6;
              const y = padding + height - (value / maxValue) * height * 0.8;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points historiques */}
          {historicalData.map((value, i) => {
            const x = padding + (i / (historicalData.length - 1)) * width * 0.6;
            const y = padding + height - (value / maxValue) * height * 0.8;
            return (
              <circle key={i} cx={x} cy={y} r="5" fill="#4f46e5" />
            );
          })}

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

          {/* Prédiction (future) */}
          <polyline
            points={futureData.map((value, i) => {
              const x = padding + width * 0.6 + (i / (futureData.length - 1)) * width * 0.4;
              const y = padding + height - (value / maxValue) * height * 0.8;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points de prédiction */}
          {futureData.map((value, i) => {
            const x = padding + width * 0.6 + (i / (futureData.length - 1)) * width * 0.4;
            const y = padding + height - (value / maxValue) * height * 0.8;
            return (
              <circle key={i} cx={x} cy={y} r="5" fill="#ef4444" stroke="white" strokeWidth="2" />
            );
          })}

          {/* Labels */}
          {[...historicalData, ...futureData].map((value, i) => {
            const isHistorical = i < historicalData.length;
            const x = padding + (i / (historicalData.length + futureData.length - 1)) * width;
            const label = isHistorical ? months[i] : `M+${i - historicalData.length + 1}`;
            return (
              <text
                key={i}
                x={x}
                y={padding + height + 20}
                fontSize="9"
                fill="#6b7280"
                textAnchor="middle"
              >
                {label}
              </text>
            );
          })}

          {/* Légende */}
          <text x={padding} y={padding + height + 40} fontSize="10" fill="#4f46e5">
            ● Historique
          </text>
          <text x={padding + 120} y={padding + height + 40} fontSize="10" fill="#ef4444">
            ● Prédiction
          </text>
        </svg>
      </div>
    );
  };

  // ✅ Graphique de fidélisation (barres)
  const renderRetentionChart = () => {
    if (!retentionReport) return null;
    
    const data = [
      { label: 'Actifs', value: retentionReport.active_users || 0, color: '#22c55e' },
      { label: 'Inactifs', value: retentionReport.inactive_users || 0, color: '#ef4444' },
      { label: '7 jours', value: retentionReport.active_last_7_days || 0, color: '#3b82f6' },
      { label: '30 jours', value: retentionReport.active_last_30_days || 0, color: '#8b5cf6' }
    ];

    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
      <div className="w-full">
        <div className="flex items-end justify-around h-48 gap-2">
          {data.map((item, index) => {
            const height = (item.value / maxValue) * 100;
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="text-xs font-semibold text-gray-700 mb-1">{item.value}</div>
                <div 
                  className="w-full rounded-t-lg transition-all duration-1000"
                  style={{
                    height: `${Math.max(height, 5)}%`,
                    backgroundColor: item.color,
                    minHeight: '8px'
                  }}
                />
                <div className="text-xs text-gray-500 mt-2 text-center">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
                <h1 className="text-3xl font-display font-bold text-gray-900">
                  📊 Analyse prédictive
                </h1>
                <p className="text-gray-500 mt-1">
                  Analyse du churn et prévisions avec visualisations avancées
                </p>
              </div>
              <button 
                onClick={() => window.open('/admin/churn', '_blank')}
                className="btn-logo text-sm flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <FaBrain /> Voir Churn
              </button>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="text-sm" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'risk' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Graphique circulaire */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaChartPie className="text-indigo-500" />
                        Distribution des risques
                      </h3>
                      {renderRiskPieChart()}
                    </div>

                    {/* Graphique sinusoïdal */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaChartLine className="text-indigo-500" />
                        Évolution des risques
                      </h3>
                      {renderRiskSinusoidalChart()}
                    </div>

                    {/* Indicateurs clés */}
                    <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Indicateurs clés
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-gray-500">Total adhérents</p>
                          <p className="text-2xl font-bold text-blue-600">{churnData.stats.total || 0}</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-sm text-gray-500">Critique</p>
                          <p className="text-2xl font-bold text-red-600">{churnData.stats.critical_count || 0}</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                          <p className="text-sm text-gray-500">Élevé</p>
                          <p className="text-2xl font-bold text-orange-600">{churnData.stats.high_risk_count || 0}</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                          <p className="text-sm text-gray-500">Safe</p>
                          <p className="text-2xl font-bold text-green-600">{churnData.stats.safe_count || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'prediction' && prediction && (
                  <div className="grid grid-cols-1 gap-6">
                    {/* Graphique de tendance */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaChartLine className="text-indigo-500" />
                        🔮 Prédiction sur 3 mois
                      </h3>
                      {renderPredictionChart()}
                      <div className="flex flex-wrap gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {prediction.trend === 'positive' ? '📈' : 
                             prediction.trend === 'negative' ? '📉' : '➡️'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {prediction.trend === 'positive' ? 'Tendance positive ✅' : 
                               prediction.trend === 'negative' ? 'Tendance négative ⚠️' : 'Tendance stable ➡️'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Confiance: {prediction.confidence || 85}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-sm text-gray-500">Churn prévu:</span>
                          <span className="text-xl font-bold text-red-600">{prediction.predicted_churn || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recommandations */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        📋 Recommandations
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <FaCheckCircle className="text-green-500" />
                            <p className="text-sm font-medium text-gray-800">Programme de fidélisation</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            Mettre en place des offres personnalisées pour les adhérents à risque
                          </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <FaChartLine className="text-blue-500" />
                            <p className="text-sm font-medium text-gray-800">Suivi renforcé</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            Augmenter la fréquence des contacts avec les adhérents inactifs
                          </p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <FaEnvelope className="text-purple-500" />
                            <p className="text-sm font-medium text-gray-800">Campagne de réengagement</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            Lancer une campagne email pour les adhérents sans séance depuis 30 jours
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'retention' && retentionReport && (
                  <div className="grid grid-cols-1 gap-6">
                    {/* Graphique de fidélisation */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaChartBar className="text-indigo-500" />
                        📊 Rapport de fidélisation
                      </h3>
                      {renderRetentionChart()}
                    </div>

                    {/* Statistiques détaillées */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Vue d'ensemble</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Total utilisateurs</span>
                            <span className="font-semibold">{retentionReport.total_users || 0}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Actifs</span>
                            <span className="font-semibold text-green-600">{retentionReport.active_users || 0}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Inactifs</span>
                            <span className="font-semibold text-red-600">{retentionReport.inactive_users || 0}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Durée de vie moyenne</span>
                            <span className="font-semibold text-purple-600">{retentionReport.avg_user_lifetime || 0} jours</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Performances</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Séances moyennes</span>
                            <span className="font-semibold">{retentionReport.avg_sessions || 0}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Assiduité moyenne</span>
                            <span className="font-semibold text-green-600">{retentionReport.avg_attendance || 0}%</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Actifs 7 jours</span>
                            <span className="font-semibold text-blue-600">{retentionReport.active_last_7_days || 0}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Actifs 30 jours</span>
                            <span className="font-semibold text-indigo-600">{retentionReport.active_last_30_days || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
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

export default AdminAnalytics;