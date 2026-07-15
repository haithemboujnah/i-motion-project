import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSearch, FaUser, FaEdit, FaTrash, FaToggleOn, FaToggleOff,
  FaUserPlus, FaFilter, FaEye, FaEnvelope, FaCheck, FaTimes,
  FaUserCog, FaShieldAlt, FaSpinner, FaSave
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Formulaire création/édition
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'adherent',
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers();
      setUsers(response.data.users || []);
      setFilteredUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, filterRole, filterStatus);
  };

  const handleFilterRole = (role) => {
    setFilterRole(role);
    applyFilters(searchTerm, role, filterStatus);
  };

  const handleFilterStatus = (status) => {
    setFilterStatus(status);
    applyFilters(searchTerm, filterRole, status);
  };

  const applyFilters = (term, role, status) => {
    let filtered = users.filter(u =>
      u.first_name?.toLowerCase().includes(term) ||
      u.last_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );

    if (role !== 'all') {
      filtered = filtered.filter(u => u.role === role);
    }

    if (status !== 'all') {
      filtered = filtered.filter(u => u.is_active === (status === 'active'));
    }

    setFilteredUsers(filtered);
  };

  // ✅ CRÉER UN UTILISATEUR
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.createUser(formData);
      toast.success('Utilisateur créé avec succès');
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ MODIFIER UN UTILISATEUR
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.updateUser(selectedUser.id, formData);
      toast.success('Utilisateur mis à jour avec succès');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ CHANGER LE STATUT
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await adminService.toggleUserStatus(id, !currentStatus);
      toast.success(`Utilisateur ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  // ✅ SUPPRIMER UN UTILISATEUR
  const handleDeleteUser = async (id) => {
    setSubmitting(true);
    try {
      await adminService.deleteUser(id);
      toast.success('Utilisateur supprimé avec succès');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ OUVRIR MODAL DE MODIFICATION
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'adherent',
      is_active: user.is_active !== undefined ? user.is_active : true
    });
    setShowEditModal(true);
  };

  // ✅ OUVRIR MODAL DE VISUALISATION
  const handleViewClick = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'adherent',
      is_active: true
    });
  };

  const getRoleBadge = (role) => {
    const colors = {
      'admin': 'bg-purple-100 text-purple-700',
      'coach': 'bg-blue-100 text-blue-700',
      'adherent': 'bg-green-100 text-green-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  const roleOptions = [
    { value: 'adherent', label: 'Adhérent' },
    { value: 'coach', label: 'Coach' },
    { value: 'admin', label: 'Administrateur' }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-theme-primary">
                  👥 Gestion des utilisateurs
                </h1>
                <p className="text-theme-secondary mt-1">
                  Gérez tous les utilisateurs de la plateforme
                </p>
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-logo text-sm flex items-center gap-2"
              >
                <FaUserPlus /> Ajouter un utilisateur
              </button>
            </div>

            {/* Filtres */}
            <div className="bg-theme-card rounded-xl p-4 shadow-sm border border-theme mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="input-logo pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterRole}
                    onChange={(e) => handleFilterRole(e.target.value)}
                    className="input-logo w-40"
                  >
                    <option value="all">Tous les rôles</option>
                    <option value="admin">Admin</option>
                    <option value="coach">Coach</option>
                    <option value="adherent">Adhérent</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => handleFilterStatus(e.target.value)}
                    className="input-logo w-40"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {filteredUsers.length > 0 ? (
                  <div className="bg-theme-card rounded-xl shadow-sm border border-theme overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-theme-secondary border-b border-theme">
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Utilisateur
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Rôle
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Séances
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Points
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-theme-hover transition">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium text-theme-primary">
                                      {user.first_name} {user.last_name}
                                    </p>
                                    <p className="text-sm text-theme-secondary">{user.email}</p>
                                    <p className="text-xs text-theme-muted">
                                      Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`badge ${getRoleBadge(user.role)}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`badge ${getStatusBadge(user.is_active)}`}>
                                  {user.is_active ? 'Actif' : 'Inactif'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-sm font-medium text-theme-primary">
                                  {user.total_sessions || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-sm font-medium text-theme-primary">
                                  {user.total_points || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleStatus(user.id, user.is_active)}
                                    className={`p-2 rounded-lg transition ${
                                      user.is_active 
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40' 
                                        : 'bg-gray-50 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                                    }`}
                                    title={user.is_active ? 'Désactiver' : 'Activer'}
                                  >
                                    {user.is_active ? <FaToggleOn className="text-xl" /> : <FaToggleOff className="text-xl" />}
                                  </button>
                                  <button
                                    onClick={() => handleViewClick(user)}
                                    className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                    title="Voir"
                                  >
                                    <FaEye className="text-sm" />
                                  </button>
                                  <button
                                    onClick={() => handleEditClick(user)}
                                    className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition"
                                    title="Modifier"
                                  >
                                    <FaEdit className="text-sm" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowDeleteModal(true);
                                    }}
                                    className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                                    title="Supprimer"
                                  >
                                    <FaTrash className="text-sm" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-6 py-3 border-t border-theme flex justify-between items-center">
                      <span className="text-sm text-theme-secondary">
                        {filteredUsers.length} utilisateurs affichés
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-theme-card rounded-xl border border-theme">
                    <FaUser className="text-6xl text-theme-muted mx-auto mb-4" />
                    <p className="text-theme-secondary">Aucun utilisateur trouvé</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* ✅ MODAL DE CRÉATION */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                <FaUserPlus className="inline mr-2 text-indigo-600" />
                Ajouter un utilisateur
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-custom">Prénom *</label>
                    <input
                      type="text"
                      required
                      className="input-logo"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div>
                    <label className="label-custom">Nom *</label>
                    <input
                      type="text"
                      required
                      className="input-logo"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-custom">Email *</label>
                  <input
                    type="email"
                    required
                    className="input-logo"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="utilisateur@email.com"
                  />
                </div>
                <div>
                  <label className="label-custom">Mot de passe *</label>
                  <input
                    type="password"
                    required
                    className="input-logo"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    minLength="8"
                  />
                </div>
                <div>
                  <label className="label-custom">Rôle</label>
                  <select
                    className="input-logo"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {roleOptions.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Activer le compte immédiatement
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-logo flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin inline mr-2" />
                      Création...
                    </>
                  ) : (
                    <>
                      <FaSave className="inline mr-2" />
                      Créer
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MODAL DE MODIFICATION */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                <FaEdit className="inline mr-2 text-yellow-600" />
                Modifier l'utilisateur
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-custom">Prénom *</label>
                    <input
                      type="text"
                      required
                      className="input-logo"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label-custom">Nom *</label>
                    <input
                      type="text"
                      required
                      className="input-logo"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label-custom">Email *</label>
                  <input
                    type="email"
                    required
                    className="input-logo"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-custom">Nouveau mot de passe</label>
                  <input
                    type="password"
                    className="input-logo"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Laisser vide pour ne pas changer"
                    minLength="8"
                  />
                  <p className="text-xs text-gray-400 mt-1">Laisser vide pour conserver le mot de passe actuel</p>
                </div>
                <div>
                  <label className="label-custom">Rôle</label>
                  <select
                    className="input-logo"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {roleOptions.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="editIsActive" className="text-sm text-gray-700">
                    Compte actif
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-logo flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin inline mr-2" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <FaSave className="inline mr-2" />
                      Mettre à jour
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MODAL DE VISUALISATION */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                <FaUser className="inline mr-2 text-blue-600" />
                Détails de l'utilisateur
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mt-3">
                {selectedUser.first_name} {selectedUser.last_name}
              </h3>
              <p className="text-gray-500">{selectedUser.email}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Rôle</span>
                <span className={`badge ${getRoleBadge(selectedUser.role)}`}>
                  {selectedUser.role}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Statut</span>
                <span className={`badge ${getStatusBadge(selectedUser.is_active)}`}>
                  {selectedUser.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Séances</span>
                <span className="font-semibold">{selectedUser.total_sessions || 0}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Points</span>
                <span className="font-semibold">{selectedUser.total_points || 0}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Date d'inscription</span>
                <span className="font-semibold">
                  {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {selectedUser.last_login && (
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Dernière connexion</span>
                  <span className="font-semibold">
                    {new Date(selectedUser.last_login).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(selectedUser);
                }}
                className="btn-logo flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600"
              >
                <FaEdit className="inline mr-2" />
                Modifier
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="btn-secondary flex-1"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL DE SUPPRESSION */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaTrash className="text-red-500" />
              Confirmer la suppression
            </h2>
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUser.first_name} {selectedUser.last_name}</strong> ?
            </p>
            <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-600">
                ⚠️ Cette action est irréversible. Toutes les données associées seront supprimées.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                disabled={submitting}
                className="btn-logo flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin inline mr-2" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;