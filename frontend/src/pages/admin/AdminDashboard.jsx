import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, FaUserPlus, FaCalendar, FaDumbbell,
  FaTrophy, FaChartLine, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaFileExport, FaBrain
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const user = authService.getUser();
  const [stats, setStats] = useState({
    total_users: 0,
    total_adherents: 0,
    total_coaches: 0,
    active_users: 0,
    total_sessions: 0,
    completed_sessions: 0,
    total_points: 0,
    total_badges: 0,
    active_challenges: 0
  });
  const [churnStats, setChurnStats] = useState({
    total: 0,
    critical_count: 0,
    high_risk_count: 0,
    medium_risk_count: 0,
    low_risk_count: 0,
    safe_count: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, churnRes, activitiesRes] = await Promise.all([
        adminService.getGlobalStats(),
        adminService.getChurnAnalysis(),
        adminService.getRecentActivities(10)
      ]);
      
      setStats(statsRes.data.stats || {});
      
      // ✅ Extraire les stats de churn
      if (churnRes.success) {
        setChurnStats({
          total: churnRes.data.stats?.total || 0,
          critical_count: churnRes.data.stats?.critical_count || 0,
          high_risk_count: churnRes.data.stats?.high_risk_count || 0,
          medium_risk_count: churnRes.data.stats?.medium_risk_count || 0,
          low_risk_count: churnRes.data.stats?.low_risk_count || 0,
          safe_count: churnRes.data.stats?.safe_count || 0
        });
      }
      
      setRecentActivities(activitiesRes.data.activities || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      icon: FaUsers, 
      label: 'Total Utilisateurs', 
      value: stats.total_users || 0,
      color: '#4f46e5',
      bg: 'bg-indigo-50'
    },
    { 
      icon: FaUserPlus, 
      label: 'Adhérents', 
      value: stats.total_adherents || 0,
      color: '#22c55e',
      bg: 'bg-green-50'
    },
    { 
      icon: FaCalendar, 
      label: 'Séances', 
      value: stats.total_sessions || 0,
      color: '#8b5cf6',
      bg: 'bg-purple-50'
    },
    { 
      icon: FaTrophy, 
      label: 'Badges', 
      value: stats.total_badges || 0,
      color: '#f59e0b',
      bg: 'bg-yellow-50'
    }
  ];

  // ✅ Cartes de risque Churn
  const churnCards = [
    { 
      label: 'Total Adhérents', 
      value: churnStats.total || 0, 
      color: '#4f46e5',
      icon: FaUsers
    },
    { 
      label: '⚠️ Critique', 
      value: churnStats.critical_count || 0, 
      color: '#ef4444',
      icon: FaExclamationTriangle
    },
    { 
      label: '🔶 Élevé', 
      value: churnStats.high_risk_count || 0, 
      color: '#f97316',
      icon: FaExclamationTriangle
    },
    { 
      label: '🟡 Moyen', 
      value: churnStats.medium_risk_count || 0, 
      color: '#eab308',
      icon: FaExclamationTriangle
    }
  ];

  // ✅ Calcul du taux de risque global
  const getRiskRate = () => {
    if (churnStats.total === 0) return 0;
    const atRisk = churnStats.critical_count + churnStats.high_risk_count;
    return Math.round((atRisk / churnStats.total) * 100);
  };

  const riskRate = getRiskRate();

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-3xl font-display font-bold text-theme-primary">
                  👋 Bonjour, {user?.first_name}
                </h1>
                <p className="text-theme-secondary mt-1">
                  Tableau de bord administrateur
                </p>
              </motion.div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/admin/churn')}
                  className="btn-logo text-sm flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <FaBrain /> Voir Churn
                </button>
                <button
                  onClick={() => navigate('/admin/supervision')}
                  className="btn-logo text-sm flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <FaFileExport /> Exporter
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {/* Statistiques principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-theme-card rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer border border-theme"
                        onClick={() => {
                          if (stat.label === 'Adhérents') navigate('/admin/users?role=adherent');
                          else if (stat.label === 'Séances') navigate('/admin/sessions');
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-theme-secondary">{stat.label}</p>
                            <p className="text-2xl font-bold text-theme-primary mt-1">{stat.value}</p>
                          </div>
                          <div className={`p-2.5 rounded-xl ${stat.bg} dark:bg-opacity-20`}>
                            <Icon style={{ color: stat.color }} className="text-xl" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Analyse des risques Churn */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                        <FaExclamationTriangle className="text-red-500" />
                        Analyse des risques (Churn)
                      </h2>
                      <span className={`badge ${
                        riskRate > 30 ? 'badge-danger' :
                        riskRate > 15 ? 'badge-warning' :
                        'badge-success'
                      }`}>
                        {riskRate}% à risque
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {churnCards.map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <div key={index} className="text-center p-3 bg-theme-secondary rounded-lg">
                            <div className="flex items-center justify-center gap-2">
                              <Icon style={{ color: item.color }} className="text-sm" />
                              <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                            </div>
                            <p className="text-xs text-theme-secondary">{item.label}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => navigate('/admin/churn')}
                        className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
                      >
                        Voir l'analyse détaillée →
                      </button>
                    </div>
                  </motion.div>

                  {/* Activités récentes */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme"
                  >
                    <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2 mb-4">
                      <FaClock className="text-indigo-500" />
                      Activités récentes
                    </h2>
                    {recentActivities.length > 0 ? (
                      <div className="space-y-3 max-h-56 overflow-y-auto">
                        {recentActivities.slice(0, 5).map((activity, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-theme-secondary rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm">
                              {activity.type === 'user' && '👤'}
                              {activity.type === 'session' && '📅'}
                              {activity.type === 'program' && '💪'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-theme-primary">{activity.user_name}</p>
                              <p className="text-xs text-theme-secondary">
                                {activity.details} • {new Date(activity.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-theme-secondary py-4">Aucune activité récente</p>
                    )}
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => navigate('/admin/supervision')}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        Voir toutes les activités →
                      </button>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;