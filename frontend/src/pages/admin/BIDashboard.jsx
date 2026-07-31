import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, FaUserPlus, FaUserMinus, FaCalendar,
  FaChartLine, FaDollarSign, FaClock, FaStar,
  FaArrowUp, FaArrowDown, FaArrowRight,
  FaSpinner, FaDownload, FaEye, FaChartBar,
  FaCrown, FaFire, FaFilePdf, FaFileCsv,
  FaFilter, FaCalendarAlt, FaSearch,
  FaCheckCircle, FaExclamationTriangle,
  FaInfoCircle, FaPrint, FaShare,
  FaDumbbell // ✅ Ajout de l'import manquant
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
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';

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
  Filler,
  RadialLinearScale
);

const BIDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChart, setSelectedChart] = useState('revenue');
  const [kpiView, setKpiView] = useState('grid');
  const [animateCharts, setAnimateCharts] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await biService.getDashboard();
      setData(response.data);
      setAnimateCharts(true);
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
      
      const rows = [];
      
      // En-têtes
      rows.push(['=== TABLEAU DE BORD I-MOTION ===']);
      rows.push([`Rapport généré le ${new Date().toLocaleString('fr-FR')}`]);
      rows.push([]);
      
      // KPIs
      rows.push(['=== KPIS PRINCIPAUX ===', '']);
      rows.push(['Total adhérents', data.kpis?.total_members || 0]);
      rows.push(['Nouveaux (30j)', data.kpis?.new_members || 0]);
      rows.push(['Adhérents actifs', data.kpis?.active_members || 0]);
      rows.push(['Désabonnements', data.kpis?.churned_members || 0]);
      rows.push(['Total séances', data.kpis?.total_sessions || 0]);
      rows.push(['Séances complétées', data.kpis?.completed_sessions || 0]);
      rows.push(['Durée moyenne (min)', data.kpis?.avg_session_duration || 0]);
      rows.push([]);
      
      // Revenue
      rows.push(['=== CHIFFRE D\'AFFAIRES ===', '']);
      rows.push(['Mois', 'CA (€)', 'Transactions', 'Clients uniques']);
      data?.revenue?.forEach(r => {
        rows.push([
          new Date(r.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          r.revenue || 0,
          r.transactions_count || 0,
          r.unique_customers || 0
        ]);
      });
      rows.push([]);
      
      // Retention
      rows.push(['=== TAUX DE RENOUVELLEMENT ===', '']);
      rows.push(['Mois', 'Total abonnés', 'Renouvelés', 'Taux (%)']);
      data?.retention?.forEach(r => {
        rows.push([
          new Date(r.cohort_month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          r.total_subscribers || 0,
          r.renewed_subscribers || 0,
          r.retention_rate || 0
        ]);
      });
      rows.push([]);
      
      // Satisfaction
      rows.push(['=== SATISFACTION ===', '']);
      rows.push(['Note moyenne', data.satisfaction?.avg_rating || 0]);
      rows.push(['Total avis', data.satisfaction?.total_reviews || 0]);
      rows.push(['Avis positifs', data.satisfaction?.positive_reviews || 0]);
      rows.push(['Avis négatifs', data.satisfaction?.negative_reviews || 0]);
      rows.push([]);
      
      // Prévisions
      rows.push(['=== PRÉVISIONS ===', '']);
      rows.push(['Nouveaux membres prévus', data.forecast?.predicted_next_month_members || 0]);
      rows.push(['CA prévisionnel (€)', data.forecast?.predicted_next_month_revenue || 0]);
      rows.push([]);
      
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
      rows.push([]);
      
      // Heures de pointe
      rows.push(['=== HEURES DE POINTE ===', '']);
      rows.push(['Heure', 'Séances']);
      data?.peakHours?.forEach(p => {
        rows.push([`${p.hour}h`, p.sessions_count || 0]);
      });
      rows.push([]);
      
      // Activité par jour
      rows.push(['=== ACTIVITÉ PAR JOUR ===', '']);
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      data?.weeklyActivity?.forEach(w => {
        rows.push([days[w.day_of_week - 1] || w.day_of_week, w.sessions_count || 0]);
      });

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

  // ✅ Fonction d'exportation PDF
  const exportToPDF = () => {
    try {
      setExporting(true);
      
      const printWindow = window.open('', '_blank', 'width=1200,height=800');
      
      if (!printWindow) {
        toast.error('Veuillez autoriser les pop-ups');
        setExporting(false);
        return;
      }

      const styles = `
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 40px; 
            color: #333;
            background: #f8fafc;
          }
          .header { 
            background: linear-gradient(135deg, #57a1ce, #afadb3);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
          }
          .header h1 { font-size: 32px; margin-bottom: 5px; }
          .header .subtitle { opacity: 0.8; font-size: 14px; }
          .kpi-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 15px; 
            margin-bottom: 30px; 
          }
          .kpi-card { 
            background: white; 
            padding: 20px; 
            border-radius: 12px; 
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          .kpi-value { 
            font-size: 28px; 
            font-weight: bold; 
            color: #57a1ce; 
          }
          .kpi-label { 
            color: #666; 
            font-size: 13px; 
            margin-top: 5px; 
          }
          .section { 
            margin-bottom: 30px;
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 15px; 
            color: #1a1a2e;
            padding-bottom: 8px;
            border-bottom: 2px solid #57a1ce;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 15px;
            font-size: 13px;
          }
          th { 
            background: #f1f5f9; 
            padding: 10px 12px; 
            text-align: left;
            font-weight: 600;
            color: #334155;
          }
          td { 
            padding: 8px 12px; 
            border-bottom: 1px solid #e2e8f0; 
          }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 15px; 
            margin-bottom: 15px;
          }
          .stat-box { 
            background: #f8fafc; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center; 
          }
          .stat-value { 
            font-size: 22px; 
            font-weight: bold; 
          }
          .badge {
            display: inline-block;
            padding: 2px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }
          .badge-success { background: #d4edda; color: #155724; }
          .badge-danger { background: #f8d7da; color: #721c24; }
          .badge-warning { background: #fff3cd; color: #856404; }
          .badge-info { background: #d1ecf1; color: #0c5460; }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            color: #999; 
            font-size: 12px; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 20px; 
          }
          @media print {
            .no-print { display: none; }
          }
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
            <div class="header">
              <h1>📊 Tableau de bord Business Intelligence</h1>
              <div class="subtitle">Rapport généré le ${new Date().toLocaleString('fr-FR')}</div>
            </div>

            <!-- KPIs -->
            <div class="section">
              <div class="section-title">Indicateurs clés de performance</div>
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
                      <td><strong>${r.revenue || 0}</strong></td>
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
                      <td><span class="badge ${r.retention_rate > 70 ? 'badge-success' : r.retention_rate > 50 ? 'badge-warning' : 'badge-danger'}">${r.retention_rate || 0}%</span></td>
                    </tr>
                  `).join('') || '<tr><td colspan="4">Aucune donnée</td></tr>'}
                </tbody>
              </table>
            </div>

            <!-- Distribution -->
            <div class="section">
              <div class="section-title">Distribution</div>
              <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px;">
                <div>
                  <h4 style="margin-bottom:10px; color:#57a1ce;">Types de séances</h4>
                  ${data?.sessionTypes?.map(s => `
                    <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid #f1f5f9;">
                      <span>${s.type}</span>
                      <span style="font-weight:bold;">${s.count}</span>
                    </div>
                  `).join('') || 'Aucune donnée'}
                </div>
                <div>
                  <h4 style="margin-bottom:10px; color:#57a1ce;">Objectifs</h4>
                  ${data?.goalDistribution?.map(g => `
                    <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid #f1f5f9;">
                      <span>${g.goal || 'Non défini'}</span>
                      <span style="font-weight:bold;">${g.count}</span>
                    </div>
                  `).join('') || 'Aucune donnée'}
                </div>
                <div>
                  <h4 style="margin-bottom:10px; color:#57a1ce;">Tranches d'âge</h4>
                  ${data?.ageDistribution?.map(a => `
                    <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid #f1f5f9;">
                      <span>${a.age_group}</span>
                      <span style="font-weight:bold;">${a.count}</span>
                    </div>
                  `).join('') || 'Aucune donnée'}
                </div>
              </div>
            </div>

            <!-- Satisfaction et Prévisions -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
              <div class="section">
                <div class="section-title">⭐ Satisfaction client</div>
                ${data?.satisfaction ? `
                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div class="stat-box">
                      <div class="stat-value" style="color:#57a1ce;">${data.satisfaction.avg_rating || 0}</div>
                      <div style="font-size:13px; color:#666;">Note moyenne</div>
                    </div>
                    <div class="stat-box">
                      <div class="stat-value" style="color:#22c55e;">${data.satisfaction.total_reviews || 0}</div>
                      <div style="font-size:13px; color:#666;">Total avis</div>
                    </div>
                    <div class="stat-box">
                      <div class="stat-value" style="color:#22c55e;">${data.satisfaction.positive_reviews || 0}</div>
                      <div style="font-size:13px; color:#666;">Positifs</div>
                    </div>
                    <div class="stat-box">
                      <div class="stat-value" style="color:#ef4444;">${data.satisfaction.negative_reviews || 0}</div>
                      <div style="font-size:13px; color:#666;">Négatifs</div>
                    </div>
                  </div>
                ` : 'Aucune donnée'}
              </div>

              <div class="section">
                <div class="section-title">🔮 Prévisions</div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                  <div class="stat-box">
                    <div class="stat-value" style="color:#8b5cf6;">${data?.forecast?.predicted_next_month_members || 0}</div>
                    <div style="font-size:13px; color:#666;">Nouveaux membres</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-value" style="color:#57a1ce;">${data?.forecast?.predicted_next_month_revenue || 0} €</div>
                    <div style="font-size:13px; color:#666;">CA prévisionnel</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Revenus par plan -->
            <div class="section">
              <div class="section-title">💰 Revenus par plan</div>
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
                      <td><strong>${p.plan_type}</strong></td>
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
              <br>
              © ${new Date().getFullYear()} I-Motion - Tous droits réservés
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

  // ✅ Configurations des graphiques
  const chartColors = {
    primary: '#57a1ce',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    cyan: '#06b6d4',
    orange: '#f97316',
  };

  const chartOptions = {
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
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
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

  // ✅ Définition de doughnutOptions (CORRIGÉ)
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
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%'
  };

  const revenueChartData = {
    labels: data?.revenue?.map(r => new Date(r.month).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })) || [],
    datasets: [
      {
        label: 'Chiffre d\'affaires (€)',
        data: data?.revenue?.map(r => r.revenue) || [],
        borderColor: chartColors.primary,
        backgroundColor: `rgba(87, 161, 206, 0.1)`,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const retentionChartData = {
    labels: data?.retention?.map(r => new Date(r.cohort_month).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })) || [],
    datasets: [
      {
        label: 'Taux de rétention (%)',
        data: data?.retention?.map(r => r.retention_rate) || [],
        borderColor: chartColors.success,
        backgroundColor: `rgba(34, 197, 94, 0.1)`,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.success,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const peakHoursChartData = {
    labels: data?.peakHours?.map(p => `${p.hour}h`) || [],
    datasets: [
      {
        label: 'Nombre de séances',
        data: data?.peakHours?.map(p => p.sessions_count) || [],
        backgroundColor: `rgba(87, 161, 206, 0.6)`,
        borderColor: chartColors.primary,
        borderWidth: 2,
        borderRadius: 6,
      }
    ]
  };

  const weeklyActivityData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Séances',
        data: data?.weeklyActivity?.map(w => w.sessions_count) || [],
        backgroundColor: `rgba(87, 161, 206, 0.6)`,
        borderColor: chartColors.primary,
        borderWidth: 2,
        borderRadius: 6,
      }
    ]
  };

  const sessionTypesData = {
    labels: data?.sessionTypes?.map(s => s.type) || [],
    datasets: [
      {
        data: data?.sessionTypes?.map(s => s.count) || [],
        backgroundColor: [
          chartColors.primary,
          chartColors.success,
          chartColors.warning,
          chartColors.purple,
          chartColors.danger,
          chartColors.pink,
          chartColors.cyan,
          chartColors.orange
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
          chartColors.primary,
          chartColors.success,
          chartColors.warning,
          chartColors.purple,
          chartColors.danger
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
          chartColors.primary,
          chartColors.success,
          chartColors.warning,
          chartColors.purple,
          chartColors.danger,
          chartColors.pink,
          chartColors.cyan
        ],
        borderWidth: 2,
        borderColor: '#fff',
      }
    ]
  };

  const conversionChartData = {
    labels: data?.conversionRate?.map(c => new Date(c.month).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })) || [],
    datasets: [
      {
        label: 'Taux de conversion (%)',
        data: data?.conversionRate?.map(c => Math.min(c.conversion_rate || 0, 100)) || [],
        borderColor: chartColors.purple,
        backgroundColor: `rgba(139, 92, 246, 0.1)`,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.purple,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const kpis = data?.kpis || {};
  
  const kpiCards = [
    { 
      label: 'Total adhérents', 
      value: kpis.total_members || 0, 
      icon: FaUsers, 
      color: chartColors.primary,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      change: '+12%',
      trend: 'up',
      description: 'Nombre total d\'adhérents actifs'
    },
    { 
      label: 'Nouveaux (30j)', 
      value: kpis.new_members || 0, 
      icon: FaUserPlus, 
      color: chartColors.success,
      bg: 'bg-green-50 dark:bg-green-900/20',
      change: '+8%',
      trend: 'up',
      description: 'Nouveaux adhérents sur 30 jours'
    },
    { 
      label: 'Adhérents actifs', 
      value: kpis.active_members || 0, 
      icon: FaCalendar, 
      color: chartColors.warning,
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      change: '-3%',
      trend: 'down',
      description: 'Adhérents ayant une activité récente'
    },
    { 
      label: 'Désabonnements', 
      value: kpis.churned_members || 0, 
      icon: FaUserMinus, 
      color: chartColors.danger,
      bg: 'bg-red-50 dark:bg-red-900/20',
      change: '+5%',
      trend: 'up',
      description: 'Adhérents désabonnés sur 30 jours'
    }
  ];

  const extraKPIs = [
    { 
      label: 'Séances totales', 
      value: kpis.total_sessions || 0, 
      icon: FaDumbbell, 
      color: chartColors.purple,
      bg: 'bg-purple-50 dark:bg-purple-900/20'
    },
    { 
      label: 'Séances complétées', 
      value: kpis.completed_sessions || 0, 
      icon: FaCheckCircle, 
      color: chartColors.success,
      bg: 'bg-green-50 dark:bg-green-900/20'
    },
    { 
      label: 'Durée moyenne', 
      value: `${kpis.avg_session_duration || 0} min`, 
      icon: FaClock, 
      color: chartColors.warning,
      bg: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    { 
      label: 'Taux de complétion', 
      value: kpis.total_sessions > 0 ? `${Math.round((kpis.completed_sessions / kpis.total_sessions) * 100)}%` : '0%', 
      icon: FaChartLine, 
      color: chartColors.primary,
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <FaChartBar className="text-purple-500" />
                    Tableau de bord BI
                  </h1>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                    v2.0
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-gray-500 dark:text-gray-400">
                    Indicateurs clés et analyses décisionnelles
                  </p>
                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Données en temps réel
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="7days">7 derniers jours</option>
                  <option value="30days">30 derniers jours</option>
                  <option value="90days">90 derniers jours</option>
                  <option value="12months">12 derniers mois</option>
                </select>
                
                {/* Bouton Exporter */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 text-gray-700 dark:text-gray-300"
                  >
                    {exporting ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaDownload className="text-gray-500 dark:text-gray-400" />
                    )}
                    <span className="hidden sm:inline">Exporter</span>
                    <span className="text-xs">▼</span>
                  </button>
                  
                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <button
                        onClick={exportToCSV}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <FaFileCsv className="text-green-500" />
                        <span>Exporter en CSV</span>
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <FaFilePdf className="text-red-500" />
                        <span>Exporter en PDF</span>
                      </button>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={() => window.print()}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <FaPrint className="text-blue-500" />
                        <span>Imprimer</span>
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
                  <span className="hidden sm:inline">Actualiser</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Chargement des données...</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Analyse en cours</p>
              </div>
            ) : (
              <>
                {/* KPIs Principaux */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {kpiCards.map((kpi, index) => {
                    const Icon = kpi.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="group bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                              {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                                kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {kpi.trend === 'up' ? <FaArrowUp className="text-[10px]" /> : <FaArrowDown className="text-[10px]" />}
                                {kpi.change}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{kpi.description}</span>
                            </div>
                          </div>
                          <div className={`p-2.5 rounded-xl ${kpi.bg} group-hover:scale-110 transition-transform`}>
                            <Icon style={{ color: kpi.color }} className="text-xl" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* KPIs Supplémentaires */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {extraKPIs.map((kpi, index) => {
                    const Icon = kpi.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.08 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${kpi.bg}`}>
                            <Icon style={{ color: kpi.color }} className="text-lg" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Graphiques principaux */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Chiffre d'affaires */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaDollarSign className="text-[#57a1ce]" />
                        Chiffre d'affaires
                      </h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {data?.revenue?.length || 0} mois
                      </span>
                    </div>
                    <div className="h-64">
                      <Line data={revenueChartData} options={chartOptions} />
                    </div>
                  </motion.div>

                  {/* Taux de renouvellement */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaChartLine className="text-green-500" />
                        Taux de renouvellement
                      </h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        data?.retention?.[data.retention.length - 1]?.retention_rate > 70 
                          ? 'bg-green-100 text-green-700' 
                          : data?.retention?.[data.retention.length - 1]?.retention_rate > 50 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {data?.retention?.[data.retention.length - 1]?.retention_rate || 0}%
                      </span>
                    </div>
                    <div className="h-64">
                      <Line data={retentionChartData} options={chartOptions} />
                    </div>
                  </motion.div>
                </div>

                {/* Heures de pointe et activité hebdomadaire */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaClock className="text-yellow-500" />
                        Heures de pointe
                      </h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {data?.peakHours?.length || 0} créneaux
                      </span>
                    </div>
                    <div className="h-48">
                      <Bar data={peakHoursChartData} options={chartOptions} />
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaCalendar className="text-purple-500" />
                        Activité par jour
                      </h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        7 jours
                      </span>
                    </div>
                    <div className="h-48">
                      <Bar data={weeklyActivityData} options={chartOptions} />
                    </div>
                  </motion.div>
                </div>

                {/* Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
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
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
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
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
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
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaDollarSign className="text-green-500" />
                        Chiffre d'affaires par plan d'abonnement
                      </h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {data?.revenueByPlan?.length || 0} plans
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {data?.revenueByPlan?.map((plan, index) => (
                        <motion.div 
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{plan.plan_type}</p>
                            <FaCrown className="text-yellow-400" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                            {plan.total_revenue?.toLocaleString()} €
                          </p>
                          <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-gray-500 dark:text-gray-400">{plan.subscriptions_count} abonnés</span>
                            <span className="text-[#57a1ce] font-medium">{plan.avg_amount} €/mois</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Satisfaction et Prévisions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaStar className="text-yellow-400" />
                      Satisfaction client
                    </h3>
                    {data?.satisfaction ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-3xl font-bold text-[#57a1ce]">
                            {data.satisfaction.avg_rating || 0}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Note moyenne</p>
                          <div className="flex justify-center gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className={`text-sm ${i < Math.round(data.satisfaction.avg_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
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
                          <span className="text-xs text-green-500">👍</span>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-3xl font-bold text-red-600">
                            {data.satisfaction.negative_reviews || 0}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Négatifs</p>
                          <span className="text-xs text-red-500">👎</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <FaInfoCircle className="text-4xl mx-auto mb-2" />
                        <p>Aucune donnée de satisfaction</p>
                      </div>
                    )}
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaChartLine className="text-purple-500" />
                      Prévisions
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">Nouveaux membres prévus</span>
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {data?.forecast?.predicted_next_month_members || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">CA prévisionnel</span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {data?.forecast?.predicted_next_month_revenue?.toLocaleString() || 0} €
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">Tendance</span>
                        <span className="text-green-500 font-medium flex items-center gap-1">
                          <FaFire className="text-orange-500" /> 
                          {data?.forecast?.predicted_next_month_revenue > (data?.revenue?.[data.revenue.length - 1]?.revenue || 0) 
                            ? 'En hausse 📈' 
                            : 'Stable 📊'}
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
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaChartLine className="text-purple-500" />
                        Taux de conversion (Nouveaux → Actifs)
                      </h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        data?.conversionRate?.[data.conversionRate.length - 1]?.conversion_rate > 70 
                          ? 'bg-green-100 text-green-700' 
                          : data?.conversionRate?.[data.conversionRate.length - 1]?.conversion_rate > 50 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {data?.conversionRate?.[data.conversionRate.length - 1]?.conversion_rate || 0}%
                      </span>
                    </div>
                    <div className="h-64">
                      <Line data={conversionChartData} options={chartOptions} />
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