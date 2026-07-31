import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUser, FaEnvelope, FaLock, FaCalendar, 
  FaWeight, FaRuler, FaEdit, FaSave,
  FaDumbbell, FaChartLine, FaHeart, FaUsers,
  FaExclamationTriangle, FaShieldAlt, FaFire,
  FaStar, FaBrain, FaMagic, FaInfoCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

// Importer les bons composants selon le rôle
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { authService } from '../../services/authService';

const Profile = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user, profile, updateProfile, changePassword, setProfile, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    age: '',
    weight: '',
    height: '',
    body_fat: '',
    muscle_mass: '',
    goal: 'remise_en_forme',
    level: 'debutant',
    medical_conditions: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState('');

  // ✅ Updated goals with 6 options
  const goals = [
    { value: 'perte_de_poids', label: 'Perte de poids', icon: '🔥', color: '#ef4444', description: 'Brûlez des calories et perdez du poids' },
    { value: 'prise_de_masse', label: 'Prise de masse musculaire', icon: '💪', color: '#22c55e', description: 'Développez votre masse musculaire' },
    { value: 'remise_en_forme', label: 'Remise en forme', icon: '❤️', color: '#57a1ce', description: 'Améliorez votre condition physique' },
    { value: 'modelage_raffermissement', label: 'Modelage & Raffermissement', icon: '⭐', color: '#ec4899', description: 'Sculptez votre silhouette' },
    { value: 'recuperation_bien_etre', label: 'Récupération & Bien-être', icon: '🧘', color: '#8b5cf6', description: 'Retrouvez votre tonicité' },
    { value: 'lifting_naturel', label: 'Lifting naturel & Anti-âge', icon: '✨', color: '#f59e0b', description: 'Raffermissez votre visage' }
  ];

  const levels = [
    { value: 'debutant', label: 'Débutant', description: 'Pour commencer en douceur' },
    { value: 'intermediaire', label: 'Intermédiaire', description: 'Pour ceux qui ont déjà de l\'expérience' },
    { value: 'avance', label: 'Avancé', description: 'Pour les sportifs confirmés' }
  ];

  // Déterminer le rôle de l'utilisateur
  const userRole = user?.role || 'adherent';
  const isCoach = userRole === 'coach';
  const isAdmin = userRole === 'admin';

  // ✅ Calculate BMI
  const calculateBMI = (weight, height) => {
    if (!weight || !height || height <= 0) return null;
    const heightInMeters = height / 100;
    const bmiValue = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmiValue.toFixed(2));
  };

  // ✅ Get BMI category
  const getBMICategory = (bmiValue) => {
    if (!bmiValue) return '';
    if (bmiValue < 16.5) return 'Dénutrition';
    if (bmiValue < 18.5) return 'Insuffisance pondérale';
    if (bmiValue < 25) return 'Poids normal';
    if (bmiValue < 30) return 'Surpoids';
    if (bmiValue < 35) return 'Obésité modérée';
    if (bmiValue < 40) return 'Obésité sévère';
    return 'Obésité morbide';
  };

  // ✅ Get BMI color
  const getBMIColor = (bmiValue) => {
    if (!bmiValue) return 'text-gray-400';
    if (bmiValue < 18.5) return 'text-yellow-500';
    if (bmiValue < 25) return 'text-green-500';
    if (bmiValue < 30) return 'text-orange-500';
    return 'text-red-500';
  };

  // ✅ Get goal label
  const getGoalLabel = (goalValue) => {
    const labels = {
      'perte_de_poids': 'Perte de poids',
      'prise_de_masse': 'Prise de masse musculaire',
      'remise_en_forme': 'Remise en forme',
      'modelage_raffermissement': 'Modelage & Raffermissement',
      'recuperation_bien_etre': 'Récupération & Bien-être',
      'lifting_naturel': 'Lifting naturel & Anti-âge'
    };
    return labels[goalValue] || goalValue;
  };

  // ✅ Get level label
  const getLevelLabel = (levelValue) => {
    const labels = {
      'debutant': 'Débutant',
      'intermediaire': 'Intermédiaire',
      'avance': 'Avancé'
    };
    return labels[levelValue] || levelValue;
  };

  const refreshProfile = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.data) {
        if (response.data.user) {
          const updatedUser = response.data.user;
          setUser(updatedUser);
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const newUser = { ...storedUser, ...updatedUser };
          localStorage.setItem('user', JSON.stringify(newUser));
        }
        if (response.data.profile) {
          setProfile(response.data.profile);
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  useEffect(() => {
    if (user && profile) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        age: profile?.age || '',
        weight: profile?.weight || '',
        height: profile?.height || '',
        body_fat: profile?.body_fat || '',
        muscle_mass: profile?.muscle_mass || '',
        goal: profile?.goal || 'remise_en_forme',
        level: profile?.level || 'debutant',
        medical_conditions: profile?.medical_conditions || ''
      });

      // ✅ Calculate BMI
      if (profile?.weight && profile?.height) {
        const bmiValue = calculateBMI(profile.weight, profile.height);
        setBmi(bmiValue);
        setBmiCategory(getBMICategory(bmiValue));
      }
    }
  }, [user, profile, refreshKey]);

  // ✅ Update BMI when weight or height changes
  useEffect(() => {
    if (formData.weight && formData.height) {
      const bmiValue = calculateBMI(
        parseFloat(formData.weight), 
        parseFloat(formData.height)
      );
      setBmi(bmiValue);
      setBmiCategory(getBMICategory(bmiValue));
    }
  }, [formData.weight, formData.height]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        age: parseInt(formData.age) || null,
        weight: parseFloat(formData.weight) || null,
        height: parseFloat(formData.height) || null,
        body_fat: parseFloat(formData.body_fat) || null,
        muscle_mass: parseFloat(formData.muscle_mass) || null,
        goal: formData.goal,
        level: formData.level,
        medical_conditions: formData.medical_conditions
      });

      if (result.success) {
        toast.success('Profil mis à jour avec succès !');
        setIsEditing(false);
        await refreshProfile();
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setLoading(true);
    try {
      const result = await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      if (result.success) {
        toast.success('Mot de passe modifié avec succès !');
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setShowPasswordForm(false);
      } else {
        toast.error(result.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get goal icon
  const getGoalIcon = (goalValue) => {
    const goal = goals.find(g => g.value === goalValue);
    return goal ? goal.icon : '🎯';
  };

  // ✅ Get goal color
  const getGoalColor = (goalValue) => {
    const goal = goals.find(g => g.value === goalValue);
    return goal ? goal.color : '#57a1ce';
  };

  const getNavComponent = () => {
    if (isAdmin) return AdminNavbar;
    if (isCoach) return CoachNavbar;
    return Navbar;
  };

  const getSidebarComponent = () => {
    if (isAdmin) return AdminSidebar;
    if (isCoach) return CoachSidebar;
    return Sidebar;
  };

  const NavComponent = getNavComponent();
  const SidebarComponent = getSidebarComponent();

  const getRoleBadge = () => {
    if (isAdmin) {
      return { label: 'Administrateur', className: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' };
    }
    if (isCoach) {
      return { label: 'Coach', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' };
    }
    return { label: 'Adhérent', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' };
  };

  const roleBadge = getRoleBadge();

  if (!user) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <NavComponent />
      <div className="flex">
        <SidebarComponent />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-display font-bold text-theme-primary mb-6 flex items-center gap-3 flex-wrap">
              <FaUser className="text-[#57a1ce]" />
              Mon Profil
              {isAdmin && (
                <span className="ml-2 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full flex items-center gap-1">
                  <FaShieldAlt className="text-xs" />
                  Administrateur
                </span>
              )}
              {isCoach && (
                <span className="ml-2 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                  Coach
                </span>
              )}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Carte d'identité */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-1"
              >
                <div className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme text-center">
                  <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-white text-4xl font-bold ${
                    isAdmin ? 'bg-gradient-to-r from-indigo-600 to-purple-600' :
                    isCoach ? 'bg-gradient-to-r from-[#57a1ce] to-[#3d7fa8]' :
                    'bg-gradient-to-r from-[#57a1ce] to-[#afadb3]'
                  }`}>
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <h2 className="text-xl font-semibold text-theme-primary mt-4">
                    {user?.first_name} {user?.last_name}
                  </h2>
                  <p className="text-theme-secondary">{user?.email}</p>
                  <div className="mt-4 flex justify-center gap-2 flex-wrap">
                    <span className={`badge ${roleBadge.className}`}>
                      {roleBadge.label}
                    </span>
                    {profile?.level && !isAdmin && (
                      <span className="badge-info">{profile.level}</span>
                    )}
                    {profile?.goal && !isAdmin && (
                      <span className="badge" style={{
                        background: `${getGoalColor(profile.goal)}20`,
                        color: getGoalColor(profile.goal)
                      }}>
                        {getGoalIcon(profile.goal)} {profile.goal}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-theme-muted mt-4">
                    Membre depuis {new Date(user?.created_at).toLocaleDateString('fr-FR')}
                  </p>

                  {profile && (
                    <div className="mt-4 p-3 bg-theme-secondary rounded-lg text-left text-sm border border-theme">
                      <p className="text-xs text-theme-muted font-medium mb-2">📊 Données actuelles</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {profile.age && (
                          <>
                            <span className="text-theme-muted">Âge:</span>
                            <span className="font-medium text-theme-primary">{profile.age} ans</span>
                          </>
                        )}
                        {profile.weight && (
                          <>
                            <span className="text-theme-muted">Poids:</span>
                            <span className="font-medium text-theme-primary">{profile.weight} kg</span>
                          </>
                        )}
                        {profile.height && (
                          <>
                            <span className="text-theme-muted">Taille:</span>
                            <span className="font-medium text-theme-primary">{profile.height} cm</span>
                          </>
                        )}
                        {bmi && (
                          <>
                            <span className="text-theme-muted">IMC:</span>
                            <span className={`font-medium ${getBMIColor(bmi)}`}>
                              {bmi} ({bmiCategory})
                            </span>
                          </>
                        )}
                        {profile.body_fat !== null && profile.body_fat !== undefined && (
                          <>
                            <span className="text-theme-muted">Masse grasse:</span>
                            <span className="font-medium text-theme-primary">{profile.body_fat}%</span>
                          </>
                        )}
                        {profile.muscle_mass !== null && profile.muscle_mass !== undefined && (
                          <>
                            <span className="text-theme-muted">Masse musculaire:</span>
                            <span className="font-medium text-theme-primary">{profile.muscle_mass} kg</span>
                          </>
                        )}
                        {profile.goal && (
                          <>
                            <span className="text-theme-muted">Objectif:</span>
                            <span className="font-medium" style={{ color: getGoalColor(profile.goal) }}>
                              {getGoalLabel(profile.goal)}
                            </span>
                          </>
                        )}
                        {profile.level && (
                          <>
                            <span className="text-theme-muted">Niveau:</span>
                            <span className="font-medium text-theme-primary">{getLevelLabel(profile.level)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {isCoach && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                        <FaUsers />
                        Espace Coach - Gestion des adhérents
                      </p>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2">
                        <FaShieldAlt />
                        Accès administrateur complet
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Formulaire profil */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2"
              >
                <div className="bg-theme-card rounded-xl p-6 shadow-sm border border-theme">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-theme-primary">
                      Informations personnelles
                    </h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`transition flex items-center gap-2 ${
                        isEditing 
                          ? 'text-green-600 hover:text-green-700' 
                          : 'text-[#57a1ce] hover:text-[#3d7fa8]'
                      }`}
                      disabled={loading}
                    >
                      {isEditing ? <FaSave /> : <FaEdit />}
                      {isEditing ? 'Enregistrer' : 'Modifier'}
                    </button>
                  </div>

                  <form onSubmit={handleUpdateProfile}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label-custom text-theme-primary">Prénom</label>
                        <input
                          type="text"
                          className={`input-logo ${!isEditing ? 'bg-theme-secondary' : ''}`}
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="label-custom text-theme-primary">Nom</label>
                        <input
                          type="text"
                          className={`input-logo ${!isEditing ? 'bg-theme-secondary' : ''}`}
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="label-custom text-theme-primary">Email</label>
                      <input
                        type="email"
                        className="input-logo bg-theme-secondary"
                        value={formData.email}
                        disabled
                      />
                      <p className="text-xs text-theme-muted mt-1">L'email ne peut pas être modifié</p>
                    </div>

                    {!isAdmin && (
                      <>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <label className="label-custom text-theme-primary">Âge</label>
                            <input
                              type="number"
                              className={`input-logo ${!isEditing ? 'bg-theme-secondary' : ''}`}
                              value={formData.age}
                              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <label className="label-custom text-theme-primary">Poids (kg)</label>
                            <input
                              type="number"
                              step="0.1"
                              className={`input-logo ${!isEditing ? 'bg-theme-secondary' : ''}`}
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <label className="label-custom text-theme-primary">Taille (cm)</label>
                            <input
                              type="number"
                              className={`input-logo ${!isEditing ? 'bg-theme-secondary' : ''}`}
                              value={formData.height}
                              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>

                        {/* ✅ New fields: Body Fat & Muscle Mass */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="label-custom text-theme-primary flex items-center gap-2">
                              <FaFire className="text-orange-500" />
                              Masse grasse (%)
                              <span className="text-xs text-theme-muted font-normal">
                                (optionnel)
                              </span>
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="3"
                              max="60"
                              className={`input-logo ${!isEditing ? 'bg-theme-secondary' : ''}`}
                              value={formData.body_fat}
                              onChange={(e) => setFormData({ ...formData, body_fat: e.target.value })}
                              disabled={!isEditing}
                              placeholder="Ex: 15"
                            />
                          </div>
                          <div>
                            <label className="label-custom text-theme-primary flex items-center gap-2">
                              <FaDumbbell className="text-green-500" />
                              Masse musculaire (kg)
                              <span className="text-xs text-theme-muted font-normal">
                                (optionnel)
                              </span>
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="15"
                              max="70"
                              className={`input-logo ${!isEditing ? 'bg-theme-secondary' : ''}`}
                              value={formData.muscle_mass}
                              onChange={(e) => setFormData({ ...formData, muscle_mass: e.target.value })}
                              disabled={!isEditing}
                              placeholder="Ex: 35"
                            />
                          </div>
                        </div>

                        {/* ✅ BMI Display */}
                        {bmi && (
                          <div className="mt-4 p-3 bg-theme-secondary rounded-lg border border-theme">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-theme-primary">
                                📊 Indice de Masse Corporelle (IMC)
                              </span>
                              <span className={`font-bold ${getBMIColor(bmi)}`}>
                                {bmi} - {bmiCategory}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  bmi < 18.5 ? 'bg-yellow-500' :
                                  bmi < 25 ? 'bg-green-500' :
                                  bmi < 30 ? 'bg-orange-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.min((bmi / 40) * 100, 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-theme-muted mt-1">
                              <span>16.5</span>
                              <span>25</span>
                              <span>30</span>
                              <span>40</span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="label-custom text-theme-primary">Objectif</label>
                            <select
                              className={`input-logo ${!isEditing ? 'bg-theme-secondary' : ''}`}
                              value={formData.goal}
                              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                              disabled={!isEditing}
                            >
                              {goals.map((goal) => (
                                <option key={goal.value} value={goal.value}>
                                  {goal.icon} {goal.label}
                                </option>
                              ))}
                            </select>
                            {formData.goal && (
                              <p className="text-xs text-theme-muted mt-1">
                                {goals.find(g => g.value === formData.goal)?.description}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="label-custom text-theme-primary">Niveau</label>
                            <select
                              className={`input-logo ${!isEditing ? 'bg-theme-secondary' : ''}`}
                              value={formData.level}
                              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                              disabled={!isEditing}
                            >
                              {levels.map((level) => (
                                <option key={level.value} value={level.value}>
                                  {level.label}
                                </option>
                              ))}
                            </select>
                            {formData.level && (
                              <p className="text-xs text-theme-muted mt-1">
                                {levels.find(l => l.value === formData.level)?.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="label-custom text-theme-primary">Conditions médicales</label>
                          <textarea
                            className={`input-logo ${!isEditing ? 'bg-theme-secondary' : ''}`}
                            rows="2"
                            value={formData.medical_conditions}
                            onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                            disabled={!isEditing}
                            placeholder="Aucune"
                          />
                        </div>
                      </>
                    )}

                    {isEditing && (
                      <button 
                        type="submit" 
                        className={`btn-logo w-full mt-4 ${
                          isAdmin ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                        }`} 
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white"></div>
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <FaSave className="inline mr-2" />
                            Enregistrer les modifications
                          </>
                        )}
                      </button>
                    )}
                  </form>

                  {/* Changement de mot de passe */}
                  <div className="mt-6 pt-6 border-t border-theme">
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className={`transition flex items-center gap-2 ${
                        isAdmin ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700' : 'text-[#57a1ce] hover:text-[#3d7fa8]'
                      }`}
                    >
                      <FaLock />
                      Changer le mot de passe
                    </button>

                    {showPasswordForm && (
                      <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                        <div>
                          <label className="label-custom text-theme-primary">Mot de passe actuel</label>
                          <input
                            type="password"
                            className="input-logo"
                            value={passwordData.current_password}
                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="label-custom text-theme-primary">Nouveau mot de passe</label>
                          <input
                            type="password"
                            className="input-logo"
                            value={passwordData.new_password}
                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                            required
                            minLength="8"
                          />
                          <p className="text-xs text-theme-muted mt-1">Minimum 8 caractères</p>
                        </div>
                        <div>
                          <label className="label-custom text-theme-primary">Confirmer le mot de passe</label>
                          <input
                            type="password"
                            className="input-logo"
                            value={passwordData.confirm_password}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                            required
                          />
                        </div>
                        <div className="flex gap-3">
                          <button 
                            type="submit" 
                            className={`btn-logo flex-1 ${
                              isAdmin ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                            }`} 
                            disabled={loading}
                          >
                            {loading ? 'Chargement...' : 'Changer le mot de passe'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPasswordForm(false)}
                            className="btn-secondary flex-1"
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;