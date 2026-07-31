import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaUser, FaCalendar, FaChartLine,
  FaTrophy, FaDumbbell, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaEnvelope,
  FaHistory, FaBell, FaEye, FaEdit, FaTrash
} from 'react-icons/fa';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminAdherentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [adherent, setAdherent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdherentDetail();
  }, [id]);

  const fetchAdherentDetail = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUserById(id);
      setAdherent(response.data.user);
    } catch (error) {
      console.error('Error fetching adherent detail:', error);
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="spinner"></div>
          </main>
        </div>
      </div>
    );
  }

  if (!adherent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 p-6">
            <div className="text-center py-12">
              <p className="text-gray-500">Adhérent non trouvé</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate('/admin/churn')}
                className="p-2 rounded-xl hover:bg-gray-200 transition"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <h1 className="text-3xl font-display font-bold text-gray-900">
                Détails de l'adhérent
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Carte d'identité */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-3xl font-bold">
                    {adherent.first_name?.[0]}{adherent.last_name?.[0]}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mt-4">
                    {adherent.first_name} {adherent.last_name}
                  </h2>
                  <p className="text-gray-500">{adherent.email}</p>
                  <div className="flex justify-center gap-2 mt-2">
                    <span className="badge-primary">{adherent.role || 'Adhérent'}</span>
                    <span className={`badge ${adherent.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {adherent.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    Membre depuis {new Date(adherent.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
                  <button className="w-full btn-logo text-sm bg-purple-600 hover:bg-purple-700">
                    <FaEdit className="inline mr-2" />
                    Modifier
                  </button>
                  <button className="w-full btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50">
                    <FaTrash className="inline mr-2" />
                    Désactiver
                  </button>
                </div>
              </div>

              {/* Détails */}
              <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  📋 Informations complètes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="font-medium">{adherent.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rôle</p>
                    <p className="font-medium capitalize">{adherent.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <p className="font-medium">{adherent.is_active ? 'Actif' : 'Inactif'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date d'inscription</p>
                    <p className="font-medium">{new Date(adherent.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dernière connexion</p>
                    <p className="font-medium">{adherent.last_login ? new Date(adherent.last_login).toLocaleDateString('fr-FR') : 'Jamais'}</p>
                  </div>
                </div>

                {/* Vue Coach en mode Admin */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Vue Coach</p>
                      <p className="text-xs text-blue-600">Accéder à la vue détaillée du coach</p>
                    </div>
                    <button
                      onClick={() => window.open(`/coach/adherents/${adherent.id}`, '_blank')}
                      className="btn-logo text-sm bg-blue-600 hover:bg-blue-700"
                    >
                      Ouvrir dans Coach
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAdherentDetail;