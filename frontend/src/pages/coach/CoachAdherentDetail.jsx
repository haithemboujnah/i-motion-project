import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaUser, FaCalendar, FaChartLine,
  FaTrophy, FaDumbbell, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaFilePdf, FaEnvelope,
  FaHistory, FaBell, FaEye, FaEyeSlash, FaRobot
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import { coachService } from '../../services/coachService';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const CoachAdherentDetail = () => {
  const { isDark } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [adherent, setAdherent] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [churnData, setChurnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchAdherentDetail();
  }, [id]);

  const fetchAdherentDetail = async () => {
    try {
      setLoading(true);
      const [detailRes, recRes, alertRes] = await Promise.all([
        coachService.getAdherentDetail(id),
        coachService.getRecommendations(id),
        coachService.getAlertHistory(id)
      ]);
      
      setAdherent(detailRes.data.adherent);
      setRecommendations(recRes.data.recommendations || []);
      setAlertHistory(alertRes.data.alerts || []);
      
      try {
        const churnResponse = await coachService.getChurnAnalysis();
        
        if (churnResponse.success) {
          const predictions = churnResponse.data.predictions || [];
          const userChurn = predictions.find(p => p.user_id === parseInt(id));
          
          if (userChurn) {
            setChurnData({
              risk_score: userChurn.risk_score || 0,
              risk_level: userChurn.risk_level || 'Safe',
              factors: userChurn.factors || {}
            });
          } else {
            const adherentChurn = churnResponse.data.adherents?.find(a => a.id === parseInt(id));
            if (adherentChurn && adherentChurn.churn) {
              setChurnData({
                risk_score: adherentChurn.churn.risk_score || 0,
                risk_level: adherentChurn.churn.risk_level || 'Safe',
                factors: adherentChurn.churn.factors || {}
              });
            }
          }
        }
      } catch (churnError) {
        console.error('❌ Erreur récupération churn:', churnError);
      }
      
    } catch (error) {
      console.error('Error fetching adherent detail:', error);
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    const colors = {
      'Critique': 'text-red-600 bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400',
      'Élevé': 'text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/30 dark:text-orange-400',
      'Moyen': 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/30 dark:text-yellow-400',
      'Faible': 'text-green-600 bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800/30 dark:text-green-400',
      'Safe': 'text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30 dark:text-blue-400'
    };
    return colors[riskLevel] || 'text-gray-600 bg-gray-100 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700 dark:text-gray-400';
  };

  const getRiskIcon = (riskLevel) => {
    const icons = {
      'Critique': '🔴',
      'Élevé': '🟠',
      'Moyen': '🟡',
      'Faible': '🟢',
      'Safe': '🟢'
    };
    return icons[riskLevel] || '⚪';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-secondary">
        <CoachNavbar />
        <div className="flex">
          <CoachSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="spinner"></div>
          </main>
        </div>
      </div>
    );
  }

  if (!adherent) {
    return (
      <div className="min-h-screen bg-theme-secondary">
        <CoachNavbar />
        <div className="flex">
          <CoachSidebar />
          <main className="flex-1 p-6">
            <div className="text-center py-12">
              <p className="text-theme-secondary">Adhérent non trouvé</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const attendanceRate = adherent.total_sessions > 0 
    ? Math.round((adherent.completed_sessions / adherent.total_sessions) * 100) 
    : 0;

  const tabs = [
    { id: 'info', label: 'Informations', icon: FaUser },
    { id: 'alerts', label: 'Alertes', icon: FaBell, count: alertHistory.length },
    { id: 'recommendations', label: 'Recommandations', icon: FaDumbbell }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <CoachNavbar />
      <div className="flex">
        <CoachSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate('/coach/adherents')}
                className="p-2 rounded-xl hover:bg-theme-hover transition"
              >
                <FaArrowLeft className="text-theme-secondary" />
              </button>
              <h1 className="text-3xl font-display font-bold text-theme-primary">
                Profil Adhérent
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Carte d'identité */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme"
              >
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-[#57a1ce]/20 dark:bg-[#57a1ce]/30 flex items-center justify-center text-[#57a1ce] text-3xl font-bold">
                    {adherent.first_name?.[0]}{adherent.last_name?.[0]}
                  </div>
                  <h2 className="text-xl font-semibold text-theme-primary mt-4">
                    {adherent.first_name} {adherent.last_name}
                  </h2>
                  <p className="text-theme-secondary">{adherent.email}</p>
                  <div className="flex justify-center gap-2 mt-2">
                    <span className="badge-primary">{adherent.level || 'Niveau non défini'}</span>
                    <span className="badge-info">{adherent.goal || 'Objectif non défini'}</span>
                  </div>
                  <p className="text-xs text-theme-muted mt-4">
                    Membre depuis {new Date(adherent.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-theme">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold text-[#57a1ce]">{adherent.total_sessions || 0}</p>
                      <p className="text-xs text-theme-secondary">Séances</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500">{attendanceRate}%</p>
                      <p className="text-xs text-theme-secondary">Assiduité</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-500">{adherent.total_points || 0}</p>
                      <p className="text-xs text-theme-secondary">Points</p>
                    </div>
                  </div>
                </div>

                {/* Section Churn */}
                {churnData && (
                  <div className="mt-4 p-3 rounded-lg border border-purple-200 dark:border-purple-800/30 bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex items-center gap-2 mb-1">
                      <FaRobot className="text-purple-500 dark:text-purple-400" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Prédiction IA</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getRiskIcon(churnData.risk_level)}</span>
                        <span className={`badge ${getRiskColor(churnData.risk_level)} text-xs`}>
                          {churnData.risk_level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div 
                            className={`h-1.5 rounded-full ${
                              churnData.risk_score >= 80 ? 'bg-red-500' :
                              churnData.risk_score >= 60 ? 'bg-orange-500' :
                              churnData.risk_score >= 40 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(churnData.risk_score, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-theme-primary">{Math.round(churnData.risk_score)}%</span>
                      </div>
                    </div>
                    {churnData.factors && Object.keys(churnData.factors).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-purple-100 dark:border-purple-800/30">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Facteurs de risque :</p>
                        <ul className="text-xs text-purple-500 dark:text-purple-400 mt-1 space-y-0.5">
                          {Object.values(churnData.factors).map((factor, idx) => (
                            <li key={idx} className="flex items-center gap-1">
                              <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <button 
                    className="w-full btn-logo text-sm"
                    onClick={() => navigate(`/coach/sessions/create?adherent=${adherent.id}`)}
                  >
                    <FaCalendar className="inline mr-2" />
                    Créer une séance
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    <FaEnvelope className="inline mr-2" />
                    Contacter
                  </button>
                </div>
              </motion.div>

              {/* Détails et onglets */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2 space-y-6"
              >
                <div className="flex gap-2 border-b border-theme">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                          isActive
                            ? 'border-[#57a1ce] text-[#57a1ce]'
                            : 'border-transparent text-theme-secondary hover:text-theme-primary'
                        }`}
                      >
                        <Icon className="text-sm" />
                        <span className="text-sm font-medium">{tab.label}</span>
                        {tab.count > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-[#57a1ce] text-white' : 'bg-theme-secondary text-theme-secondary'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme">
                  {activeTab === 'info' && (
                    <div>
                      <h3 className="text-lg font-semibold text-theme-primary mb-4">
                        📋 Informations
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-theme-secondary">Âge</p>
                          <p className="font-medium text-theme-primary">{adherent.age || 'Non renseigné'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-theme-secondary">Poids</p>
                          <p className="font-medium text-theme-primary">{adherent.weight ? `${adherent.weight} kg` : 'Non renseigné'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-theme-secondary">Taille</p>
                          <p className="font-medium text-theme-primary">{adherent.height ? `${adherent.height} cm` : 'Non renseigné'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-theme-secondary">Niveau</p>
                          <p className="font-medium text-theme-primary">{adherent.level || 'Non défini'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-theme-secondary">Objectif</p>
                          <p className="font-medium text-theme-primary">{adherent.goal || 'Non défini'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-theme-secondary">Badges</p>
                          <p className="font-medium text-theme-primary">{adherent.badges_count || 0}</p>
                        </div>
                      </div>
                      {adherent.medical_conditions && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Conditions médicales :</span> {adherent.medical_conditions}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'alerts' && (
                    <div>
                      <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
                        <FaBell className="text-[#57a1ce]" />
                        Historique des alertes
                        <span className="text-sm font-normal text-theme-muted">
                          ({alertHistory.length} alertes)
                        </span>
                      </h3>
                      {alertHistory.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {alertHistory.map((alert) => (
                            <div 
                              key={alert.id}
                              className={`p-4 rounded-lg border ${
                                alert.risk_level === 'Critique' 
                                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30' 
                                  : alert.risk_level === 'Élevé'
                                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30'
                                  : alert.risk_level === 'Moyen'
                                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30'
                                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{getRiskIcon(alert.risk_level)}</span>
                                  <div>
                                    <p className="font-medium text-theme-primary">
                                      Risque {alert.risk_level}
                                    </p>
                                    <p className="text-sm text-theme-secondary">{alert.message}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`badge ${getRiskColor(alert.risk_level)}`}>
                                    Score: {alert.risk_score}%
                                  </span>
                                  <p className="text-xs text-theme-muted mt-1">
                                    {new Date(alert.created_at).toLocaleString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                              {!alert.is_read && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                  <span className="text-xs text-red-500 dark:text-red-400">Non lue</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-2" />
                          <p className="text-theme-secondary">Aucune alerte pour cet adhérent</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'recommendations' && (
                    <div>
                      <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
                        <FaDumbbell className="text-[#57a1ce]" />
                        Recommandations personnalisées
                      </h3>
                      {recommendations.length > 0 ? (
                        <div className="space-y-3">
                          {recommendations.map((rec, index) => (
                            <div 
                              key={index}
                              className={`p-4 rounded-lg border ${
                                rec.priority === 'high' 
                                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30' 
                                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {rec.priority === 'high' ? (
                                  <FaExclamationTriangle className="text-red-500 mt-1" />
                                ) : (
                                  <FaCheckCircle className="text-blue-500 mt-1" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-theme-primary">
                                    {rec.message}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className={`badge ${
                                      rec.priority === 'high' ? 'badge-danger' : 'badge-info'
                                    }`}>
                                      Priorité {rec.priority === 'high' ? 'Élevée' : 'Moyenne'}
                                    </span>
                                    <span className="text-xs text-theme-muted">
                                      Type: {rec.type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-2" />
                          <p className="text-theme-secondary">Aucune recommandation pour le moment</p>
                          <p className="text-sm text-theme-muted">L'adhérent est sur la bonne voie !</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoachAdherentDetail;