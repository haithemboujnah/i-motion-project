import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaBell, FaCheckCircle, FaClock, FaDumbbell,
  FaTrophy, FaCalendar, FaInfoCircle, FaCheck,
  FaUsers, FaExclamationTriangle, FaTimes,
  FaFilter, FaSortAmountDown
} from 'react-icons/fa';
import CoachNavbar from '../../components/coach/CoachNavbar';
import CoachSidebar from '../../components/coach/CoachSidebar';
import { notificationService } from '../../services/notificationService';
import toast from 'react-hot-toast';

const CoachNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsRes, countRes] = await Promise.all([
        notificationService.getNotifications(50),
        notificationService.getUnreadCount()
      ]);
      setNotifications(notificationsRes.data.notifications || []);
      setUnreadCount(countRes.data.unread_count || 0);
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
      toast.success('Toutes les notifications ont été marquées comme lues');
      fetchNotifications();
    } catch (error) {
      toast.error('Erreur lors du marquage');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      toast.success('Notification supprimée');
      fetchNotifications();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'session_reservation': <FaCalendar className="text-[#57a1ce] dark:text-[#57a1ce]" />,
      'session_cancelled': <FaCalendar className="text-red-500" />,
      'session_reminder': <FaClock className="text-orange-500" />,
      'achievement': <FaTrophy className="text-yellow-500" />,
      'program_generated': <FaDumbbell className="text-green-500" />,
      'adherent_risk': <FaExclamationTriangle className="text-red-500" />,
      'new_adherent': <FaUsers className="text-[#57a1ce] dark:text-[#57a1ce]" />,
      'default': <FaInfoCircle className="text-gray-500 dark:text-gray-400" />
    };
    return icons[type] || icons.default;
  };

  const getNotificationStyles = (type, isRead) => {
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

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary transition-colors duration-300">
      <CoachNavbar />
      <div className="flex">
        <CoachSidebar />
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  🔔 Notifications
                </h1>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </motion.span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Filtres */}
                <div className="flex bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark p-1">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 text-sm rounded-md transition ${
                      filter === 'all'
                        ? 'bg-[#57a1ce] text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-secondary'
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-1.5 text-sm rounded-md transition ${
                      filter === 'unread'
                        ? 'bg-[#57a1ce] text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-secondary'
                    }`}
                  >
                    Non lues
                  </button>
                  <button
                    onClick={() => setFilter('read')}
                    className={`px-3 py-1.5 text-sm rounded-md transition ${
                      filter === 'read'
                        ? 'bg-[#57a1ce] text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-secondary'
                    }`}
                  >
                    Lues
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-[#57a1ce] hover:bg-[#4690bd] text-white rounded-lg text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <FaCheck className="text-xs" /> Tout lire
                  </button>
                )}
              </div>
            </div>

            {/* Contenu */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-[#57a1ce] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Chargement des notifications...</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {filteredNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification, index) => {
                      const styles = getNotificationStyles(notification.type, notification.is_read);
                      
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
                          <div className="flex items-start gap-3 md:gap-4">
                            {/* Icône */}
                            <div className={`p-2.5 rounded-full shadow-sm mt-1 flex-shrink-0 ${styles.iconBg}`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            {/* Contenu */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <h4 className={`font-semibold flex items-center gap-2 ${styles.title}`}>
                                  {notification.title}
                                  {!notification.is_read && (
                                    <span className="inline-block w-2 h-2 bg-[#57a1ce] rounded-full animate-pulse" />
                                  )}
                                </h4>
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
                                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                                    title="Supprimer"
                                  >
                                    <FaTimes className="text-xs" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
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
                        : 'Vous serez notifié des activités de vos adhérents'}
                    </p>
                    {filter !== 'all' && (
                      <button
                        onClick={() => setFilter('all')}
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

export default CoachNotifications;