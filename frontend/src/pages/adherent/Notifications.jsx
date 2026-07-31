import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaBell, FaCheckCircle, FaClock, FaDumbbell,
  FaTrophy, FaCalendar, FaInfoCircle, FaCheck,
  FaTrash, FaCircle
} from 'react-icons/fa';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import { notificationService } from '../../services/notificationService';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const getNotificationIcon = (type) => {
    const icons = {
      'session_reservation': <FaCalendar className="text-[#57a1ce]" />,
      'session_cancelled': <FaCalendar className="text-red-500" />,
      'session_reminder': <FaClock className="text-orange-500" />,
      'achievement': <FaTrophy className="text-yellow-500" />,
      'program_generated': <FaDumbbell className="text-green-500" />,
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
        message: 'text-blue-700 dark:text-blue-400'
      },
      'session_cancelled': {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800/30',
        iconBg: 'bg-red-100 dark:bg-red-900/40',
        title: 'text-red-800 dark:text-red-300',
        message: 'text-red-700 dark:text-red-400'
      },
      'session_reminder': {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800/30',
        iconBg: 'bg-orange-100 dark:bg-orange-900/40',
        title: 'text-orange-800 dark:text-orange-300',
        message: 'text-orange-700 dark:text-orange-400'
      },
      'achievement': {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800/30',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
        title: 'text-yellow-800 dark:text-yellow-300',
        message: 'text-yellow-700 dark:text-yellow-400'
      },
      'program_generated': {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800/30',
        iconBg: 'bg-green-100 dark:bg-green-900/40',
        title: 'text-green-800 dark:text-green-300',
        message: 'text-green-700 dark:text-green-400'
      },
      'default': {
        bg: 'bg-gray-50 dark:bg-dark-secondary/50',
        border: 'border-gray-200 dark:border-dark',
        iconBg: 'bg-gray-100 dark:bg-dark-secondary',
        title: 'text-gray-800 dark:text-gray-200',
        message: 'text-gray-600 dark:text-gray-400'
      }
    };
    return styles[type] || styles.default;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  🔔 Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-[#57a1ce] hover:bg-[#4690bd] text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <FaCheck /> Tout marquer comme lu
                </button>
              )}
            </div>

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
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notification, index) => {
                      const styles = getNotificationStyles(notification.type, notification.is_read);
                      const IconComponent = getNotificationIcon(notification.type);
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border rounded-xl p-4 transition-all duration-300 ${
                            !notification.is_read 
                              ? 'shadow-sm ring-1 ring-[#57a1ce]/20 dark:ring-[#57a1ce]/30' 
                              : 'opacity-80 hover:opacity-100'
                          } ${styles.bg} ${styles.border}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-2.5 rounded-full shadow-sm mt-1 ${styles.iconBg}`}>
                              {IconComponent}
                            </div>
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
                                  {!notification.is_read && (
                                    <button
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-dark-secondary/50 transition-colors"
                                      title="Marquer comme lu"
                                    >
                                      <FaCheck className="text-green-500 text-sm" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className={`mt-1 text-sm ${styles.message}`}>
                                {notification.message}
                              </p>
                              {notification.link && (
                                <a
                                  href={notification.link}
                                  className="text-[#57a1ce] text-sm font-medium hover:underline mt-2 inline-flex items-center gap-1 transition-colors"
                                >
                                  Voir plus →
                                </a>
                              )}
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
                      <FaBell className="text-4xl text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Aucune notification
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      Vous serez notifié de vos réservations, badges et programmes
                    </p>
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

export default Notifications;