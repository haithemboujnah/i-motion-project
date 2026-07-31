import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendar, FaClock, FaUser, FaSearch, 
  FaFilter, FaDownload, FaCheckCircle, FaTimes,
  FaUsers, FaChartLine, FaEye, FaArrowLeft
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import { qrService } from '../../services/qrService';
import { coachService } from '../../services/coachService';
import toast from 'react-hot-toast';

const CoachAttendanceHistory = () => {
  const navigate = useNavigate();
  const [attendances, setAttendances] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unique_adherents: 0,
    sessions_with_attendance: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAdherent, setFilterAdherent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adherents, setAdherents] = useState([]);
  const [selectedAdherent, setSelectedAdherent] = useState(null);
  const [adherentStats, setAdherentStats] = useState(null);

  useEffect(() => {
    fetchData();
    fetchAdherents();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterAdherent) filters.adherentId = filterAdherent;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (searchTerm) filters.search = searchTerm;
      
      const response = await qrService.getCoachAttendances(filters);
      setAttendances(response.data.attendances || []);
      setStats(response.data.stats || { total: 0, unique_adherents: 0, sessions_with_attendance: 0 });
    } catch (error) {
      console.error('Error fetching attendances:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdherents = async () => {
    try {
      const response = await coachService.getAdherents();
      setAdherents(response.data.adherents || []);
    } catch (error) {
      console.error('Error fetching adherents:', error);
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleAdherentClick = async (adherentId) => {
    try {
        console.log(`📊 Récupération des stats pour l'adhérent ${adherentId}`);
        const response = await qrService.getAdherentAttendanceStats(adherentId);
        
        if (response.success) {
        const adherent = adherents.find(a => a.id === parseInt(adherentId));
        setSelectedAdherent(adherent || { id: adherentId, first_name: 'Inconnu', last_name: '' });
        setAdherentStats(response.data);
        } else {
        toast.error(response.error || 'Erreur lors du chargement des statistiques');
        }
    } catch (error) {
        console.error('Error fetching adherent stats:', error);
        toast.error(error.response?.data?.error || 'Erreur lors du chargement des statistiques');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDayName = (day) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[day] || '';
  };

  // Stats Cards
  const statsCards = [
    { label: 'Total pointages', value: stats.total || 0, icon: FaCheckCircle, color: '#57a1ce' },
    { label: 'Adhérents uniques', value: stats.unique_adherents || 0, icon: FaUsers, color: '#22c55e' },
    { label: 'Séances pointées', value: stats.sessions_with_attendance || 0, icon: FaCalendar, color: '#8b5cf6' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
      <CoachNavbar />
      <div className="flex">
        <CoachSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                  📋 Historique des pointages
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Consultez tous les pointages effectués par QR Code
                </p>
              </div>
              <button
                onClick={() => navigate('/coach/dashboard')}
                className="mt-4 md:mt-0 btn-secondary text-sm flex items-center gap-2"
              >
                <FaArrowLeft /> Retour
              </button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {statsCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl" style={{ background: `${stat.color}15` }}>
                        <Icon style={{ color: stat.color }} className="text-xl" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Filtres */}
            <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm mb-6 border border-gray-100 dark:border-dark">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un adhérent..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-dark rounded-lg focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                  />
                </div>
                <select
                  value={filterAdherent}
                  onChange={(e) => setFilterAdherent(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-dark rounded-lg focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                >
                  <option value="">Tous les adhérents</option>
                  {adherents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.first_name} {a.last_name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-dark rounded-lg focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-dark rounded-lg focus:ring-2 focus:ring-[#57a1ce] focus:border-transparent bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSearch}
                  className="btn-logo text-sm"
                >
                  <FaSearch className="inline mr-2" />
                  Filtrer
                </button>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterAdherent('');
                    setStartDate('');
                    setEndDate('');
                    fetchData();
                  }}
                  className="btn-secondary text-sm"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {/* Tableau des pointages */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark overflow-hidden">
                  {attendances.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-dark-secondary border-b border-gray-200 dark:border-dark">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Adhérent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Séance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date / Heure
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark">
                          {attendances.map((attendance) => (
                            <tr key={attendance.id} className="hover:bg-gray-50 dark:hover:bg-dark-secondary transition">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#57a1ce]/10 flex items-center justify-center text-[#57a1ce] text-sm font-bold">
                                    {attendance.adherent_first_name?.[0]}{attendance.adherent_last_name?.[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800 dark:text-white text-sm">
                                      {attendance.adherent_first_name} {attendance.adherent_last_name}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                      {attendance.adherent_email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-gray-800 dark:text-white">
                                  {attendance.session_type || 'Séance'}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  ID: #{attendance.session_id}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-gray-800 dark:text-white">
                                  {formatDateShort(attendance.checked_at)}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  {new Date(attendance.checked_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="badge-success text-xs">
                                  <FaCheckCircle className="inline mr-1 text-xs" />
                                  Présent
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleAdherentClick(attendance.adherent_id)}
                                  className="text-[#57a1ce] hover:text-[#3d7fa8] transition text-sm flex items-center gap-1"
                                >
                                  <FaEye className="text-xs" />
                                  Stats
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FaCheckCircle className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Aucun pointage enregistré</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Commencez à scanner des QR Codes pour voir l'historique
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal des statistiques d'un adhérent */}
                {selectedAdherent && adherentStats && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-dark">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Statistiques de {selectedAdherent.first_name} {selectedAdherent.last_name}
                        </h2>
                        <button
                          onClick={() => {
                            setSelectedAdherent(null);
                            setAdherentStats(null);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="p-4 space-y-4">
                        {/* Stats globales */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                            <p className="text-2xl font-bold text-[#57a1ce]">
                              {adherentStats.stats?.length || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total pointages</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                            <p className="text-2xl font-bold text-green-500">
                              {adherentStats.stats?.reduce((acc, s) => acc + parseInt(s.count_by_day), 0) || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Présences</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                            <p className="text-2xl font-bold text-purple-500">
                              {adherentStats.recent_attendances?.length || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Dernières 10 séances</p>
                          </div>
                        </div>

                        {/* Distribution par jour */}
                        {adherentStats.stats && adherentStats.stats.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                              📊 Distribution par jour de la semaine
                            </h4>
                            <div className="grid grid-cols-7 gap-2">
                              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                                const data = adherentStats.stats.find(s => parseInt(s.day_of_week) === day);
                                const count = data ? parseInt(data.count_by_day) : 0;
                                const max = Math.max(...adherentStats.stats.map(s => parseInt(s.count_by_day)), 1);
                                const height = (count / max) * 100;
                                return (
                                  <div key={day} className="text-center">
                                    <div className="h-24 flex items-end justify-center">
                                      <div 
                                        className="w-full bg-[#57a1ce] rounded-t"
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                      />
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                      {getDayName(day).substring(0, 3)}
                                    </p>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                      {count}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Dernières présences */}
                        {adherentStats.recent_attendances && adherentStats.recent_attendances.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                              📋 Dernières présences
                            </h4>
                            <div className="space-y-2">
                              {adherentStats.recent_attendances.slice(0, 5).map((att, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                                  <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                                      {att.session_type || 'Séance'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatDate(att.checked_at)}
                                    </p>
                                  </div>
                                  <span className="badge-success text-xs">
                                    ✅ Présent
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoachAttendanceHistory;