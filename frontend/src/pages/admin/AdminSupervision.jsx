import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaEye, FaCalendar, FaUsers, FaDumbbell,
  FaChartLine, FaDownload, FaFileExcel, FaFilePdf,
  FaClock, FaUser, FaCheckCircle, FaTimesCircle,
  FaSearch, FaFilter, FaArrowRight, FaSpinner,
  FaChartPie, FaChartBar, FaHeartbeat
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminSupervision = () => {
  const { isDark } = useTheme();
  const [activities, setActivities] = useState([]);
  const [clubStats, setClubStats] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportType, setExportType] = useState('users');
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activitiesRes, clubRes, statsRes] = await Promise.all([
        adminService.getRecentActivities(50),
        adminService.getClubStats(),
        adminService.getGlobalStats()
      ]);
      
      setActivities(activitiesRes.data.activities || []);
      setClubStats(clubRes.data.stats || []);
      setGlobalStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Export CSV amélioré
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await adminService.exportCSV(exportType);
      
      // Vérifier que la réponse contient des données
      if (!response.data || response.data.size === 0) {
        throw new Error('Aucune donnée à exporter');
      }
      
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export_${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Export CSV (${exportType}) réussi !`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  // ✅ Filtrer les activités
  const getFilteredActivities = () => {
    let filtered = activities;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.user_name?.toLowerCase().includes(term) ||
        a.details?.toLowerCase().includes(term) ||
        a.type?.toLowerCase().includes(term)
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.type === filterType);
    }
    
    return filtered;
  };

  const getActivityIcon = (type) => {
    const icons = {
      'session': <FaCalendar className="text-blue-500" />,
      'user': <FaUser className="text-green-500" />,
      'program': <FaDumbbell className="text-purple-500" />
    };
    return icons[type] || <FaClock className="text-gray-500" />;
  };

  const getActivityColor = (type) => {
    const colors = {
      'session': 'bg-blue-50 border-blue-200',
      'user': 'bg-green-50 border-green-200',
      'program': 'bg-purple-50 border-purple-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'session': 'Séance',
      'user': 'Utilisateur',
      'program': 'Programme'
    };
    return labels[type] || type;
  };

  const filteredActivities = getFilteredActivities();

  // ✅ Statistiques globales
  const renderGlobalStats = () => {
    if (!globalStats) return null;
    
    const stats = [
      { label: 'Total utilisateurs', value: globalStats.total_users || 0, icon: FaUsers, color: '#4f46e5' },
      { label: 'Adhérents', value: globalStats.total_adherents || 0, icon: FaUser, color: '#22c55e' },
      { label: 'Coachs', value: globalStats.total_coaches || 0, icon: FaDumbbell, color: '#8b5cf6' },
      { label: 'Séances', value: globalStats.total_sessions || 0, icon: FaCalendar, color: '#f59e0b' },
      { label: 'Séances complétées', value: globalStats.completed_sessions || 0, icon: FaCheckCircle, color: '#22c55e' },
      { label: 'Points totaux', value: globalStats.total_points || 0, icon: FaChartLine, color: '#ec4899' }
    ];
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: `${stat.color}15` }}>
                  <Icon style={{ color: stat.color }} className="text-lg" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-theme-primary flex items-center gap-3">
                  <FaEye className="text-indigo-500" />
                  Supervision globale
                </h1>
                <p className="text-theme-secondary mt-1">
                  Vue d'ensemble des activités et statistiques de la plateforme
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="input-logo w-40"
                  disabled={exporting}
                >
                  <option value="users">Utilisateurs</option>
                  <option value="sessions">Séances</option>
                  <option value="programs">Programmes</option>
                </select>
                <button
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className="btn-logo text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Export...
                    </>
                  ) : (
                    <>
                      <FaDownload /> Exporter CSV
                    </>
                  )}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {/* Statistiques globales */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  {globalStats && [
                    { label: 'Total utilisateurs', value: globalStats.total_users || 0, icon: FaUsers, color: '#4f46e5' },
                    { label: 'Adhérents', value: globalStats.total_adherents || 0, icon: FaUser, color: '#22c55e' },
                    { label: 'Coachs', value: globalStats.total_coaches || 0, icon: FaDumbbell, color: '#8b5cf6' },
                    { label: 'Séances', value: globalStats.total_sessions || 0, icon: FaCalendar, color: '#f59e0b' },
                    { label: 'Séances complétées', value: globalStats.completed_sessions || 0, icon: FaCheckCircle, color: '#22c55e' },
                    { label: 'Points totaux', value: globalStats.total_points || 0, icon: FaChartLine, color: '#ec4899' }
                  ].map((stat, index) => {
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

                {/* Statistiques par club */}
                {clubStats && clubStats.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
                      <FaChartPie className="text-indigo-500" />
                      Statistiques par club
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {clubStats.map((club, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-theme-card rounded-xl p-5 shadow-sm border border-theme hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-800">{club.name}</h3>
                            <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">Club</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                              <p className="text-lg font-bold text-gray-800">{club.members}</p>
                              <p className="text-xs text-gray-500">Membres</p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                              <p className="text-lg font-bold text-gray-800">{club.sessions}</p>
                              <p className="text-xs text-gray-500">Séances</p>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded-lg">
                              <p className="text-lg font-bold text-green-600">{club.attendance}%</p>
                              <p className="text-xs text-gray-500">Assiduité</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="w-full h-1.5 bg-gray-200 rounded-full">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${club.attendance || 0}%` }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activités récentes */}
                <div className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                    <h3 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                      <FaHeartbeat className="text-indigo-500" />
                      Activités récentes
                      <span className="text-sm font-normal text-theme-secondary">
                        ({filteredActivities.length} activités)
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-2.5 text-theme-secondary text-sm" />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 pr-3 py-1.5 border border-theme rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-theme-card text-theme-primary"
                        />
                      </div>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="py-1.5 px-3 border border-theme rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-theme-card text-theme-primary"
                      >
                        <option value="all">Tous</option>
                        <option value="user">Utilisateurs</option>
                        <option value="session">Séances</option>
                        <option value="program">Programmes</option>
                      </select>
                    </div>
                  </div>

                  {filteredActivities.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {filteredActivities.slice(0, 30).map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`flex items-center gap-4 p-3 rounded-lg border transition hover:shadow-sm ${getActivityColor(activity.type)} dark:border-gray-700 dark:bg-gray-800/30`}
                        >
                          <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center flex-shrink-0">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-theme-primary truncate">
                              {activity.user_name || 'Utilisateur inconnu'}
                            </p>
                            <p className="text-sm text-theme-secondary flex items-center gap-2">
                              <span className="capitalize">{getTypeLabel(activity.type)}</span>
                              <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0"></span>
                              <span className="truncate">{activity.details}</span>
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-theme-muted">
                              {new Date(activity.created_at).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-xs text-theme-muted">
                              {new Date(activity.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FaHeartbeat className="text-4xl text-theme-muted mx-auto mb-3" />
                      <p className="text-theme-secondary">Aucune activité trouvée</p>
                      <p className="text-sm text-theme-muted mt-1">
                        {searchTerm || filterType !== 'all' ? 'Essayez de modifier les filtres' : 'Aucune activité récente'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions rapides */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {[
                    { label: 'Voir utilisateurs', icon: FaUsers, path: '/admin/users', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400' },
                    { label: 'Voir séances', icon: FaCalendar, path: '/admin/sessions', color: 'bg-green-50 dark:bg-green-900/20 text-green-500 dark:text-green-400' },
                    { label: 'Voir programmes', icon: FaDumbbell, path: '/admin/programs', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500 dark:text-purple-400' },
                    { label: 'Générer rapport', icon: FaFilePdf, path: '/admin/analytics', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 dark:text-yellow-400' }
                  ].map((action, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="bg-theme-card rounded-xl p-4 shadow-sm border border-theme hover:shadow-md transition cursor-pointer group"
                      onClick={() => window.location.href = action.path}
                    >
                      <div className={`w-12 h-12 mx-auto rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition`}>
                        <action.icon className="text-2xl" />
                      </div>
                      <p className="text-sm font-medium text-theme-primary mt-2 text-center">{action.label}</p>
                      <p className="text-xs text-theme-muted text-center">Cliquez pour accéder</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSupervision;