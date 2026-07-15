import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaBell, FaCheck, FaTimes, FaTrash,
  FaInfoCircle, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaFilter,
  FaEnvelope, FaUser, FaCalendar,
  FaSpinner, FaUsers, FaDumbbell
} from 'react-icons/fa';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { notificationService } from '../../services/notificationService';
import toast from 'react-hot-toast';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(50);
      setNotifications(response.data.notifications || []);
      setFilteredNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      toast.success('Notification marquée comme lue');
      fetchNotifications();
    } catch (error) {
      toast.error('Erreur lors du marquage');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      toast.success('Toutes les notifications marquées comme lues');
      fetchNotifications();
    } catch (error) {
      toast.error('Erreur lors du marquage');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      return;
    }

    try {
      setIsDeleting(true);
      // Appel API pour supprimer
      await notificationService.deleteNotification(id);
      toast.success('Notification supprimée avec succès');
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ?')) {
      return;
    }

    try {
      setIsDeleting(true);
      // Appel API pour supprimer toutes
      await notificationService.deleteAllNotifications();
      toast.success('Toutes les notifications ont été supprimées');
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilter = (type) => {
    setFilter(type);
    if (type === 'all') {
      setFilteredNotifications(notifications);
    } else if (type === 'unread') {
      setFilteredNotifications(notifications.filter(n => !n.is_read));
    } else if (type === 'read') {
      setFilteredNotifications(notifications.filter(n => n.is_read));
    } else {
      setFilteredNotifications(notifications.filter(n => n.type === type));
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'session_reservation': <FaCalendar className="text-blue-500 dark:text-blue-400" />,
      'session_cancelled': <FaTimes className="text-red-500 dark:text-red-400" />,
      'session_reminder': <FaClock className="text-orange-500 dark:text-orange-400" />,
      'achievement': <FaTrophy className="text-yellow-500 dark:text-yellow-400" />,
      'program_generated': <FaDumbbell className="text-green-500 dark:text-green-400" />,
      'adherent_risk': <FaExclamationTriangle className="text-red-500 dark:text-red-400" />,
      'new_adherent': <FaUsers className="text-blue-500 dark:text-blue-400" />,
      'default': <FaBell className="text-gray-500 dark:text-gray-400" />
    };
    return icons[type] || icons.default;
  };

  const getNotificationStyles = (type) => {
    const styles = {
      'session_reservation': {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800/30',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        title: 'text-blue-800 dark:text-blue-300',
        message: 'text-blue-700 dark:text-blue-400',
        hover: 'hover:bg-blue-100/50 dark:hover:bg-blue-900/30'
      },
      'session_cancelled': {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800/30',
        iconBg: 'bg-red-100 dark:bg-red-900/40',
        title: 'text-red-800 dark:text-red-300',
        message: 'text-red-700 dark:text-red-400',
        hover: 'hover:bg-red-100/50 dark:hover:bg-red-900/30'
      },
      'session_reminder': {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800/30',
        iconBg: 'bg-orange-100 dark:bg-orange-900/40',
        title: 'text-orange-800 dark:text-orange-300',
        message: 'text-orange-700 dark:text-orange-400',
        hover: 'hover:bg-orange-100/50 dark:hover:bg-orange-900/30'
      },
      'achievement': {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800/30',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
        title: 'text-yellow-800 dark:text-yellow-300',
        message: 'text-yellow-700 dark:text-yellow-400',
        hover: 'hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30'
      },
      'program_generated': {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800/30',
        iconBg: 'bg-green-100 dark:bg-green-900/40',
        title: 'text-green-800 dark:text-green-300',
        message: 'text-green-700 dark:text-green-400',
        hover: 'hover:bg-green-100/50 dark:hover:bg-green-900/30'
      },
      'adherent_risk': {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800/30',
        iconBg: 'bg-red-100 dark:bg-red-900/40',
        title: 'text-red-800 dark:text-red-300',
        message: 'text-red-700 dark:text-red-400',
        hover: 'hover:bg-red-100/50 dark:hover:bg-red-900/30'
      },
      'new_adherent': {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800/30',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        title: 'text-blue-800 dark:text-blue-300',
        message: 'text-blue-700 dark:text-blue-400',
        hover: 'hover:bg-blue-100/50 dark:hover:bg-blue-900/30'
      },
      'default': {
        bg: 'bg-gray-50 dark:bg-dark-secondary/50',
        border: 'border-gray-200 dark:border-dark',
        iconBg: 'bg-gray-100 dark:bg-dark-secondary',
        title: 'text-gray-800 dark:text-gray-200',
        message: 'text-gray-600 dark:text-gray-400',
        hover: 'hover:bg-gray-100/50 dark:hover:bg-dark-secondary/70'
      }
    };
    return styles[type] || styles.default;
  };

  // Calculer les statistiques
  const totalUnread = notifications.filter(n => !n.is_read).length;
  const totalNotifications = notifications.length;

  const filters = [
    { id: 'all', label: 'Toutes', count: totalNotifications },
    { id: 'unread', label: 'Non lues', count: totalUnread },
    { id: 'read', label: 'Lues', count: totalNotifications - totalUnread },
    { id: 'session_reservation', label: 'Réservations' },
    { id: 'achievement', label: 'Progression' },
    { id: 'adherent_risk', label: 'Alertes' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary transition-colors duration-300">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <FaBell className="text-[#57a1ce]" />
                  Notifications Système
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Gérez les notifications système et les alertes
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {totalUnread > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-[#57a1ce] hover:bg-[#4690bd] text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <FaCheck className="text-xs" /> Tout marquer lu
                  </button>
                )}
                {totalNotifications > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaTrash className="text-xs" />
                    )}
                    Tout supprimer
                  </button>
                )}
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalNotifications}</p>
              </div>
              <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark">
                <p className="text-sm text-gray-500 dark:text-gray-400">Non lues</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalUnread}</p>
              </div>
              <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark">
                <p className="text-sm text-gray-500 dark:text-gray-400">Lues</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalNotifications - totalUnread}</p>
              </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFilter(f.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filter === f.id
                      ? 'bg-[#57a1ce] text-white shadow-md'
                      : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-secondary border border-gray-200 dark:border-dark'
                  }`}
                >
                  {f.label}
                  {f.count !== undefined && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      filter === f.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 dark:bg-dark-secondary text-gray-500 dark:text-gray-400'
                    }`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Liste des notifications */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-[#57a1ce] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Chargement des notifications...</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification, index) => {
                    const styles = getNotificationStyles(notification.type);
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`border rounded-xl p-4 transition-all duration-300 ${
                          !notification.is_read 
                            ? 'shadow-md ring-1 ring-[#57a1ce]/20 dark:ring-[#57a1ce]/30' 
                            : 'opacity-80 hover:opacity-100'
                        } ${styles.bg} ${styles.border} ${styles.hover}`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icône */}
                          <div className={`p-2.5 rounded-full shadow-sm mt-1 flex-shrink-0 ${styles.iconBg}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-semibold ${styles.title}`}>
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <span className="inline-block w-2 h-2 bg-[#57a1ce] rounded-full animate-pulse" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                  {new Date(notification.created_at).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            <p className={`mt-1 text-sm ${styles.message}`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              {notification.link && (
                                <a
                                  href={notification.link}
                                  className="text-[#57a1ce] text-sm font-medium hover:underline inline-flex items-center gap-1 transition-colors"
                                >
                                  Voir plus →
                                </a>
                              )}
                              
                              <div className="flex items-center gap-2 ml-auto">
                                {!notification.is_read && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="px-3 py-1.5 text-xs bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-secondary text-green-600 dark:text-green-400 rounded-lg border border-gray-200 dark:border-dark transition-colors flex items-center gap-1"
                                  >
                                    <FaCheck className="text-xs" /> Marquer lu
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(notification.id)}
                                  disabled={isDeleting}
                                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50"
                                  title="Supprimer"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-dark-secondary rounded-full flex items-center justify-center">
                      {filter !== 'all' ? (
                        <FaFilter className="text-4xl text-gray-300 dark:text-gray-600" />
                      ) : (
                        <FaBell className="text-4xl text-gray-300 dark:text-gray-600" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {filter !== 'all' ? 'Aucune notification dans ce filtre' : 'Aucune notification'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      {filter !== 'all' 
                        ? 'Essayez de changer le filtre pour voir plus de notifications'
                        : 'Toutes les notifications système apparaîtront ici'}
                    </p>
                    {filter !== 'all' && (
                      <button
                        onClick={() => handleFilter('all')}
                        className="mt-4 px-4 py-2 bg-[#57a1ce] hover:bg-[#4690bd] text-white rounded-lg text-sm transition-colors"
                      >
                        Voir toutes les notifications
                      </button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// Ajouter l'icône Trophy manquante
const FaTrophy = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
  </svg>
);

export default AdminNotifications;