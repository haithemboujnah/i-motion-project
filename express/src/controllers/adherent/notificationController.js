const Notification = require('../../models/Notification');

class NotificationController {
  // ✅ Récupérer les notifications
  static async getNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 20 } = req.query;
      
      const notifications = await Notification.findByUserId(userId, parseInt(limit));
      const unreadCount = await Notification.getUnreadCount(userId);
      
      res.json({
        success: true,
        data: { 
          notifications,
          unread_count: unreadCount,
          total: notifications.length 
        }
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des notifications'
      });
    }
  }

  // ✅ Marquer une notification comme lue
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const notification = await Notification.markAsRead(id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification non trouvée'
        });
      }
      
      res.json({
        success: true,
        message: 'Notification marquée comme lue',
        data: { notification }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du marquage de la notification'
      });
    }
  }

  // ✅ Marquer toutes les notifications comme lues
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const notifications = await Notification.markAllAsRead(userId);
      
      res.json({
        success: true,
        message: 'Toutes les notifications ont été marquées comme lues',
        data: { notifications }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du marquage des notifications'
      });
    }
  }

  // ✅ Compter les notifications non lues
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;
      const count = await Notification.getUnreadCount(userId);
      
      res.json({
        success: true,
        data: { unread_count: count }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du nombre de notifications non lues'
      });
    }
  }
}

module.exports = NotificationController;