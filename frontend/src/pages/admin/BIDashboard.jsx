import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, FaUserPlus, FaUserMinus, FaCalendar,
  FaChartLine, FaDollarSign, FaClock, FaStar,
  FaArrowUp, FaArrowDown,
  FaSpinner, FaDownload, FaEye, FaChartBar,
  FaCrown, FaFire, FaFilePdf, FaFileCsv
} from 'react-icons/fa';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { biService } from '../../services/biService';
import toast from 'react-hot-toast';

// Import Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BIDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await biService.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error('Error fetching BI data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fonction d'exportation CSV
  const exportToCSV = () => {
    if (!data) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      setExporting(true);
      
      // Préparer les données
      const rows = [];
      
      // En-têtes
      rows.push(['Métrique', 'Valeur']);
      
      // KPIs
      rows.push(['=== KPIS PRINCIPAUX ===', '']);
      rows.push(['Total adhérents', data.kpis?.total_members || 0]);
      rows.push(['Nouveaux (30j)', data.kpis?.new_members || 0]);
      rows.push(['Adhérents actifs', data.kpis?.active_members || 0]);
      rows.push(['Désabonnements', data.kpis?.churned_members || 0]);
      rows.push(['Total séances', data.kpis?.total_sessions || 0]);
      rows.push(['Séances complétées', data.kpis?.completed_sessions || 0]);
      rows.push(['Durée moyenne (min)', data.kpis?.avg_session_duration || 0]);
      
      // Revenue
      rows.push(['=== CHIFFRE D\'AFFAIRES ===', '']);
      rows.push(['Mois', 'CA (€)', 'Transactions', 'Clients uniques']);
      data?.revenue?.forEach(r => {
        rows.push([
          new Date(r.month).toLocaleDateString('fr-FR'),
          r.revenue || 0,
          r.transactions_count || 0,
          r.unique_customers || 0
        ]);
      });
      
      // Retention
      rows.push(['=== TAUX DE RENOUVELLEMENT ===', '']);
      rows.push(['Mois', 'Total abonnés', 'Renouvelés', 'Taux (%)']);
      data?.retention?.forEach(r => {
        rows.push([
          new Date(r.cohort_month).toLocaleDateString('fr-FR'),
          r.total_subscribers || 0,
          r.renewed_subscribers || 0,
          r.retention_rate || 0
        ]);
      });
      
      // Satisfaction
      rows.push(['=== SATISFACTION ===', '']);
      rows.push(['Note moyenne', data.satisfaction?.avg_rating || 0]);
      rows.push(['Total avis', data.satisfaction?.total_reviews || 0]);
      rows.push(['Avis positifs', data.satisfaction?.positive_reviews || 0]);
      rows.push(['Avis négatifs', data.satisfaction?.negative_reviews || 0]);
      
      // Prévisions
      rows.push(['=== PRÉVISIONS ===', '']);
      rows.push(['Nouveaux membres prévus', data.forecast?.predicted_next_month_members || 0]);
      rows.push(['CA prévisionnel (€)', data.forecast?.predicted_next_month_revenue || 0]);
      
      // Revenue by Plan
      rows.push(['=== REVENUS PAR PLAN ===', '']);
      rows.push(['Plan', 'Abonnés', 'CA Total (€)', 'Moyenne (€)']);
      data?.revenueByPlan?.forEach(p => {
        rows.push([
          p.plan_type,
          p.subscriptions_count || 0,
          p.total_revenue || 0,
          p.avg_amount || 0
        ]);
      });

      // Générer le CSV
      const csvContent = rows.map(row => row.join(';')).join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard_bi_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Export CSV réussi !');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  // ✅ Fonction d'exportation PDF (via impression)
  const exportToPDF = () => {
    try {
      setExporting(true);
      
      // Créer une version imprimable du dashboard
      const printWindow = window.open('', '_blank', 'width=1200,height=800');
      
      if (!printWindow) {
        toast.error('Veuillez autoriser les pop-ups');
        setExporting(false);
        return;
      }

      const styles = `
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { font-size: 28px; margin-bottom: 10px; color: #1a1a2e; }
          .subtitle { color: #666; margin-bottom: 30px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
          .kpi-card { background: #f8f9fa; padding: 20px; border-radius: 12px; text-align: center; }
          .kpi-value { font-size: 28px; font-weight: bold; color: #57a1ce; }
          .kpi-label { color: #666; font-size: 14px; margin-top: 5px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1a1a2e; border-bottom: 2px solid #57a1ce; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #57a1ce; color: white; padding: 10px; text-align: left; }
          td { padding: 8px 10px; border-bottom: 1px solid #e0e0e0; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
          .stat-box { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #e0e0e0; padding-top: 20px; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-green { background: #d4edda; color: #155724; }
          .badge-red { background: #f8d7da; color: #721c24; }
          .badge-yellow { background: #fff3cd; color: #856404; }
          @media print { .no-print { display: none; } }
        </style>
      `;

      const content = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Dashboard BI - Rapport</title>
            ${styles}
          </head>
          <body>
            <h1>📊 Tableau de bord BI</h1>
            <p class="subtitle">Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>

            <!-- KPIs -->
            <div class="section">
              <div class="section-title">Indicateurs clés</div>
              <div class="kpi-grid">
                <div class="kpi-card">
                  <div class="kpi-value">${data?.kpis?.total_members || 0}</div>
                  <div class="kpi-label">Total adhérents</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-value">${data?.kpis?.new_members || 0}</div>
                  <div class="kpi-label">Nouveaux (30j)</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-value">${data?.kpis?.active_members || 0}</div>
                  <div class="kpi-label">Adhérents actifs</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-value">${data?.kpis?.churned_members || 0}</div>
                  <div class="kpi-label">Désabonnements</div>
                </div>
              </div>
            </div>

            <!-- Chiffre d'affaires -->
            <div class="section">
              <div class="section-title">Chiffre d'affaires</div>
              <table>
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>CA (€)</th>
                    <th>Transactions</th>
                    <th>Clients uniques</th>
                  </tr>
                </thead>
                <tbody>
                  ${data?.revenue?.map(r => `
                    <tr>
                      <td>${new Date(r.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</td>
                      <td>${r.revenue || 0}</td>
                      <td>${r.transactions_count || 0}</td>
                      <td>${r.unique_customers || 0}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="4">Aucune donnée</td></tr>'}
                </tbody>
              </table>
            </div>

            <!-- Taux de renouvellement -->
            <div class="section">
              <div class="section-title">Taux de renouvellement</div>
              <table>
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>Total abonnés</th>
                    <th>Renouvelés</th>
                    <th>Taux (%)</th>
                  </tr>
                </thead>
                <tbody>
                  ${data?.retention?.map(r => `
                    <tr>
                      <td>${new Date(r.cohort_month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</td>
                      <td>${r.total_subscribers || 0}</td>
                      <td>${r.renewed_subscribers || 0}</td>
                      <td><span class="badge ${r.retention_rate > 70 ? 'badge-green' : r.retention_rate > 50 ? 'badge-yellow' : 'badge-red'}">${r.retention_rate || 0}%</span></td>
                    </tr>
                  `).join('') || '<tr><td colspan="4">Aucune donnée</td></tr>'}
                </tbody>
              </table>
            </div>

            <!-- Satisfaction -->
            <div class="section">
              <div class="section-title">Satisfaction client</div>
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-value" style="color: #57a1ce;">${data?.satisfaction?.avg_rating || 0}</div>
                  <div>Note moyenne</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value" style="color: #22c55e;">${data?.satisfaction?.total_reviews || 0}</div>
                  <div>Total avis</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value" style="color: #22c55e;">${data?.satisfaction?.positive_reviews || 0}</div>
                  <div>Avis positifs</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value" style="color: #ef4444;">${data?.satisfaction?.negative_reviews || 0}</div>
                  <div>Avis négatifs</div>
                </div>
              </div>
            </div>

            <!-- Prévisions -->
            <div class="section">
              <div class="section-title">Prévisions</div>
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-value" style="color: #8b5cf6;">${data?.forecast?.predicted_next_month_members || 0}</div>
                  <div>Nouveaux membres prévus</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value" style="color: #57a1ce;">${data?.forecast?.predicted_next_month_revenue || 0} €</div>
                  <div>CA prévisionnel</div>
                </div>
              </div>
            </div>

            <!-- Revenus par plan -->
            <div class="section">
              <div class="section-title">Revenus par plan d'abonnement</div>
              <table>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Abonnés</th>
                    <th>CA Total (€)</th>
                    <th>Moyenne (€)</th>
                  </tr>
                </thead>
                <tbody>
                  ${data?.revenueByPlan?.map(p => `
                    <tr>
                      <td>${p.plan_type}</td>
                      <td>${p.subscriptions_count || 0}</td>
                      <td>${p.total_revenue || 0}</td>
                      <td>${p.avg_amount || 0}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="4">Aucune donnée</td></tr>'}
                </tbody>
              </table>
            </div>

            <div class="footer">
              Rapport généré automatiquement - I-Motion Dashboard BI
            </div>

            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(content);
      printWindow.document.close();

      toast.success('Export PDF lancé !');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  // ✅ Configurations des graphiques (inchangées)
  const revenueChartData = {
    labels: data?.revenue?.map(r => new Date(r.month).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })) || [],
    datasets: [
      {
        label: 'Chiffre d\'affaires (€)',
        data: data?.revenue?.map(r => r.revenue) || [],
        borderColor: '#57a1ce',
        backgroundColor: 'rgba(87, 161, 206, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#57a1ce',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      }
    ]
  };

  const retentionChartData = {
    labels: data?.retention?.map(r => new Date(r.cohort_month).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })) || [],
    datasets: [
      {
        label: 'Taux de rétention (%)',
        data: data?.retention?.map(r => r.retention_rate) || [],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      }
    ]
  };

  const peakHoursChartData = {
    labels: data?.peakHours?.map(p => `${p.hour}h`) || [],
    datasets: [
      {
        label: 'Nombre de séances',
        data: data?.peakHours?.map(p => p.sessions_count) || [],
        backgroundColor: 'rgba(87, 161, 206, 0.6)',
        borderColor: '#57a1ce',
        borderWidth: 2,
        borderRadius: 4,
      }
    ]
  };

  const weeklyActivityData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Séances',
        data: data?.weeklyActivity?.map(w => w.sessions_count) || [],
        backgroundColor: 'rgba(87, 161, 206, 0.6)',
        borderColor: '#57a1ce',
        borderWidth: 2,
        borderRadius: 4,
      }
    ]
  };

  const sessionTypesData = {
    labels: data?.sessionTypes?.map(s => s.type) || [],
    datasets: [
      {
        data: data?.sessionTypes?.map(s => s.count) || [],
        backgroundColor: [
          '#57a1ce', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444',
          '#ec4899', '#14b8a6', '#f97316'
        ],
        borderWidth: 2,
        borderColor: '#fff',
      }
    ]
  };

  const ageDistributionData = {
    labels: data?.ageDistribution?.map(a => a.age_group) || [],
    datasets: [
      {
        data: data?.ageDistribution?.map(a => a.count) || [],
        backgroundColor: [
          '#57a1ce', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'
        ],
        borderWidth: 2,
        borderColor: '#fff',
      }
    ]
  };

  const goalDistributionData = {
    labels: data?.goalDistribution?.map(g => g.goal || 'Non défini') || [],
    datasets: [
      {
        data: data?.goalDistribution?.map(g => g.count) || [],
        backgroundColor: [
          '#57a1ce', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444',
          '#ec4899', '#14b8a6'
        ],
        borderWidth: 2,
        borderColor: '#fff',
      }
    ]
  };

  const kpis = data?.kpis || {};
  const kpiCards = [
    { 
      label: 'Total adhérents', 
      value: kpis.total_members || 0, 
      icon: FaUsers, 
      color: '#57a1ce',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      change: '+12%',
      trend: 'up'
    },
    { 
      label: 'Nouveaux (30j)', 
      value: kpis.new_members || 0, 
      icon: FaUserPlus, 
      color: '#22c55e',
      bg: 'bg-green-50 dark:bg-green-900/20',
      change: '+8%',
      trend: 'up'
    },
    { 
      label: 'Adhérents actifs', 
      value: kpis.active_members || 0, 
      icon: FaCalendar, 
      color: '#f59e0b',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      change: '-3%',
      trend: 'down'
    },
    { 
      label: 'Désabonnements', 
      value: kpis.churned_members || 0, 
      icon: FaUserMinus, 
      color: '#ef4444',
      bg: 'bg-red-50 dark:bg-red-900/20',
      change: '+5%',
      trend: 'up'
    }
  ];

  // ✅ Options des graphiques (inchangées)
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (context.parsed.y !== null) {
              label += `: ${context.parsed.y}`;
              if (context.dataset.label?.includes('€')) {
                label += ' €';
              } else if (context.dataset.label?.includes('%')) {
                label += '%';
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { 
          color: 'rgba(0,0,0,0.05)',
          drawBorder: false,
        },
        ticks: {
          font: { size: 11 }
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11 }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { 
          color: 'rgba(0,0,0,0.05)',
          drawBorder: false,
        },
        ticks: {
          font: { size: 11 }
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11 }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* En-tête avec menu d'exportation */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <FaChartBar className="text-purple-500" />
                  Tableau de bord BI
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Indicateurs clés et analyses décisionnelles
                </p>
              </div>
              <div className="flex gap-3 relative">
                {/* Bouton Exporter avec menu déroulant */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-dark-secondary transition disabled:opacity-50"
                  >
                    {exporting ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaDownload className="text-gray-500" />
                    )}
                    Exporter
                    <span className="text-xs">▼</span>
                  </button>
                  
                  {/* Menu déroulant */}
                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark py-2 z-50">
                      <button
                        onClick={exportToCSV}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-dark-secondary transition flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <FaFileCsv className="text-green-500" />
                        <span>Exporter en CSV</span>
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-dark-secondary transition flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <FaFilePdf className="text-red-500" />
                        <span>Exporter en PDF</span>
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaEye />}
                  Actualiser
                </button>
              </div>
            </div>

            {/* Reste du contenu inchangé... */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="spinner w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Chargement des données...</p>
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {kpiCards.map((kpi, index) => {
                    const Icon = kpi.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                              {kpi.value}
                            </p>
                            <span className={`inline-flex items-center gap-1 text-xs ${
                              kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {kpi.trend === 'up' ? <FaArrowUp className="text-[10px]" /> : <FaArrowDown className="text-[10px]" />}
                              {kpi.change}
                            </span>
                          </div>
                          <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                            <Icon style={{ color: kpi.color }} className="text-xl" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Graphiques principaux - inchangés */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Chiffre d'affaires */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaDollarSign className="text-[#57a1ce]" />
                      Chiffre d'affaires
                    </h3>
                    <div className="h-64">
                      <Line data={revenueChartData} options={lineOptions} />
                    </div>
                  </motion.div>

                  {/* Taux de renouvellement */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaChartLine className="text-green-500" />
                      Taux de renouvellement
                    </h3>
                    <div className="h-64">
                      <Line data={retentionChartData} options={lineOptions} />
                    </div>
                  </motion.div>
                </div>

                {/* Heures de pointe et activité hebdomadaire */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaClock className="text-yellow-500" />
                      Heures de pointe
                    </h3>
                    <div className="h-48">
                      <Bar data={peakHoursChartData} options={barOptions} />
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaCalendar className="text-purple-500" />
                      Activité par jour
                    </h3>
                    <div className="h-48">
                      <Bar data={weeklyActivityData} options={barOptions} />
                    </div>
                  </motion.div>
                </div>

                {/* Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Types de séances
                    </h3>
                    <div className="h-48">
                      <Doughnut data={sessionTypesData} options={doughnutOptions} />
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Répartition par âge
                    </h3>
                    <div className="h-48">
                      <Doughnut data={ageDistributionData} options={doughnutOptions} />
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Objectifs des adhérents
                    </h3>
                    <div className="h-48">
                      <Doughnut data={goalDistributionData} options={doughnutOptions} />
                    </div>
                  </motion.div>
                </div>

                {/* Revenue by Plan */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mb-6"
                >
                  <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaDollarSign className="text-green-500" />
                      Chiffre d'affaires par plan d'abonnement
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {data?.revenueByPlan?.map((plan, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-dark-secondary rounded-lg p-4 border border-gray-100 dark:border-dark hover:shadow-md transition">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{plan.plan_type}</p>
                            <FaCrown className="text-yellow-400" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                            {plan.total_revenue} €
                          </p>
                          <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-200 dark:border-dark">
                            <span className="text-gray-500">{plan.subscriptions_count} abonnés</span>
                            <span className="text-[#57a1ce] font-medium">{plan.avg_amount} €/mois</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Satisfaction et Prévisions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaStar className="text-yellow-400" />
                      Satisfaction client
                    </h3>
                    {data?.satisfaction && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                          <p className="text-3xl font-bold text-[#57a1ce]">
                            {data.satisfaction.avg_rating || 0}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Note moyenne</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                          <p className="text-3xl font-bold text-green-500">
                            {data.satisfaction.total_reviews || 0}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total avis</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-3xl font-bold text-green-600">
                            {data.satisfaction.positive_reviews || 0}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Positifs</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-3xl font-bold text-red-600">
                            {data.satisfaction.negative_reviews || 0}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Négatifs</p>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaChartLine className="text-purple-500" />
                      Prévisions
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">Nouveaux membres prévus</span>
                        <span className="text-2xl font-bold text-purple-600">
                          {data?.forecast?.predicted_next_month_members || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">CA prévisionnel</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {data?.forecast?.predicted_next_month_revenue || 0} €
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">Tendance</span>
                        <span className="text-green-500 font-medium flex items-center gap-1">
                          <FaFire className="text-orange-500" /> En hausse
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Conversion Rate */}
                {data?.conversionRate && data.conversionRate.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 bg-white dark:bg-dark-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-dark"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaChartLine className="text-purple-500" />
                      Taux de conversion (Nouveaux → Actifs)
                    </h3>
                    <div className="h-64">
                      <Line 
                        data={{
                          labels: data?.conversionRate?.map(c => new Date(c.month).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })) || [],
                          datasets: [
                            {
                              label: 'Taux de conversion (%)',
                              data: data?.conversionRate?.map(c => c.conversion_rate) || [],
                              borderColor: '#8b5cf6',
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              fill: true,
                              tension: 0.4,
                              pointBackgroundColor: '#8b5cf6',
                              pointBorderColor: '#fff',
                              pointBorderWidth: 2,
                              pointRadius: 4,
                            }
                          ]
                        }}
                        options={lineOptions}
                      />
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BIDashboard;