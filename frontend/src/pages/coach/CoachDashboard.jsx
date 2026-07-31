import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, FaCalendar, FaChartLine, FaClock, 
  FaExclamationTriangle, FaUserPlus, FaCheckCircle,
  FaSearch, FaPlus, FaFire, FaStar, FaMedal,
  FaBell, FaArrowRight, FaDumbbell, FaRobot,
  FaShieldAlt, FaTimesCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import { coachService } from '../../services/coachService';
import { adminService } from '../../services/adminService';
import { authService } from '../../services/authService';
import { formatDate, formatTime, formatSessionDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const CoachDashboard = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const user = authService.getUser();
  const [stats, setStats] = useState({
    total_adherents: 0,
    total_sessions: 0,
    completed_sessions: 0,
    upcoming_sessions: 0,
    today_sessions: 0,
    avg_duration: 0
  });
  const [atRiskAdherents, setAtRiskAdherents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupStats, setGroupStats] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  const [churnStats, setChurnStats] = useState({
    total: 0,
    critical_count: 0,
    high_risk_count: 0,
    medium_risk_count: 0,
    low_risk_count: 0,
    safe_count: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les stats coach
      const [statsRes, groupStatsRes, sessionsRes] = await Promise.all([
        coachService.getStats(),
        coachService.getGroupStats(),
        coachService.getSessions({ date: new Date().toISOString().split('T')[0] })
      ]);
      
      setStats(statsRes.data.stats || {});
      setGroupStats(groupStatsRes.data.stats || {});
      setTodaySessions(sessionsRes.data.sessions || []);
      
      // ✅ Récupérer les prédictions de churn
      try {
        console.log('🔄 Récupération des données Churn pour le Coach...');
        const churnResponse = await coachService.getChurnAnalysis();
        console.log('📊 Réponse Churn reçue:', churnResponse.success);
        
        if (churnResponse.success) {
          const predictions = churnResponse.data.predictions || [];
          const stats = churnResponse.data.stats || {};
          
          console.log('📈 Stats Churn:', stats);
          console.log('📋 Nombre de prédictions:', predictions.length);
          
          // ✅ Mettre à jour les stats de churn
          setChurnStats({
            total: stats.total || 0,
            critical_count: stats.critical_count || 0,
            high_risk_count: stats.high_risk_count || 0,
            medium_risk_count: stats.medium_risk_count || 0,
            low_risk_count: stats.low_risk_count || 0,
            safe_count: stats.safe_count || 0
          });
          
          // ✅ Filtrer les adhérents à risque
          const atRisk = [];
          predictions.forEach(p => {
            if (p.risk_level === 'Critique' || p.risk_level === 'Élevé' || p.risk_level === 'Moyen') {
              const adherentDetail = churnResponse.data.adherents?.find(a => a.id === p.user_id);
              if (adherentDetail) {
                atRisk.push({
                  ...adherentDetail,
                  risk_level: p.risk_level,
                  risk_score: p.risk_score,
                  factors: p.factors
                });
              }
            }
          });
          
          console.log('⚠️ Adhérents à risque trouvés:', atRisk.length);
          setAtRiskAdherents(atRisk);
        }
      } catch (churnError) {
        console.error('❌ Erreur récupération churn:', churnError);
        // En cas d'erreur, utiliser des données de test
        setChurnStats({
          total: 0,
          critical_count: 0,
          high_risk_count: 0,
          medium_risk_count: 0,
          low_risk_count: 0,
          safe_count: 0
        });
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Statistiques de groupe
  const renderGroupStats = () => {
    if (!groupStats) return null;
    
    const statsData = [
      { 
        label: 'Total adhérents', 
        value: groupStats.total_adherents || 0, 
        color: '#57a1ce', 
        icon: FaUsers 
      },
      { 
        label: 'Assiduité moyenne', 
        value: `${groupStats.avg_attendance || 0}%`, 
        color: '#22c55e', 
        icon: FaChartLine 
      },
      { 
        label: 'Risque critique', 
        value: churnStats.critical_count || 0, 
        color: '#ef4444', 
        icon: FaExclamationTriangle 
      },
      { 
        label: 'Séances moyennes', 
        value: groupStats.avg_sessions || 0, 
        color: '#8b5cf6', 
        icon: FaDumbbell 
      }
    ];
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: `${stat.color}15` }}>
                  <Icon style={{ color: stat.color }} className="text-lg" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  // ✅ Cartes de statistiques principales
  const statCards = [
    { 
      icon: FaUsers, 
      label: 'Adhérents', 
      value: stats.total_adherents || 0,
      color: '#57a1ce',
      bg: 'bg-blue-50',
      path: '/coach/adherents',
      subtitle: 'Total'
    },
    { 
      icon: FaCalendar, 
      label: 'Séances aujourd\'hui', 
      value: stats.today_sessions || 0,
      color: '#22c55e',
      bg: 'bg-green-50',
      path: '/coach/sessions',
      subtitle: new Date().toLocaleDateString('fr-FR')
    },
    { 
      icon: FaCheckCircle, 
      label: 'Séances complétées', 
      value: stats.completed_sessions || 0,
      color: '#8b5cf6',
      bg: 'bg-purple-50',
      path: '/coach/sessions?status=completed',
      subtitle: 'Total'
    },
    { 
      icon: FaClock, 
      label: 'Séances à venir', 
      value: stats.upcoming_sessions || 0,
      color: '#f59e0b',
      bg: 'bg-yellow-50',
      path: '/coach/sessions?status=reserved',
      subtitle: 'À planifier'
    }
  ];

  // ✅ Séances du jour
  const renderTodaySessions = () => {
    if (todaySessions.length === 0) {
      return (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">Aucune séance aujourd'hui</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {todaySessions.slice(0, 5).map((session) => (
          <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#57a1ce]/10 flex items-center justify-center text-[#57a1ce] text-sm">
                <FaDumbbell />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {session.type || 'Séance'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTime(session.time)} · {session.adherent_first_name || 'Sans adhérent'}
                </p>
              </div>
            </div>
            <span className={`badge ${
              session.status === 'completed' ? 'badge-success' :
              session.status === 'confirmed' ? 'badge-primary' :
              'badge-warning'
            }`}>
              {session.status}
            </span>
          </div>
        ))}
        {todaySessions.length > 5 && (
          <button 
            onClick={() => navigate('/coach/sessions')}
            className="text-sm text-[#57a1ce] hover:underline w-full text-center mt-2"
          >
            Voir toutes les séances →
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <CoachNavbar />
      <div className="flex">
        <CoachSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-3xl font-display font-bold text-theme-primary">
                  👋 Bonjour, {user?.first_name}
                </h1>
                <p className="text-theme-secondary mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </motion.div>
              
              <div className="mt-4 md:mt-0 flex items-center gap-3">
                <button
                  onClick={() => navigate('/coach/adherents?filter=at-risk')}
                  className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition flex items-center gap-2 text-sm font-medium"
                >
                  <FaExclamationTriangle className="text-sm" />
                  {atRiskAdherents.length} alertes
                </button>
                <button
                  onClick={() => navigate('/coach/sessions/create')}
                  className="btn-logo text-sm flex items-center gap-2"
                >
                  <FaPlus /> Créer une séance
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {/* Statistiques Churn */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                  <div className="bg-theme-card rounded-xl p-3 text-center border border-theme shadow-sm hover:shadow-md transition">
                    <p className="text-xs text-theme-secondary">Total</p>
                    <p className="text-xl font-bold text-theme-primary">{churnStats.total || 0}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center border border-red-200 dark:border-red-800 shadow-sm">
                    <p className="text-xs text-red-600 dark:text-red-400">🔴 Critique</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{churnStats.critical_count || 0}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center border border-orange-200 dark:border-orange-800 shadow-sm">
                    <p className="text-xs text-orange-600 dark:text-orange-400">🟠 Élevé</p>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{churnStats.high_risk_count || 0}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-center border border-yellow-200 dark:border-yellow-800 shadow-sm">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">🟡 Moyen</p>
                    <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{churnStats.medium_risk_count || 0}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center border border-green-200 dark:border-green-800 shadow-sm">
                    <p className="text-xs text-green-600 dark:text-green-400">🟢 Faible</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{churnStats.low_risk_count || 0}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center border border-blue-200 dark:border-blue-800 shadow-sm">
                    <p className="text-xs text-blue-600 dark:text-blue-400">🔵 Safe</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{churnStats.safe_count || 0}</p>
                  </div>
                </div>

                {/* Statistiques de groupe */}
                {renderGroupStats()}

                {/* Statistiques principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="bg-theme-card rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-theme"
                        onClick={() => stat.path && navigate(stat.path)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-theme-secondary">{stat.label}</p>
                            <p className="text-2xl font-bold text-theme-primary mt-1">{stat.value}</p>
                            <p className="text-xs text-theme-muted mt-0.5">{stat.subtitle}</p>
                          </div>
                          <div className={`p-2.5 rounded-xl ${stat.bg} dark:bg-opacity-20`}>
                            <Icon style={{ color: stat.color }} className="text-xl" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Adhérents à risque */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2 bg-theme-card rounded-xl p-6 shadow-sm border border-theme"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                        <FaExclamationTriangle className="text-red-500" />
                        Adhérents à risque
                        <span className="text-xs font-normal bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1 ml-2">
                          <FaRobot className="text-xs" /> IA
                        </span>
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="badge-danger">
                          {atRiskAdherents.length} à surveiller
                        </span>
                        {atRiskAdherents.length > 0 && (
                          <button 
                            onClick={() => navigate('/coach/adherents?filter=at-risk')}
                            className="text-xs text-[#57a1ce] hover:underline flex items-center gap-1"
                          >
                            Voir tout <FaArrowRight className="text-xs" />
                          </button>
                        )}
                      </div>
                    </div>

                    {atRiskAdherents.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {atRiskAdherents.slice(0, 5).map((adherent) => {
                          const attendanceRate = adherent.total_sessions > 0 
                            ? Math.round((adherent.completed_sessions / adherent.total_sessions) * 100) 
                            : 0;
                          
                          return (
                            <div 
                              key={adherent.id}
                              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all group ${
                                adherent.risk_level === 'Critique' 
                                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                                  : adherent.risk_level === 'Élevé'
                                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                              }`}
                              onClick={() => navigate(`/coach/adherents/${adherent.id}`)}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">
                                  {adherent.first_name?.[0]}{adherent.last_name?.[0]}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 group-hover:text-red-600 transition">
                                    {adherent.first_name} {adherent.last_name}
                                  </p>
                                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <FaClock className="text-gray-400" />
                                      Dernière: {formatSessionDate(adherent.last_session_date)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <FaFire className="text-orange-400" />
                                      {attendanceRate}% assiduité
                                    </span>
                                    <span className="flex items-center gap-1 text-purple-500">
                                      <FaRobot className="text-[10px]" />
                                      {Math.round(adherent.risk_score || 0)}% risque
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`badge ${
                                  adherent.risk_level === 'Critique' ? 'badge-danger' :
                                  adherent.risk_level === 'Élevé' ? 'badge-warning' :
                                  'badge-info'
                                }`}>
                                  {adherent.risk_level}
                                </span>
                                <div className="text-right">
                                  <span className="text-sm font-bold" style={{
                                    color: adherent.risk_level === 'Critique' ? '#dc2626' :
                                           adherent.risk_level === 'Élevé' ? '#ea580c' :
                                           '#ca8a04'
                                  }}>
                                    {Math.round(adherent.risk_score || 0)}%
                                  </span>
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
                                    <div 
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${Math.min(adherent.risk_score || 0, 100)}%`,
                                        backgroundColor: adherent.risk_level === 'Critique' ? '#dc2626' :
                                                      adherent.risk_level === 'Élevé' ? '#ea580c' :
                                                      '#ca8a04'
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                          <FaCheckCircle className="text-3xl text-green-500" />
                        </div>
                        <p className="text-theme-secondary font-medium">✅ Aucun adhérent à risque</p>
                        <p className="text-sm text-theme-muted mt-1">Tous vos adhérents sont réguliers</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Séances du jour */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FaCalendar className="text-[#57a1ce]" />
                        Séances du jour
                      </h3>
                      {todaySessions.length > 0 && (
                        <span className="badge-primary text-xs">
                          {todaySessions.length}
                        </span>
                      )}
                    </div>
                    {renderTodaySessions()}
                    
                    {todaySessions.length === 0 && (
                      <button 
                        onClick={() => navigate('/coach/sessions/create')}
                        className="w-full mt-4 btn-logo text-sm flex items-center justify-center gap-2"
                      >
                        <FaPlus /> Planifier une séance
                      </button>
                    )}
                  </motion.div>
                </div>

                {/* Actions rapides */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  <div 
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer text-center group"
                    onClick={() => navigate('/coach/adherents')}
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition">
                      <FaUsers className="text-2xl" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-2">Voir adhérents</p>
                  </div>
                  <div 
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer text-center group"
                    onClick={() => navigate('/coach/performances')}
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-green-50 flex items-center justify-center text-green-500 group-hover:scale-110 transition">
                      <FaChartLine className="text-2xl" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-2">Performances</p>
                  </div>
                  <div 
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer text-center group"
                    onClick={() => navigate('/coach/sessions')}
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 group-hover:scale-110 transition">
                      <FaCalendar className="text-2xl" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-2">Gérer séances</p>
                  </div>
                  <div 
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer text-center group"
                    onClick={() => navigate('/coach/adherents?filter=at-risk')}
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-red-50 flex items-center justify-center text-red-500 group-hover:scale-110 transition">
                      <FaExclamationTriangle className="text-2xl" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-2">Alertes IA</p>
                    {atRiskAdherents.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {atRiskAdherents.length}
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* Section ML Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center gap-3">
                    <FaRobot className="text-purple-600 dark:text-purple-400 text-xl" />
                    <div>
                      <h4 className="font-medium text-purple-800 dark:text-purple-300">Modèle de Machine Learning</h4>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        Le modèle analyse 13 caractéristiques pour prédire le risque de désabonnement
                      </p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoachDashboard;