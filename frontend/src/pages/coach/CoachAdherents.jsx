import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaUser, FaTrophy, FaChartLine,
  FaCalendar, FaEye, FaFilter, FaDumbbell,
  FaExclamationTriangle, FaArrowLeft, FaCheckCircle,
  FaUsers, FaShieldAlt, FaClock, FaStar,
  FaFire, FaCalendarAlt, FaRobot
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import { coachService } from '../../services/coachService';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const CoachAdherents = () => {
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [adherents, setAdherents] = useState([]);
  const [filteredAdherents, setFilteredAdherents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [churnData, setChurnData] = useState({});
  const [churnStats, setChurnStats] = useState({
    total: 0,
    critical_count: 0,
    high_risk_count: 0,
    medium_risk_count: 0,
    low_risk_count: 0,
    safe_count: 0
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    if (filterParam === 'at-risk') {
      setActiveTab('at-risk');
    }
  }, [location.search]);

  useEffect(() => {
    fetchAdherents();
  }, []);

  const fetchAdherents = async () => {
    try {
      setLoading(true);
      
      const response = await coachService.getAdherents();
      const data = response.data.adherents || [];
      setAdherents(data);
      
      try {
        const churnResponse = await coachService.getChurnAnalysis();
        
        if (churnResponse.success) {
          const predictions = churnResponse.data.predictions || [];
          const stats = churnResponse.data.stats || {};
          
          setChurnStats({
            total: stats.total || 0,
            critical_count: stats.critical_count || 0,
            high_risk_count: stats.high_risk_count || 0,
            medium_risk_count: stats.medium_risk_count || 0,
            low_risk_count: stats.low_risk_count || 0,
            safe_count: stats.safe_count || 0
          });
          
          const churnMap = {};
          predictions.forEach(p => {
            churnMap[p.user_id] = {
              risk_score: p.risk_score || 0,
              risk_level: p.risk_level || 'Safe',
              factors: p.factors || {}
            };
          });
          setChurnData(churnMap);
        }
      } catch (churnError) {
        console.error('❌ Erreur récupération churn:', churnError);
      }
      
      applyFilters(searchTerm, activeTab, data);
      
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
    applyFilters(term, activeTab);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'at-risk') {
      navigate('/coach/adherents?filter=at-risk');
    } else {
      navigate('/coach/adherents');
    }
    applyFilters(searchTerm, tab);
  };

  const getRiskLevel = (adherent) => {
    const churn = churnData[adherent.id];
    if (churn && churn.risk_level) {
      return {
        level: churn.risk_level,
        color: getRiskColorClass(churn.risk_level),
        score: churn.risk_score || 0
      };
    }
    return { level: 'Safe', color: 'badge-success', icon: '🟢', score: 0 };
  };

  const getRiskColorClass = (level) => {
    const colors = {
      'Critique': 'badge-danger',
      'Élevé': 'badge-warning',
      'Moyen': 'badge-info',
      'Faible': 'badge-success',
      'Safe': 'badge-success'
    };
    return colors[level] || 'badge-info';
  };

  const isAtRisk = (adherent) => {
    const churn = churnData[adherent.id];
    if (churn) {
      return churn.risk_level === 'Critique' || churn.risk_level === 'Élevé' || churn.risk_level === 'Moyen';
    }
    return false;
  };

  const getAlertMessage = (adherent) => {
    const churn = churnData[adherent.id];
    if (churn && churn.factors) {
      const factors = Object.values(churn.factors);
      if (factors.length > 0) {
        return factors[0];
      }
    }
    return '⚠️ À surveiller';
  };

  const applyFilters = (term, tab, data = adherents) => {
    const sourceData = data.length > 0 ? data : adherents;
    
    let filtered = sourceData.filter(a => 
      (a.first_name?.toLowerCase() || '').includes(term) ||
      (a.last_name?.toLowerCase() || '').includes(term) ||
      (a.email?.toLowerCase() || '').includes(term)
    );

    if (tab === 'active') {
      filtered = filtered.filter(a => 
        a.completed_sessions > 0 || a.total_sessions >= 3
      );
    } else if (tab === 'inactive') {
      filtered = filtered.filter(a => 
        a.total_sessions === 0 || 
        (a.total_sessions < 3 && a.completed_sessions === 0)
      );
    } else if (tab === 'at-risk') {
      filtered = filtered.filter(a => isAtRisk(a));
    }

    setFilteredAdherents(filtered);
  };

  const getAttendanceRate = (completed, total) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getStatusBadge = (adherent) => {
    const rate = getAttendanceRate(adherent.completed_sessions, adherent.total_sessions);
    if (adherent.total_sessions === 0) {
      return { label: 'Nouveau', color: 'badge-info' };
    }
    if (rate >= 70) {
      return { label: 'Régulier', color: 'badge-success' };
    }
    if (rate >= 40) {
      return { label: 'Occasionnel', color: 'badge-warning' };
    }
    return { label: 'À risque', color: 'badge-danger' };
  };

  const getTabCounts = () => {
    const all = adherents.length;
    const active = adherents.filter(a => 
      a.completed_sessions > 0 || a.total_sessions >= 3
    ).length;
    const inactive = adherents.filter(a => 
      a.total_sessions === 0 || 
      (a.total_sessions < 3 && a.completed_sessions === 0)
    ).length;
    const atRisk = adherents.filter(a => isAtRisk(a)).length;
    return { all, active, inactive, atRisk };
  };

  const counts = getTabCounts();

  const tabs = [
    { id: 'all', label: 'Tous', icon: FaUsers, count: counts.all },
    { id: 'active', label: 'Actifs', icon: FaFire, count: counts.active },
    { id: 'inactive', label: 'Inactifs', icon: FaClock, count: counts.inactive },
    { id: 'at-risk', label: 'À risque', icon: FaExclamationTriangle, count: counts.atRisk }
  ];

  // ✅ Styles pour les onglets
  const getTabStyles = (tab, isActive) => {
    if (isActive) {
      return 'bg-[#57a1ce] text-white shadow-lg shadow-[#57a1ce]/25';
    }

    if (tab.id === 'all') {
      return 'bg-theme-card text-theme-primary hover:bg-theme-hover hover:text-[#57a1ce] border border-theme';
    }
    
    if (tab.id === 'at-risk') {
      return 'bg-theme-card text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800/50 border border-theme';
    }

    if (tab.id === 'active') {
      return 'bg-theme-card text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800/50 border border-theme';
    }

    if (tab.id === 'inactive') {
      return 'bg-theme-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/20 hover:border-gray-200 dark:hover:border-gray-700 border border-theme';
    }

    return 'bg-theme-card text-theme-secondary hover:bg-theme-hover hover:text-[#57a1ce] border border-theme';
  };

  // ✅ Déterminer si la carte doit avoir une bordure rouge
  const shouldShowRedBorder = (adherent) => {
    // Uniquement si l'onglet actif est "À risque" ET que l'adhérent est à risque
    if (activeTab !== 'at-risk') return false;
    return isAtRisk(adherent);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <CoachNavbar />
      <div className="flex">
        <CoachSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-display font-bold text-theme-primary flex items-center gap-3">
                <FaUsers className="text-[#57a1ce]" />
                Gestion des adhérents
                <span className="text-sm font-normal bg-[#57a1ce]/10 dark:bg-[#57a1ce]/20 text-[#57a1ce] px-3 py-1 rounded-full">
                  {filteredAdherents.length} adhérents
                </span>
                <span className="text-xs font-normal bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <FaRobot className="text-xs" /> IA Churn
                </span>
              </h1>
              <p className="text-theme-secondary mt-1">Gérez et suivez vos adhérents assignés</p>
            </div>

            {/* Statistiques Churn */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
              <div className="bg-theme-card rounded-lg p-2 text-center border border-theme">
                <p className="text-xs text-theme-secondary">Total</p>
                <p className="text-lg font-bold text-theme-primary">{churnStats.total || 0}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center border border-red-200 dark:border-red-800/30">
                <p className="text-xs text-red-600 dark:text-red-400">🔴 Critique</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{churnStats.critical_count || 0}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-center border border-orange-200 dark:border-orange-800/30">
                <p className="text-xs text-orange-600 dark:text-orange-400">🟠 Élevé</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{churnStats.high_risk_count || 0}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center border border-yellow-200 dark:border-yellow-800/30">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">🟡 Moyen</p>
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{churnStats.medium_risk_count || 0}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center border border-green-200 dark:border-green-800/30">
                <p className="text-xs text-green-600 dark:text-green-400">🟢 Faible</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{churnStats.low_risk_count || 0}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center border border-blue-200 dark:border-blue-800/30">
                <p className="text-xs text-blue-600 dark:text-blue-400">🔵 Safe</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{churnStats.safe_count || 0}</p>
              </div>
            </div>

            <div className="relative mb-6">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou email..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-theme focus:border-[#57a1ce] focus:ring-2 focus:ring-[#57a1ce]/20 transition-all bg-theme-card text-theme-primary shadow-sm"
              />
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap
                      ${getTabStyles(tab, isActive)}
                      ${!isActive && tab.id === 'at-risk' && tab.count > 0 ? 'border-2 border-red-300 dark:border-red-700' : ''}
                    `}
                  >
                    <Icon className={`text-sm ${isActive ? 'text-white' : ''}`} />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : tab.id === 'at-risk' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-theme-secondary text-theme-secondary'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    {!isActive && tab.id === 'at-risk' && tab.count > 0 && (
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
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
                  {filteredAdherents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredAdherents.map((adherent, index) => {
                        const attendanceRate = getAttendanceRate(
                          adherent.completed_sessions,
                          adherent.total_sessions
                        );
                        const risk = getRiskLevel(adherent);
                        const status = getStatusBadge(adherent);
                        const isAtRiskAdherent = isAtRisk(adherent);
                        const alertMessage = getAlertMessage(adherent);
                        
                        // ✅ Bordure rouge UNIQUEMENT pour l'onglet "À risque"
                        const showRedBorder = shouldShowRedBorder(adherent);
                        
                        return (
                          <motion.div
                            key={adherent.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-theme-card rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group border ${
                              showRedBorder 
                                ? 'border-2 border-red-500 dark:border-red-400 bg-red-50/30 dark:bg-red-900/10' 
                                : 'border-theme'
                            }`}
                            onClick={() => navigate(`/coach/adherents/${adherent.id}`)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                                  showRedBorder ? 'bg-red-500' : 'bg-[#57a1ce]'
                                } group-hover:scale-110 transition-transform`}>
                                  {adherent.first_name?.[0]}{adherent.last_name?.[0]}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-theme-primary group-hover:text-[#57a1ce] transition">
                                    {adherent.first_name} {adherent.last_name}
                                  </h3>
                                  <p className="text-sm text-theme-secondary">{adherent.email}</p>
                                  <p className="text-xs text-theme-muted">ID: #{adherent.id}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`badge ${risk.color} text-xs flex items-center gap-1`}>
                                  <span className="text-[12px] opacity-70">{risk.level}</span>
                                  {risk.score > 0 && (
                                    <span className="text-[11px] opacity-70">({Math.round(risk.score)}%)</span>
                                  )}
                                </span>
                                <span className={`badge ${status.color} text-[10px]`}>
                                   <span className="text-[10px] opacity-70">{status.label}</span>
                                </span>
                                {churnData[adherent.id] && (
                                  <span className="text-[10px] text-purple-500 dark:text-purple-400 flex items-center gap-0.5">
                                    <FaRobot className="text-[10px]" /> IA
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-theme">
                              <div className="text-center">
                                <p className="text-lg font-bold text-[#57a1ce]">
                                  {adherent.total_sessions || 0}
                                </p>
                                <p className="text-xs text-theme-secondary">Séances</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-green-500">
                                  {attendanceRate}%
                                </p>
                                <p className="text-xs text-theme-secondary">Assiduité</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-yellow-500">
                                  {adherent.total_points || 0}
                                </p>
                                <p className="text-xs text-theme-secondary">Points</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-theme">
                              <span className="text-xs text-theme-secondary flex items-center gap-1">
                                🎯 {adherent.goal || 'Objectif non défini'}
                              </span>
                              <span className="text-xs text-theme-secondary flex items-center gap-1">
                                📊 {adherent.level || 'Niveau non défini'}
                              </span>
                            </div>

                            {showRedBorder && (
                              <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
                                <div className="flex items-center gap-2">
                                  <FaExclamationTriangle className="text-red-500 text-sm" />
                                  <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                                    {alertMessage}
                                  </p>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-theme-card rounded-xl shadow-sm border border-theme">
                      {activeTab === 'at-risk' ? (
                        <>
                          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-theme-primary mb-2">
                            ✅ Aucun adhérent à risque !
                          </h3>
                          <p className="text-theme-secondary">
                            Tous vos adhérents sont réguliers et motivés
                          </p>
                        </>
                      ) : activeTab === 'active' ? (
                        <>
                          <FaFire className="text-6xl text-orange-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-theme-primary mb-2">
                            🔥 Aucun adhérent actif
                          </h3>
                          <p className="text-theme-secondary">
                            Aucun adhérent n'a de séances complétées ou plus de 3 séances
                          </p>
                        </>
                      ) : activeTab === 'inactive' ? (
                        <>
                          <FaClock className="text-6xl text-theme-muted mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-theme-primary mb-2">
                            ⏰ Aucun adhérent inactif
                          </h3>
                          <p className="text-theme-secondary">
                            Tous vos adhérents ont au moins une séance
                          </p>
                        </>
                      ) : (
                        <>
                          <FaUser className="text-6xl text-theme-muted mx-auto mb-4" />
                          <p className="text-theme-secondary">Aucun adhérent trouvé</p>
                          <p className="text-sm text-theme-muted mt-1">
                            {searchTerm ? 'Essayez une autre recherche' : 'Aucun adhérent dans cette catégorie'}
                          </p>
                        </>
                      )}
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

export default CoachAdherents;