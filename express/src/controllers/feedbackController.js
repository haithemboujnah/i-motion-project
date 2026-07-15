const Feedback = require('../models/Feedback');

class FeedbackController {
  // ✅ Créer un feedback
  static async create(req, res) {
    try {
      const adherentId = req.user.userId;
      const feedbackData = { ...req.body, adherent_id: adherentId };
      
      const feedback = await Feedback.create(feedbackData);
      
      res.status(201).json({
        success: true,
        message: 'Feedback envoyé avec succès',
        data: { feedback }
      });
    } catch (error) {
      console.error('Error creating feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'envoi du feedback'
      });
    }
  }

  // ✅ Récupérer tous les feedbacks (Admin)
  static async getAll(req, res) {
    try {
      const { status, type, category, priority } = req.query;
      const feedbacks = await Feedback.getAll({ status, type, category, priority });
      
      res.json({
        success: true,
        data: { feedbacks }
      });
    } catch (error) {
      console.error('Error getting feedbacks:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des feedbacks'
      });
    }
  }

  // ✅ Récupérer un feedback par ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const feedback = await Feedback.getById(id);
      
      if (!feedback) {
        return res.status(404).json({
          success: false,
          error: 'Feedback non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: { feedback }
      });
    } catch (error) {
      console.error('Error getting feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du feedback'
      });
    }
  }

  // ✅ Mettre à jour le statut (Admin) - CORRIGÉ
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, admin_response } = req.body;
      
      // ✅ Valider le statut
      const validStatuses = ['pending', 'in_progress', 'resolved'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Statut invalide. Utilisez: pending, in_progress, resolved'
        });
      }
      
      // ✅ Vérifier que le feedback existe
      const existingFeedback = await Feedback.getById(id);
      if (!existingFeedback) {
        return res.status(404).json({
          success: false,
          error: 'Feedback non trouvé'
        });
      }
      
      // ✅ Mettre à jour le statut
      const feedback = await Feedback.updateStatus(id, status, admin_response || null);
      
      res.json({
        success: true,
        message: 'Statut mis à jour avec succès',
        data: { feedback }
      });
    } catch (error) {
      console.error('Error updating feedback status:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du statut: ' + error.message
      });
    }
  }

  // ✅ Récupérer les statistiques
  static async getStats(req, res) {
    try {
      const stats = await Feedback.getStats();
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // ✅ Récupérer mes feedbacks (Adhérent)
  static async getMyFeedbacks(req, res) {
    try {
      const adherentId = req.user.userId;
      const feedbacks = await Feedback.getByAdherent(adherentId);
      
      res.json({
        success: true,
        data: { feedbacks }
      });
    } catch (error) {
      console.error('Error getting my feedbacks:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de vos feedbacks'
      });
    }
  }

  // ✅ Supprimer un feedback (Admin)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const feedback = await Feedback.delete(id);
      
      if (!feedback) {
        return res.status(404).json({
          success: false,
          error: 'Feedback non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Feedback supprimé avec succès'
      });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression du feedback'
      });
    }
  }
}

module.exports = FeedbackController;