const cron = require('node-cron');
const { pool } = require('../config/database');
const Notification = require('../models/Notification');

class ReminderScheduler {
  constructor() {
    this.isRunning = false;
    this.start();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    console.log('⏰ Scheduler de rappels démarré');
    
    // ✅ Tâche 1: Vérifier toutes les heures pour les rappels 24h
    cron.schedule('0 * * * *', async () => {
      await this.send24HourReminders();
    });
    
    // ✅ Tâche 2: Vérifier toutes les 15 minutes pour les rappels 1h
    cron.schedule('*/15 * * * *', async () => {
      await this.send1HourReminders();
    });
    
    // ✅ Tâche 3: Nettoyer les notifications anciennes (1 fois par jour)
    cron.schedule('0 0 * * *', async () => {
      await this.cleanOldNotifications();
    });
  }

  // ✅ Rappels 24h avant
  async send24HourReminders() {
    try {
      console.log('📅 Vérification des rappels 24h...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const query = `
        SELECT 
          s.id,
          s.adherent_id,
          s.date,
          s.time,
          s.type,
          u.first_name,
          u.last_name,
          u.email
        FROM sessions s
        JOIN users u ON s.adherent_id = u.id
        WHERE s.date = $1 
          AND s.status IN ('reserved', 'confirmed')
          AND s.adherent_id IS NOT NULL
      `;
      
      const result = await pool.query(query, [tomorrowStr]);
      
      console.log(`📊 ${result.rows.length} séances trouvées pour demain`);
      
      for (const session of result.rows) {
        // Vérifier si une notification existe déjà
        const checkQuery = `
          SELECT id FROM notifications 
          WHERE user_id = $1 
            AND type = 'session_reminder_24h' 
            AND link = $2
            AND created_at >= CURRENT_DATE
        `;
        const checkResult = await pool.query(checkQuery, [
          session.adherent_id,
          `/sessions/${session.id}`
        ]);
        
        if (checkResult.rows.length === 0) {
          await Notification.create({
            user_id: session.adherent_id,
            title: '⏰ Rappel de séance (24h)',
            message: `Vous avez une séance ${session.type || 'sportive'} demain à ${session.time.substring(0, 5)}`,
            type: 'session_reminder_24h',
            link: `/sessions/${session.id}`
          });
          
          console.log(`✅ Notification 24h envoyée à ${session.first_name} ${session.last_name}`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors des rappels 24h:', error);
    }
  }

  // ✅ Rappels 1h avant (CORRIGÉ)
  async send1HourReminders() {
    try {
      console.log('⏰ Vérification des rappels 1h...');
      
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      
      // ✅ Calculer l'heure cible (dans 1 heure)
      const targetTime = new Date(now.getTime() + 60 * 60 * 1000);
      const targetHour = targetTime.getHours();
      const targetMinute = targetTime.getMinutes();
      
      // ✅ Formater correctement l'heure (sans 60 minutes)
      const targetHourStr = String(targetHour).padStart(2, '0');
      const targetMinuteStr = String(targetMinute).padStart(2, '0');
      const targetTimeStr = `${targetHourStr}:${targetMinuteStr}`;
      
      // ✅ Heure actuelle
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      
      // ✅ Récupérer les séances dans la prochaine heure
      const query = `
        SELECT 
          s.id,
          s.adherent_id,
          s.date,
          s.time,
          s.type,
          u.first_name,
          u.last_name,
          u.email
        FROM sessions s
        JOIN users u ON s.adherent_id = u.id
        WHERE s.date = $1 
          AND s.status IN ('reserved', 'confirmed')
          AND s.adherent_id IS NOT NULL
          AND s.time >= $2
          AND s.time <= $3
      `;
      
      const result = await pool.query(query, [currentDate, currentTimeStr, targetTimeStr]);
      
      console.log(`📊 ${result.rows.length} séances trouvées dans la prochaine heure`);
      
      for (const session of result.rows) {
        // Vérifier si une notification existe déjà
        const checkQuery = `
          SELECT id FROM notifications 
          WHERE user_id = $1 
            AND type = 'session_reminder_1h' 
            AND link = $2
            AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
        `;
        const checkResult = await pool.query(checkQuery, [
          session.adherent_id,
          `/sessions/${session.id}`
        ]);
        
        if (checkResult.rows.length === 0) {
          await Notification.create({
            user_id: session.adherent_id,
            title: '⏰ Rappel de séance (1h)',
            message: `Votre séance ${session.type || 'sportive'} commence dans 1 heure à ${session.time.substring(0, 5)}`,
            type: 'session_reminder_1h',
            link: `/sessions/${session.id}`
          });
          
          console.log(`✅ Notification 1h envoyée à ${session.first_name} ${session.last_name}`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors des rappels 1h:', error);
    }
  }

  // ✅ Nettoyer les notifications anciennes
  async cleanOldNotifications() {
    try {
      console.log('🧹 Nettoyage des notifications anciennes...');
      
      const query = `
        DELETE FROM notifications 
        WHERE created_at < CURRENT_DATE - INTERVAL '30 days'
          AND is_read = true
      `;
      
      const result = await pool.query(query);
      console.log(`🧹 ${result.rowCount} notifications supprimées`);
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    }
  }

  // ✅ Envoyer un rappel immédiat pour une séance spécifique
  static async sendImmediateReminder(sessionId) {
    try {
      const query = `
        SELECT 
          s.*,
          u.first_name,
          u.last_name,
          u.email
        FROM sessions s
        JOIN users u ON s.adherent_id = u.id
        WHERE s.id = $1
      `;
      
      const result = await pool.query(query, [sessionId]);
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Séance non trouvée' };
      }
      
      const session = result.rows[0];
      
      // Calculer le temps restant
      const now = new Date();
      const sessionDate = new Date(session.date);
      const sessionTime = session.time.split(':');
      sessionDate.setHours(parseInt(sessionTime[0]), parseInt(sessionTime[1]), 0);
      
      const diffMs = sessionDate - now;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let title, message;
      let reminderType = 'session_reminder_immediate';
      
      if (diffHours >= 24) {
        reminderType = 'session_reminder_24h';
        title = '⏰ Rappel de séance (24h)';
        message = `Vous avez une séance demain à ${session.time.substring(0, 5)}`;
      } else if (diffHours >= 1) {
        reminderType = 'session_reminder_1h';
        title = '⏰ Rappel de séance (1h)';
        message = `Votre séance commence dans ${diffHours}h${diffMinutes}min à ${session.time.substring(0, 5)}`;
      } else {
        title = '⏰ Votre séance commence bientôt !';
        message = `Votre séance commence dans ${diffMinutes} minutes à ${session.time.substring(0, 5)}`;
      }
      
      await Notification.create({
        user_id: session.adherent_id,
        title: title,
        message: message,
        type: reminderType,
        link: `/sessions/${session.id}`
      });
      
      return { 
        success: true, 
        message: `Notification envoyée à ${session.first_name} ${session.last_name}` 
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du rappel immédiat:', error);
      return { success: false, error: error.message };
    }
  }
}

// ✅ Créer une instance unique du scheduler
const reminderScheduler = new ReminderScheduler();

module.exports = reminderScheduler;