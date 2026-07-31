import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartLine, FaUsers, FaWeight, FaRuler,
  FaCalendar, FaDownload, FaFilter, FaSpinner,
  FaDumbbell, FaFire, FaClock, FaExpand,
  FaCompress, FaEye, FaTimes
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import { coachService } from '../../services/coachService';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CoachPerformance = () => {
  const { isDark } = useTheme();
  const [performances, setPerformances] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30 days');
  const [selectedAdherent, setSelectedAdherent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

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

  // ✅ Prepare chart data for an adherent
  const prepareChartData = (measurements) => {
    if (!measurements || measurements.length === 0) {
      return { labels: [], weightData: [], bodyFatData: [], muscleData: [] };
    }
    
    const sorted = [...measurements].sort((a, b) => 
      new Date(a.measured_at) - new Date(b.measured_at)
    );
    
    const labels = sorted.map(m => 
      new Date(m.measured_at).toLocaleDateString('fr-FR', { 
        month: 'short', 
        day: 'numeric' 
      })
    );
    
    // ✅ Parse values safely
    const weightData = sorted.map(m => parseFloat(m.weight) || 0);
    const bodyFatData = sorted.map(m => parseFloat(m.body_fat) || 0);
    const muscleData = sorted.map(m => parseFloat(m.muscle_mass) || 0);
    
    return { labels, weightData, bodyFatData, muscleData };
  };

  // ✅ Chart options
  const getChartOptions = (title, isDark) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDark ? '#d1d5db' : '#374151',
          font: { size: 11 },
          boxWidth: 12,
          padding: 10,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: title,
        color: isDark ? '#d1d5db' : '#374151',
        font: { size: 14, weight: 'bold' }
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#f1f5f9' : '#1e293b',
        bodyColor: isDark ? '#cbd5e1' : '#475569',
        borderColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.8)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            let value = context.parsed.y;
            let unit = context.dataset.label.includes('Poids') ? 'kg' : 
                      context.dataset.label.includes('Grasse') ? '%' : 'kg';
            return `${label}: ${value}${unit}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)',
          drawBorder: false
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 10 }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { size: 10 },
          maxTicksLimit: 8
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  });

  // ✅ Get gradient for chart
  const getGradient = (ctx, colorStart, colorEnd) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  };

  // ✅ Render mini chart in card
    const renderMiniChart = (measurements) => {
    if (!measurements || measurements.length < 2) {
      return (
        <div className="text-center py-4 text-theme-muted text-sm">
          <FaChartLine className="text-2xl mx-auto mb-1 opacity-30" />
          Données insuffisantes
        </div>
      );
    }

    const sorted = [...measurements].sort((a, b) => 
      new Date(a.measured_at) - new Date(b.measured_at)
    );
    
    // ✅ Filter out invalid weight values
    const validWeights = sorted
      .map(m => parseFloat(m.weight))
      .filter(w => !isNaN(w) && w > 0);
    
    if (validWeights.length < 2) {
      return (
        <div className="text-center py-4 text-theme-muted text-sm">
          <FaChartLine className="text-2xl mx-auto mb-1 opacity-30" />
          Données de poids insuffisantes
        </div>
      );
    }
    
    const weights = validWeights;
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const range = maxWeight - minWeight || 1;
    
    // ✅ Create points with proper scaling
    const points = weights.map((w, i) => ({
      x: (i / (weights.length - 1)) * 100,
      y: 100 - ((w - minWeight) / range) * 85 - 5
    }));

    // Create smooth path
    const getSmoothPath = (pts) => {
      if (pts.length < 2) return '';
      
      let path = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? 0 : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || pts[i + 1];
        
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return path;
    };

    const pathD = getSmoothPath(points);
    const areaPath = pathD + ` L ${points[points.length-1].x} 100 L ${points[0].x} 100 Z`;
    const isUpward = weights[weights.length - 1] > weights[0];
    const color = isUpward ? '#ef4444' : '#22c55e';
    const lightColor = isUpward ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)';

    // ✅ Get first and last values safely
    const firstWeight = weights[0] || 0;
    const lastWeight = weights[weights.length - 1] || 0;

    return (
      <div className="relative h-16 w-full mt-2">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Area fill */}
          <path
            d={areaPath}
            fill={lightColor}
            opacity={0.3}
          />
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2"
              fill={color}
              opacity={i === points.length - 1 ? 1 : 0.5}
            />
          ))}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-theme-muted mt-1">
          <span style={{ marginTop: "-15px" }}>{new Date(sorted[0].measured_at).toLocaleDateString('fr-FR')}</span>
          <span>{new Date(sorted[sorted.length-1].measured_at).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>
    );
  };

  // ✅ Render detailed chart in modal
  const renderDetailedChart = (adherent) => {
    if (!adherent || !adherent.measurements || adherent.measurements.length < 2) {
      return (
        <div className="text-center py-12 text-theme-muted">
          <FaChartLine className="text-4xl mx-auto mb-2 opacity-30" />
          <p>Données insuffisantes pour afficher le graphique</p>
          <p className="text-sm">Minimum 2 mesures requises</p>
        </div>
      );
    }

    const sorted = [...adherent.measurements].sort((a, b) => 
      new Date(a.measured_at) - new Date(b.measured_at)
    );
    
    const labels = sorted.map(m => 
      new Date(m.measured_at).toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric'
      })
    );
    
    const data = {
      labels,
      datasets: [
        {
          label: 'Poids (kg)',
          data: sorted.map(m => m.weight),
          borderColor: '#8b5cf6',
          backgroundColor: (ctx) => {
            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#8b5cf6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
        {
          label: 'Masse grasse (%)',
          data: sorted.map(m => m.body_fat),
          borderColor: '#ef4444',
          backgroundColor: (ctx) => {
            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          borderDash: [5, 5],
        },
        {
          label: 'Masse musculaire (kg)',
          data: sorted.map(m => m.muscle_mass),
          borderColor: '#22c55e',
          backgroundColor: (ctx) => {
            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          borderDash: [3, 3],
        }
      ]
    };

    return (
      <div className="h-80">
        <Line 
          data={data} 
          options={getChartOptions(
            `Évolution de ${adherent.first_name} ${adherent.last_name}`,
            isDark
          )} 
        />
      </div>
    );
  };

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
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div>
                <h1 className="text-3xl font-display font-bold text-theme-primary">
                  📊 Performances des Adhérents
                </h1>
                <p className="text-theme-secondary text-sm mt-1">
                  Suivez l'évolution des mesures de vos adhérents
                </p>
              </div>
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

            {/* Stats Cards */}
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
                      const isExpanded = expandedCard === adherent.id;
                      
                      return (
                        <motion.div
                          key={adherent.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`bg-theme-card rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border ${
                            isExpanded ? 'border-indigo-500 shadow-lg' : 'border-theme'
                          }`}
                          style={{
                            transform: isExpanded ? 'scale(1.02)' : 'scale(1)'
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedAdherent(adherent);
                                  setShowDetailModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                title="Voir les détails"
                              >
                                <FaEye className="text-sm" />
                              </button>
                              <button
                                onClick={() => setExpandedCard(isExpanded ? null : adherent.id)}
                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                              >
                                {isExpanded ? <FaCompress className="text-sm" /> : <FaExpand className="text-sm" />}
                              </button>
                              <div className="text-right">
                                {last && (
                                  <p className="text-sm font-bold text-theme-primary">
                                    {typeof last.weight === 'number' ? last.weight.toFixed(1) : parseFloat(last.weight)?.toFixed(1) || '0'} kg
                                  </p>
                                )}
                                {weightChange !== 0 && (
                                  <p className={`text-xs font-medium ${weightChange < 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {weightChange > 0 ? '↑' : '↓'} {Math.abs(weightChange).toFixed(1)} kg
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* ✅ Improved Curve */}
                          {renderMiniChart(measurements)}

                          {isExpanded && measurements.length > 2 && (
                            <div className="mt-4 pt-4 border-t border-theme">
                              <h4 className="text-xs font-medium text-theme-secondary mb-3">
                                📈 Évolution détaillée
                              </h4>
                              {renderDetailedChart(adherent)}
                            </div>
                          )}

                          {last && (
                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-theme">
                              <div className="text-center p-2 bg-theme-secondary rounded-lg">
                                <p className="text-[10px] text-theme-secondary uppercase tracking-wider">Masse grasse</p>
                                <p className="text-sm font-semibold text-theme-primary">
                                  {last.body_fat || '-'}%
                                </p>
                              </div>
                              <div className="text-center p-2 bg-theme-secondary rounded-lg">
                                <p className="text-[10px] text-theme-secondary uppercase tracking-wider">Muscle</p>
                                <p className="text-sm font-semibold text-theme-primary">
                                  {last.muscle_mass || '-'} kg
                                </p>
                              </div>
                              <div className="text-center p-2 bg-theme-secondary rounded-lg">
                                <p className="text-[10px] text-theme-secondary uppercase tracking-wider">Dernière</p>
                                <p className="text-xs text-theme-muted">
                                  {last.measured_at ? new Date(last.measured_at).toLocaleDateString('fr-FR') : '-'}
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
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

      {/* ✅ Detail Modal with Full Chart */}
      {showDetailModal && selectedAdherent && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-theme-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-theme"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-theme-primary flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {selectedAdherent.first_name?.[0]}{selectedAdherent.last_name?.[0]}
                  </span>
                  {selectedAdherent.first_name} {selectedAdherent.last_name}
                </h2>
                <p className="text-sm text-theme-secondary mt-1">
                  {selectedAdherent.measurements?.length || 0} mesures · Période: {period}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAdherent(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Full Chart */}
            {renderDetailedChart(selectedAdherent)}

            {/* Summary Stats */}
            {selectedAdherent.measurements && selectedAdherent.measurements.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {(() => {
                  const sorted = [...selectedAdherent.measurements].sort((a, b) => 
                    new Date(a.measured_at) - new Date(b.measured_at)
                  );
                  const first = sorted[0];
                  const last = sorted[sorted.length - 1];
                  const firstWeight = first ? parseFloat(first.weight) || 0 : 0;
                  const lastWeight = last ? parseFloat(last.weight) || 0 : 0;
                  const weightChange = lastWeight - firstWeight;
                                    
                  const changes = [];
                  if (first && last) {
                    changes.push({
                      label: 'Poids',
                      value: last.weight,
                      change: last.weight - first.weight,
                      unit: 'kg',
                      color: last.weight - first.weight < 0 ? '#22c55e' : '#ef4444'
                    });
                    if (first.body_fat && last.body_fat) {
                      changes.push({
                        label: 'Masse grasse',
                        value: last.body_fat,
                        change: last.body_fat - first.body_fat,
                        unit: '%',
                        color: last.body_fat - first.body_fat < 0 ? '#22c55e' : '#ef4444'
                      });
                    }
                    if (first.muscle_mass && last.muscle_mass) {
                      changes.push({
                        label: 'Muscle',
                        value: last.muscle_mass,
                        change: last.muscle_mass - first.muscle_mass,
                        unit: 'kg',
                        color: last.muscle_mass - first.muscle_mass > 0 ? '#22c55e' : '#ef4444'
                      });
                    }
                    changes.push({
                      label: 'Mesures',
                      value: sorted.length,
                      change: null,
                      unit: '',
                      color: '#8b5cf6'
                    });
                  }
                  
                  return changes.map((item, index) => (
                    <div key={index} className="p-3 bg-theme-secondary rounded-lg text-center">
                      <p className="text-xs text-theme-muted">{item.label}</p>
                      <p className="text-lg font-bold text-theme-primary">
                        {item.value}{item.unit}
                      </p>
                      {item.change !== null && (
                        <p className={`text-xs font-medium ${item.change < 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {item.change > 0 ? '↑' : '↓'} {Math.abs(item.change).toFixed(1)}{item.unit}
                        </p>
                      )}
                    </div>
                  ));
                })()}
              </div>
            )}

            <button
              onClick={() => {
                setShowDetailModal(false);
                setSelectedAdherent(null);
              }}
              className="btn-secondary w-full mt-6"
            >
              Fermer
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CoachPerformance;