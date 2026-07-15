import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartLine, FaUsers, FaWeight, FaRuler,
  FaCalendar, FaDownload, FaFilter, FaSpinner,
  FaDumbbell, FaFire, FaClock
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import { coachService } from '../../services/coachService';
import toast from 'react-hot-toast';

const CoachPerformance = () => {
  const { isDark } = useTheme();
  const [performances, setPerformances] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30 days');

  useEffect(() => {
    fetchPerformances();
  }, [period]);

  const fetchPerformances = async () => {
    try {
      setLoading(true);
      const response = await coachService.getAdherentPerformances(period);
      setPerformances(response.data.performances || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching performances:', error);
      toast.error('Erreur lors du chargement des performances');
    } finally {
      setLoading(false);
    }
  };

  const groupedPerformances = performances.reduce((acc, perf) => {
    if (!acc[perf.id]) {
      acc[perf.id] = {
        id: perf.id,
        first_name: perf.first_name,
        last_name: perf.last_name,
        measurements: []
      };
    }
    if (perf.rn === 1) {
      acc[perf.id].latest = perf;
    }
    acc[perf.id].measurements.push(perf);
    return acc;
  }, {});

  const adherentList = Object.values(groupedPerformances);

  const statsCards = stats ? [
    { label: 'Total adhérents', value: stats.total_adherents || 0, icon: FaUsers, color: '#4f46e5' },
    { label: 'Adhérents actifs', value: stats.active_adherents || 0, icon: FaDumbbell, color: '#22c55e' },
    { label: 'Assiduité moyenne', value: `${stats.avg_attendance || 0}%`, icon: FaFire, color: '#f59e0b' },
    { label: 'Poids moyen', value: `${stats.avg_weight || 0} kg`, icon: FaWeight, color: '#8b5cf6' }
  ] : [];

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <CoachNavbar />
      <div className="flex">
        <CoachSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-display font-bold text-theme-primary">
                📊 Performances des Adhérents
              </h1>
              <div className="flex gap-3">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="input-logo w-40"
                >
                  <option value="7 days">7 jours</option>
                  <option value="14 days">14 jours</option>
                  <option value="30 days">30 jours</option>
                  <option value="60 days">60 jours</option>
                  <option value="90 days">90 jours</option>
                </select>
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {statsCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-theme-card rounded-xl p-4 shadow-sm border border-theme"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ background: `${stat.color}15` }}>
                          <Icon style={{ color: stat.color }} className="text-lg" />
                        </div>
                        <div>
                          <p className="text-sm text-theme-secondary">{stat.label}</p>
                          <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {adherentList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {adherentList.map((adherent) => {
                      const measurements = adherent.measurements || [];
                      const sorted = [...measurements].sort((a, b) => 
                        new Date(a.measured_at) - new Date(b.measured_at)
                      );
                      const first = sorted[0];
                      const last = sorted[sorted.length - 1];
                      const weightChange = last && first ? (last.weight - first.weight) : 0;
                      
                      return (
                        <div
                          key={adherent.id}
                          className="bg-theme-card rounded-xl p-5 shadow-sm hover:shadow-md transition border border-theme"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                {adherent.first_name?.[0]}{adherent.last_name?.[0]}
                              </div>
                              <div>
                                <h3 className="font-semibold text-theme-primary">
                                  {adherent.first_name} {adherent.last_name}
                                </h3>
                                <p className="text-xs text-theme-secondary">
                                  {measurements.length} mesures
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {last && (
                                <p className="text-sm font-bold text-theme-primary">
                                  {last.weight} kg
                                </p>
                              )}
                              {weightChange !== 0 && (
                                <p className={`text-xs font-medium ${weightChange < 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                                </p>
                              )}
                            </div>
                          </div>

                          {measurements.length > 1 && (
                            <div className="h-12 flex items-end gap-0.5 mt-2">
                              {sorted.slice(-10).map((m, i) => {
                                const maxWeight = Math.max(...sorted.slice(-10).map(p => p.weight));
                                const minWeight = Math.min(...sorted.slice(-10).map(p => p.weight));
                                const range = maxWeight - minWeight || 1;
                                const height = ((m.weight - minWeight) / range) * 100;
                                
                                return (
                                  <div
                                    key={i}
                                    className="flex-1 bg-indigo-500 rounded-t transition-all duration-300"
                                    style={{
                                      height: `${Math.max(height, 5)}%`,
                                      opacity: 0.5 + (i / sorted.slice(-10).length) * 0.5
                                    }}
                                  />
                                );
                              })}
                            </div>
                          )}

                          {last && (
                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-theme">
                              <div className="text-center">
                                <p className="text-xs text-theme-secondary">Masse grasse</p>
                                <p className="text-sm font-semibold text-theme-primary">
                                  {last.body_fat || '-'}%
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-theme-secondary">Muscle</p>
                                <p className="text-sm font-semibold text-theme-primary">
                                  {last.muscle_mass || '-'} kg
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-theme-secondary">Dernière</p>
                                <p className="text-xs text-theme-muted">
                                  {last.measured_at ? new Date(last.measured_at).toLocaleDateString('fr-FR') : '-'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-theme-card rounded-xl border border-theme">
                    <FaChartLine className="text-6xl text-theme-muted mx-auto mb-4" />
                    <p className="text-theme-secondary">Aucune donnée de performance disponible</p>
                    <p className="text-sm text-theme-muted mt-1">
                      Les adhérents doivent ajouter des mesures
                    </p>
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

export default CoachPerformance;