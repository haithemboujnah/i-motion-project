import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaCalendar, FaClock, FaUser, 
  FaDumbbell, FaSave, FaTimes, FaSpinner,
  FaCheckCircle, FaInfoCircle, FaPhoneAlt,
  FaEnvelope, FaUserCircle, FaBolt,
  FaWeight, FaHandSparkles, FaUserMd
} from 'react-icons/fa';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import { coachService } from '../../services/coachService';
import toast from 'react-hot-toast';

const CoachSessionCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [adherents, setAdherents] = useState([]);
  const [selectedAdherentDetails, setSelectedAdherentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    adherent_id: '',
    date: '',
    time: '',
    duration: 20, // ✅ Changé de 60 à 20 (durée par défaut des exercices)
    type: 'EMS'
  });

  const sessionTypes = [
    { 
      value: 'EMS', 
      label: 'EMS', 
      icon: FaBolt, 
      color: '#57a1ce',
      bgColor: 'bg-[#57a1ce]/10',
      description: 'Stimulation électrique musculaire',
      exercises: ['Squat EMS', 'Demi-squat EMS', 'Fente EMS', 'Gainage EMS', 'Planche latérale EMS', 'Bird Dog EMS', 'Superman EMS', 'Pont fessier EMS', 'Mountain Climber EMS', 'Crunch EMS', 'Russian Twist EMS', 'Jump Squat EMS']
    },
    { 
      value: 'I-Model', 
      label: 'I-Model', 
      icon: FaWeight, 
      color: '#22c55e',
      bgColor: 'bg-[#22c55e]/10',
      description: 'Renforcement musculaire ciblé',
      exercises: ['Renforcement abdominal', 'Renforcement lombaire', 'Renforcement fessiers', 'Renforcement quadriceps']
    },
    { 
      value: 'I-Shape', 
      label: 'I-Shape', 
      icon: FaHandSparkles, 
      color: '#8b5cf6',
      bgColor: 'bg-[#8b5cf6]/10',
      description: 'Modelage et raffermissement',
      exercises: ['Drainage lymphatique', 'Raffermissement des cuisses', 'Raffermissement des bras', 'Raffermissement des fessiers', 'Réduction de la cellulite']
    },
    { 
      value: 'I-Face', 
      label: 'I-Face', 
      icon: FaUserMd, 
      color: '#ec4899',
      bgColor: 'bg-[#ec4899]/10',
      description: 'Lifting naturel et stimulation faciale',
      exercises: ['Stimulation du collagène', 'Raffermissement du front', 'Tonification des joues', 'Raffermissement du cou']
    }
  ];

  // ✅ Durées disponibles (basées sur les exercices)
  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' }, // ✅ Par défaut
    { value: 25, label: '25 minutes' },
    { value: 30, label: '30 minutes' },
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const adherentId = params.get('adherent');
    if (adherentId) {
      setFormData(prev => ({ ...prev, adherent_id: adherentId }));
    }
  }, [location]);

  useEffect(() => {
    fetchAdherents();
  }, []);

  useEffect(() => {
    if (formData.adherent_id) {
      const adherent = adherents.find(a => a.id === parseInt(formData.adherent_id));
      setSelectedAdherentDetails(adherent || null);
    } else {
      setSelectedAdherentDetails(null);
    }
  }, [formData.adherent_id, adherents]);

  const fetchAdherents = async () => {
    try {
      const response = await coachService.getAdherents();
      setAdherents(response.data.adherents || []);
    } catch (error) {
      console.error('Error fetching adherents:', error);
      toast.error('Erreur lors du chargement des adhérents');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.adherent_id) {
      toast.error('Veuillez sélectionner un adhérent');
      return;
    }
    
    if (!formData.date) {
      toast.error('Veuillez sélectionner une date');
      return;
    }
    
    if (!formData.time) {
      toast.error('Veuillez sélectionner une heure');
      return;
    }
    
    try {
      setLoading(true);
      await coachService.createSession({
        ...formData,
        duration: parseInt(formData.duration)
      });
      toast.success('✅ Séance créée avec succès !');
      navigate('/coach/sessions');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getExercisesCount = (type) => {
    const sessionType = sessionTypes.find(t => t.value === type);
    return sessionType?.exercises?.length || 0;
  };

  // ✅ Obtenir la durée par défaut pour un type
  const getDefaultDurationForType = (type) => {
    // Pour l'EMS, la durée est généralement de 20-25 min
    if (type === 'EMS') return 20;
    // Pour I-Model, I-Shape, I-Face, 20 min
    return 20;
  };

  // ✅ Mettre à jour la durée quand le type change
  const handleTypeChange = (type) => {
    const defaultDuration = getDefaultDurationForType(type);
    setFormData({ 
      ...formData, 
      type: type,
      duration: defaultDuration 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CoachNavbar />
      <div className="flex">
        <CoachSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate('/coach/sessions')}
                className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <FaArrowLeft className="text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
                  📅 Créer une séance
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Planifiez une nouvelle séance pour un adhérent
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sélection de l'adhérent */}
                <div>
                  <label className="label-custom flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <FaUser className="text-[#57a1ce]" />
                    Adhérent
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.adherent_id}
                    onChange={(e) => setFormData({ ...formData, adherent_id: e.target.value })}
                    className="input-logo dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="">Sélectionner un adhérent</option>
                    {adherents.map((adherent) => (
                      <option key={adherent.id} value={adherent.id}>
                        {adherent.first_name} {adherent.last_name} ({adherent.email})
                      </option>
                    ))}
                  </select>
                  
                  {selectedAdherentDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#57a1ce]/20 flex items-center justify-center text-[#57a1ce] text-lg font-bold flex-shrink-0">
                          {selectedAdherentDetails.first_name?.[0]}
                          {selectedAdherentDetails.last_name?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 dark:text-white">
                            {selectedAdherentDetails.first_name} {selectedAdherentDetails.last_name}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <FaEnvelope className="text-xs" />
                              {selectedAdherentDetails.email}
                            </span>
                            {selectedAdherentDetails.level && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-xs">
                                Niveau: {selectedAdherentDetails.level}
                              </span>
                            )}
                            {selectedAdherentDetails.goal && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full text-xs">
                                Objectif: {selectedAdherentDetails.goal}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label-custom flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FaCalendar className="text-[#57a1ce]" />
                      Date
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="input-logo dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {formData.date && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDate(formData.date)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label-custom flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FaClock className="text-[#57a1ce]" />
                      Heure
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="input-logo dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* Durée - avec options adaptées */}
                <div>
                  <label className="label-custom flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <FaClock className="text-[#57a1ce]" />
                    Durée (minutes)
                    <span className="text-xs text-gray-400 font-normal">
                      (par défaut: 20 min)
                    </span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {durationOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, duration: option.value })}
                        className={`p-2 rounded-lg border-2 text-center transition-all duration-200 ${
                          formData.duration === option.value
                            ? 'border-[#57a1ce] bg-[#57a1ce]/10 text-[#57a1ce] font-medium'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="text-sm">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type de séance */}
                <div>
                  <label className="label-custom flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <FaDumbbell className="text-[#57a1ce]" />
                    Type de séance
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {sessionTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.type === type.value;
                      const exercisesCount = getExercisesCount(type.value);
                      
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleTypeChange(type.value)}
                          className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                            isSelected
                              ? `border-[${type.color}] ${type.bgColor} shadow-sm`
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className={`p-2 rounded-lg ${
                                isSelected ? type.bgColor : 'bg-gray-100 dark:bg-gray-700'
                              }`}
                              style={{ color: isSelected ? type.color : '#6b7280' }}
                            >
                              <Icon className="text-2xl" />
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium ${
                                isSelected ? `text-[${type.color}]` : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {type.label}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {type.description}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {exercisesCount} exercices disponibles
                              </p>
                            </div>
                            {isSelected && (
                              <FaCheckCircle className="absolute top-2 right-2 text-[#57a1ce] text-sm" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Résumé */}
                {formData.adherent_id && formData.date && formData.time && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FaInfoCircle className="text-[#57a1ce]" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">Résumé de la séance</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Adhérent:</span>{' '}
                        {selectedAdherentDetails 
                          ? `${selectedAdherentDetails.first_name} ${selectedAdherentDetails.last_name}`
                          : 'Non sélectionné'}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {formatDate(formData.date)}
                      </div>
                      <div>
                        <span className="font-medium">Heure:</span> {formData.time}
                      </div>
                      <div>
                        <span className="font-medium">Durée:</span> {formData.duration} min
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Type:</span>{' '}
                        {sessionTypes.find(t => t.value === formData.type)?.label || formData.type}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Boutons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-logo flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Créer la séance
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/coach/sessions')}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <FaTimes />
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoachSessionCreate;