import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaWeight, FaRuler, FaChartLine, FaFilePdf, 
  FaPlus, FaDownload, FaCalendar, FaSpinner
} from 'react-icons/fa';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import { performanceService } from '../../services/performanceService';
import toast from 'react-hot-toast';

const Performance = () => {
  const [measurements, setMeasurements] = useState([]);
  const [stats, setStats] = useState(null);
  const [evolution, setEvolution] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [formData, setFormData] = useState({
    weight: '',
    body_fat: '',
    muscle_mass: '',
    notes: ''
  });

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const [measurementsRes, statsRes, evolutionRes] = await Promise.all([
        performanceService.getMeasurements(30),
        performanceService.getStats(),
        performanceService.getEvolution('30 days')
      ]);
      
      setMeasurements(measurementsRes.data.measurements || []);
      setStats(statsRes.data);
      
      let evolutionData = evolutionRes.data.evolution || [];
      if (evolutionData.length === 0 && measurementsRes.data.measurements) {
        evolutionData = measurementsRes.data.measurements
          .slice()
          .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at))
          .map(m => ({
            measured_at: m.measured_at,
            weight: m.weight,
            body_fat: m.body_fat,
            muscle_mass: m.muscle_mass
          }));
      }
      
      setEvolution(evolutionData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/performance/report/pdf', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Le fichier est vide');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `rapport-performance-${new Date().toISOString().split('T')[0]}.pdf`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Rapport PDF téléchargé avec succès !');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Erreur lors du téléchargement du rapport');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    try {
      await performanceService.addMeasurement({
        ...formData,
        weight: parseFloat(formData.weight),
        body_fat: formData.body_fat ? parseFloat(formData.body_fat) : null,
        muscle_mass: formData.muscle_mass ? parseFloat(formData.muscle_mass) : null
      });
      toast.success('Mesure ajoutée avec succès !');
      setShowAddModal(false);
      setFormData({ weight: '', body_fat: '', muscle_mass: '', notes: '' });
      fetchPerformanceData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'ajout');
    }
  };

  // ✅ Graphique avec courbe SINUSOÏDALE (CORRIGÉ)
  const renderEvolutionChart = () => {
    if (!evolution || evolution.length === 0) {
      return (
        <div className="text-center py-12">
          <FaChartLine className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune donnée d'évolution disponible</p>
          <p className="text-sm text-gray-400 mt-1">
            Ajoutez des mesures pour voir votre progression
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-logo text-sm inline-block mt-4"
          >
            <FaPlus className="inline mr-2" />
            Ajouter une mesure
          </button>
        </div>
      );
    }

    // Trier les données par date
    const sortedData = [...evolution].sort((a, b) => 
      new Date(a.measured_at) - new Date(b.measured_at)
    );

    // Si une seule donnée
    if (sortedData.length === 1) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Une seule mesure enregistrée</p>
          <p className="text-sm text-gray-400 mt-1">
            Ajoutez plus de mesures pour voir l'évolution
          </p>
        </div>
      );
    }

    const maxWeight = Math.max(...sortedData.map(p => p.weight));
    const minWeight = Math.min(...sortedData.map(p => p.weight));
    const range = maxWeight - minWeight || 1;
    const padding = 40;
    const chartWidth = 700;
    const chartHeight = 220;

    return (
      <div className="relative">
        <div className="w-full overflow-x-auto">
          <svg 
            className="w-full" 
            viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight + padding * 2 + 30}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* === GRILLE HORIZONTALE === */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = padding + (i / 4) * chartHeight;
              const value = maxWeight - (i / 4) * range;
              return (
                <g key={`grid-${i}`}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={padding + chartWidth}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding - 10}
                    y={y + 4}
                    fontSize="11"
                    fill="#9ca3af"
                    textAnchor="end"
                  >
                    {value.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* === LIGNES VERTICALES === */}
            {sortedData.map((point, index) => {
              const x = padding + (index / (sortedData.length - 1)) * chartWidth;
              return (
                <line
                  key={`vline-${index}`}
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={padding + chartHeight}
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                />
              );
            })}

            {/* === DÉGRADÉ === */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#57a1ce" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#57a1ce" stopOpacity="0"/>
              </linearGradient>
            </defs>

            {/* === ZONE SOUS LA COURBE === */}
            <polygon
              points={`
                ${padding},${padding + chartHeight}
                ${sortedData.map((point, index) => {
                  const x = padding + (index / (sortedData.length - 1)) * chartWidth;
                  const y = padding + chartHeight - ((point.weight - minWeight) / range) * chartHeight;
                  return `${x},${y}`;
                }).join(' ')}
                ${padding + chartWidth},${padding + chartHeight}
              `}
              fill="url(#areaGradient)"
            />

            {/* === COURBE PRINCIPALE (SINUSOÏDALE) === */}
            <polyline
              points={sortedData.map((point, index) => {
                const x = padding + (index / (sortedData.length - 1)) * chartWidth;
                const y = padding + chartHeight - ((point.weight - minWeight) / range) * chartHeight;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#57a1ce"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* === POINTS === */}
            {sortedData.map((point, index) => {
              const x = padding + (index / (sortedData.length - 1)) * chartWidth;
              const y = padding + chartHeight - ((point.weight - minWeight) / range) * chartHeight;
              
              return (
                <g key={`point-${index}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="white"
                    stroke="#57a1ce"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#57a1ce"
                  />
                  <title>{`${point.weight} kg - ${new Date(point.measured_at).toLocaleDateString('fr-FR')}`}</title>
                </g>
              );
            })}

            {/* === DATES EN BAS === */}
            {sortedData.map((point, index) => {
              const x = padding + (index / (sortedData.length - 1)) * chartWidth;
              const date = new Date(point.measured_at);
              const showDate = index === 0 || 
                              index === sortedData.length - 1 || 
                              index % Math.max(1, Math.ceil(sortedData.length / 6)) === 0;
              
              if (!showDate) return null;
              
              return (
                <text
                  key={`date-${index}`}
                  x={x}
                  y={padding + chartHeight + 25}
                  fontSize="10"
                  fill="#9ca3af"
                  textAnchor="middle"
                  transform={`rotate(-25, ${x}, ${padding + chartHeight + 25})`}
                >
                  {date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </text>
              );
            })}
          </svg>
        </div>

        {/* === LÉGENDE === */}
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{new Date(sortedData[0]?.measured_at).toLocaleDateString('fr-FR')}</span>
          <span className="font-medium text-[#57a1ce]">
            {minWeight.toFixed(1)} kg → {maxWeight.toFixed(1)} kg
          </span>
          <span>{new Date(sortedData[sortedData.length - 1]?.measured_at).toLocaleDateString('fr-FR')}</span>
        </div>

        {/* === STATISTIQUES RAPIDES === */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">Valeur min</p>
            <p className="text-sm font-semibold text-gray-700">{minWeight.toFixed(1)} kg</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Valeur max</p>
            <p className="text-sm font-semibold text-gray-700">{maxWeight.toFixed(1)} kg</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Évolution</p>
            <p className={`text-sm font-semibold ${maxWeight > minWeight ? 'text-green-500' : 'text-red-500'}`}>
              {(maxWeight - minWeight).toFixed(1)} kg
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-display font-bold text-gray-900">
                📊 Suivi des Performances
              </h1>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-logo text-sm flex items-center gap-2"
                >
                  <FaPlus /> Ajouter une mesure
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <FaFilePdf /> Rapport PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {/* Statistiques */}
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <p className="text-sm text-gray-500">Poids actuel</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.stats?.current_weight || '-'} kg
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <p className="text-sm text-gray-500">IMC</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.bmi?.bmi || '-'}
                      </p>
                      <p className="text-xs text-gray-500">{stats.bmi?.category || ''}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <p className="text-sm text-gray-500">Masse grasse</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.stats?.avg_body_fat || '-'}%
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <p className="text-sm text-gray-500">Assiduité</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.attendance?.rate || 0}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Graphique d'évolution */}
                <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">
                      📈 Évolution du poids
                    </h3>
                    {evolution && evolution.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {evolution.length} mesures
                      </span>
                    )}
                  </div>
                  {renderEvolutionChart()}
                </div>

                {/* Historique des mesures */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    📋 Historique des mesures
                  </h3>
                  {measurements && measurements.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm text-gray-500 border-b">
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Poids (kg)</th>
                            <th className="pb-3">Masse grasse (%)</th>
                            <th className="pb-3">Masse musculaire (kg)</th>
                            <th className="pb-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {measurements.slice(0, 10).map((measurement) => (
                            <tr key={measurement.id} className="border-b last:border-0">
                              <td className="py-3 text-sm">
                                {new Date(measurement.measured_at).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="py-3 font-medium">{measurement.weight}</td>
                              <td className="py-3">{measurement.body_fat || '-'}</td>
                              <td className="py-3">{measurement.muscle_mass || '-'}</td>
                              <td className="py-3 text-sm text-gray-500">{measurement.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {measurements.length > 10 && (
                        <p className="text-sm text-gray-400 mt-2 text-center">
                          Affichage des 10 dernières mesures sur {measurements.length}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Aucune mesure enregistrée
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal d'ajout de mesure */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Ajouter une mesure
            </h2>
            <form onSubmit={handleAddMeasurement}>
              <div className="space-y-4">
                <div>
                  <label className="label-custom">Poids (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="input-logo"
                    placeholder="75.5"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-custom">Masse grasse (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-logo"
                    placeholder="18.5"
                    value={formData.body_fat}
                    onChange={(e) => setFormData({ ...formData, body_fat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-custom">Masse musculaire (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-logo"
                    placeholder="35.2"
                    value={formData.muscle_mass}
                    onChange={(e) => setFormData({ ...formData, muscle_mass: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-custom">Notes</label>
                  <textarea
                    className="input-logo"
                    rows="3"
                    placeholder="Commentaires sur la mesure..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="btn-logo flex-1"
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;