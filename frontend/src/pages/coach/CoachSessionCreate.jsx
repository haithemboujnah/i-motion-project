import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaCalendar, FaClock, FaUser, 
  FaDumbbell, FaSave, FaTimes 
} from 'react-icons/fa';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import { coachService } from '../../services/coachService';
import toast from 'react-hot-toast';

const CoachSessionCreate = () => {
  const navigate = useNavigate();
  const [adherents, setAdherents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    adherent_id: '',
    date: '',
    time: '',
    duration: 60,
    type: 'EMS'
  });

  const sessionTypes = [
    { value: 'EMS', label: 'EMS', icon: '⚡' },
    { value: 'Cardio', label: 'Cardio', icon: '🏃' },
    { value: 'Musculation', label: 'Musculation', icon: '💪' },
    { value: 'HIIT', label: 'HIIT', icon: '🔥' },
    { value: 'Yoga', label: 'Yoga', icon: '🧘' },
    { value: 'Pilates', label: 'Pilates', icon: '🧘‍♀️' }
  ];

  useEffect(() => {
    fetchAdherents();
  }, []);

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
      toast.success('Séance créée avec succès !');
      navigate('/coach/sessions');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNavbar />
      <div className="flex">
        <CoachSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate('/coach/sessions')}
                className="p-2 rounded-xl hover:bg-gray-200 transition"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <h1 className="text-3xl font-display font-bold text-gray-900">
                📅 Créer une séance
              </h1>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 shadow-sm"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sélection de l'adhérent */}
                <div>
                  <label className="label-custom flex items-center gap-2">
                    <FaUser className="text-[#57a1ce]" />
                    Adhérent
                  </label>
                  <select
                    value={formData.adherent_id}
                    onChange={(e) => setFormData({ ...formData, adherent_id: e.target.value })}
                    className="input-logo"
                    required
                  >
                    <option value="">Sélectionner un adhérent</option>
                    {adherents.map((adherent) => (
                      <option key={adherent.id} value={adherent.id}>
                        {adherent.first_name} {adherent.last_name} ({adherent.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="label-custom flex items-center gap-2">
                    <FaCalendar className="text-[#57a1ce]" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-logo"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Heure */}
                <div>
                  <label className="label-custom flex items-center gap-2">
                    <FaClock className="text-[#57a1ce]" />
                    Heure
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="input-logo"
                    required
                  />
                </div>

                {/* Durée */}
                <div>
                  <label className="label-custom flex items-center gap-2">
                    <FaClock className="text-[#57a1ce]" />
                    Durée (minutes)
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="input-logo"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="75">75 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>

                {/* Type de séance */}
                <div>
                  <label className="label-custom flex items-center gap-2">
                    <FaDumbbell className="text-[#57a1ce]" />
                    Type de séance
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {sessionTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        className={`p-3 rounded-xl border-2 text-center transition ${
                          formData.type === type.value
                            ? 'border-[#57a1ce] bg-[#57a1ce]/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-logo flex-1 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white"></div>
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