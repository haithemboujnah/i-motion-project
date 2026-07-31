const Performance = require('../../models/Performance');
const Profile = require('../../models/Profile');
const Gamification = require('../../models/Gamification');
const Notification = require('../../models/Notification');
const pdfService = require('../../services/pdfService');
const PDFDocument = require('pdfkit');

class PerformanceController {
  static async addMeasurement(req, res) {
    try {
      const adherentId = req.user.userId;
      const { weight, body_fat, muscle_mass, notes, measured_at } = req.body;
      
      if (!weight) {
        return res.status(400).json({
          success: false,
          error: 'Le poids est requis'
        });
      }
      
      const measurement = await Performance.create({
        adherent_id: adherentId,
        weight: parseFloat(weight),
        body_fat: body_fat ? parseFloat(body_fat) : null,
        muscle_mass: muscle_mass ? parseFloat(muscle_mass) : null,
        notes: notes || null,
        measured_at: measured_at || new Date()
      });
      
      const profile = await Profile.findByUserId(adherentId);
      if (profile && weight) {
        await Profile.update(adherentId, { ...profile, weight: parseFloat(weight) });
      }
      
      await Gamification.addPoints(adherentId, 5, 'Ajout de mesure de performance');
      
      const measurements = await Performance.findByAdherentId(adherentId, 2);
      if (measurements.length === 1) {
        await Gamification.addPoints(adherentId, 15, 'Première mesure de performance');
        await Notification.create({
          user_id: adherentId,
          title: '🎯 Première mesure enregistrée !',
          message: 'Continuez à suivre votre progression pour débloquer des badges !',
          type: 'achievement',
          link: '/performance'
        });
      }
      
      await Gamification.checkAndAwardBadges(adherentId);
      
      let bmi = null;
      if (profile && profile.height && weight) {
        const bmiResult = await Profile.calculateBMI(parseFloat(weight), profile.height);
        bmi = bmiResult;
      }
      
      res.status(201).json({
        success: true,
        message: 'Mesure ajoutée avec succès',
        data: { measurement, bmi }
      });
    } catch (error) {
      console.error('Error adding measurement:', error);
      res.status(400).json({
        success: false,
        error: 'Erreur lors de l\'ajout de la mesure'
      });
    }
  }

  // ✅ Récupérer les mesures
  static async getMeasurements(req, res) {
    try {
      const adherentId = req.user.userId;
      const { limit = 30 } = req.query;
      
      const measurements = await Performance.findByAdherentId(adherentId, parseInt(limit));
      
      res.json({
        success: true,
        data: { measurements }
      });
    } catch (error) {
      console.error('Error getting measurements:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des mesures'
      });
    }
  }

  // ✅ Récupérer les statistiques
  static async getStats(req, res) {
    try {
      const adherentId = req.user.userId;
      const profile = await Profile.findByUserId(adherentId);
      const stats = await Performance.getStats(adherentId);
      
      let bmi = null;
      if (profile && profile.height && stats?.current_weight) {
        bmi = await Profile.calculateBMI(stats.current_weight, profile.height);
      }
      
      const Session = require('../../models/Session');
      const sessions = await Session.findByAdherentId(adherentId);
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const attendanceRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
      
      res.json({
        success: true,
        data: {
          stats: stats || {
            total_measurements: 0,
            initial_weight: null,
            current_weight: null,
            avg_weight: null,
            avg_body_fat: null
          },
          bmi: bmi || null,
          attendance: {
            total: totalSessions,
            completed: completedSessions,
            rate: parseFloat(attendanceRate.toFixed(2))
          },
          profile
        }
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // ✅ Récupérer l'évolution
  static async getEvolution(req, res) {
    try {
      const adherentId = req.user.userId;
      const { period = '30 days' } = req.query;
      
      const validPeriods = ['7 days', '14 days', '30 days', '60 days', '90 days'];
      const validPeriod = validPeriods.includes(period) ? period : '30 days';
      
      const evolution = await Performance.getEvolution(adherentId, validPeriod);
      
      if (!evolution || evolution.length === 0) {
        return res.json({
          success: true,
          data: { evolution: [] }
        });
      }
      
      res.json({
        success: true,
        data: { evolution }
      });
    } catch (error) {
      console.error('Error getting evolution:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'évolution'
      });
    }
  }

  // ✅ Générer un rapport
  static async generateReport(req, res) {
    try {
      const adherentId = req.user.userId;
      const profile = await Profile.findByUserId(adherentId);
      const measurements = await Performance.findByAdherentId(adherentId, 30);
      const stats = await Performance.getStats(adherentId);
      
      const User = require('../../models/User');
      const user = await User.findById(adherentId);
      
      const Session = require('../../models/Session');
      const sessions = await Session.findByAdherentId(adherentId);
      
      const report = {
        user,
        profile,
        stats,
        measurements: measurements || [],
        sessions: sessions.slice(0, 10) || [],
        generated_at: new Date()
      };
      
      res.json({
        success: true,
        data: { report }
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération du rapport'
      });
    }
  }

  static async generatePDF(req, res) {
    try {
      const adherentId = req.user.userId;
      
      // Récupérer toutes les données
      const [profile, measurements, stats, user, sessions, badges] = await Promise.all([
        Profile.findByUserId(adherentId),
        Performance.findByAdherentId(adherentId, 30),
        Performance.getStats(adherentId),
        require('../../models/User').findById(adherentId),
        require('../../models/Session').findByAdherentId(adherentId),
        Gamification.getBadges(adherentId)
      ]);
      
      // Calculer le taux d'assiduité
      const totalSessions = sessions?.length || 0;
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
      const attendanceRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
      
      // Ajouter le taux d'assiduité aux stats
      const statsWithAttendance = {
        ...stats,
        attendance_rate: attendanceRate,
        total_sessions: totalSessions,
        completed_sessions: completedSessions
      };
      
      // Générer le PDF
      const pdfBuffer = await pdfService.generatePerformanceReport(
        user,
        profile,
        statsWithAttendance,
        measurements,
        sessions,
        badges
      );
      
      // Envoyer le PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=rapport-performance-${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération du PDF: ' + error.message
      });
    }
  }
}

module.exports = PerformanceController;