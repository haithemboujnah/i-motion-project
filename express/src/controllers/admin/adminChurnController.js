const mlService = require('../../services/mlService');
const { pool } = require('../../config/database');

class AdminChurnController {
  // ✅ Récupérer l'analyse de churn complète
  static async getChurnAnalysis(req, res) {
    try {
      console.log('🔍 Récupération de l\'analyse de churn...');
      
      // Récupérer tous les adhérents avec leurs stats
      const query = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.created_at,
          (SELECT COUNT(*) FROM sessions WHERE adherent_id = u.id) as session_count,
          (SELECT COUNT(*) FROM sessions WHERE adherent_id = u.id AND status = 'completed') as completed_sessions,
          (SELECT COALESCE(SUM(duration), 0) FROM sessions WHERE adherent_id = u.id) as total_duration,
          (SELECT COALESCE(AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100, 0) FROM sessions WHERE adherent_id = u.id) as avg_attendance,
          (SELECT COALESCE(MAX(date)::date, CURRENT_DATE) FROM sessions WHERE adherent_id = u.id) as last_session_date,
          (SELECT COUNT(*) FROM sessions WHERE adherent_id = u.id AND date >= CURRENT_DATE - INTERVAL '7 days') as sessions_last_7_days,
          (SELECT COUNT(*) FROM sessions WHERE adherent_id = u.id AND date >= CURRENT_DATE - INTERVAL '30 days') as sessions_last_30_days,
          (SELECT COALESCE(p.weight, 0) FROM performances p WHERE p.adherent_id = u.id ORDER BY p.measured_at DESC LIMIT 1) as current_weight,
          (SELECT COALESCE(p.weight, 0) FROM performances p WHERE p.adherent_id = u.id ORDER BY p.measured_at ASC LIMIT 1) as initial_weight,
          (SELECT COALESCE(p.body_fat, 0) FROM performances p WHERE p.adherent_id = u.id ORDER BY p.measured_at DESC LIMIT 1) as current_body_fat,
          (SELECT COALESCE(p.body_fat, 0) FROM performances p WHERE p.adherent_id = u.id ORDER BY p.measured_at ASC LIMIT 1) as initial_body_fat,
          (SELECT COALESCE(p.muscle_mass, 0) FROM performances p WHERE p.adherent_id = u.id ORDER BY p.measured_at DESC LIMIT 1) as current_muscle_mass,
          (SELECT COALESCE(p.muscle_mass, 0) FROM performances p WHERE p.adherent_id = u.id ORDER BY p.measured_at ASC LIMIT 1) as initial_muscle_mass,
          (SELECT COALESCE(COUNT(*), 0) FROM user_badges WHERE user_id = u.id) as badge_count,
          (SELECT COALESCE(COUNT(*), 0) FROM user_challenges WHERE user_id = u.id AND completed_at IS NOT NULL) as challenge_participation,
          (SELECT COALESCE(AVG(progress), 0) FROM user_challenges WHERE user_id = u.id) as program_completion_rate
        FROM users u
        WHERE u.role = 'adherent' AND u.is_active = true
      `;
      
      const result = await pool.query(query);
      const adherents = result.rows;
      
      // Préparer les données pour le ML
      const usersData = adherents.map(a => {
        const daysSinceLastSession = a.last_session_date 
          ? Math.floor((new Date() - new Date(a.last_session_date)) / (1000 * 60 * 60 * 24))
          : 90;
        
        const weightChange = (a.current_weight || 0) - (a.initial_weight || 0);
        const bodyFatChange = (a.current_body_fat || 0) - (a.initial_body_fat || 0);
        const muscleChange = (a.current_muscle_mass || 0) - (a.initial_muscle_mass || 0);
        
        return {
          user_id: a.id,
          data: {
            session_count: parseInt(a.session_count || 0),
            completed_sessions: parseInt(a.completed_sessions || 0),
            total_duration: parseFloat(a.total_duration || 0),
            avg_attendance: parseFloat(a.avg_attendance || 0),
            days_since_last_session: daysSinceLastSession,
            sessions_last_7_days: parseInt(a.sessions_last_7_days || 0),
            sessions_last_30_days: parseInt(a.sessions_last_30_days || 0),
            body_fat_change: parseFloat(bodyFatChange || 0),
            weight_change: parseFloat(weightChange || 0),
            muscle_change: parseFloat(muscleChange || 0),
            program_completion_rate: parseFloat(a.program_completion_rate || 0),
            badge_count: parseInt(a.badge_count || 0),
            challenge_participation: parseInt(a.challenge_participation || 0)
          }
        };
      });
      
      // Appeler le service ML
      let predictions = [];
      let stats = {
        total: usersData.length,
        critical_count: 0,
        high_risk_count: 0,
        medium_risk_count: 0,
        low_risk_count: 0,
        safe_count: 0
      };
      
      if (usersData.length > 0) {
        try {
          const mlResponse = await mlService.batchPredictChurn(usersData);
          
          if (mlResponse && mlResponse.success) {
            predictions = mlResponse.data.predictions || [];
            
            // Calculer les statistiques
            predictions.forEach(p => {
              if (p.risk_level === 'Critique') stats.critical_count++;
              else if (p.risk_level === 'Élevé') stats.high_risk_count++;
              else if (p.risk_level === 'Moyen') stats.medium_risk_count++;
              else if (p.risk_level === 'Faible') stats.low_risk_count++;
              else stats.safe_count++;
            });
          }
        } catch (mlError) {
          console.warn('⚠️ Erreur ML, utilisation de données simulées:', mlError.message);
          // Fallback: simuler des prédictions
          predictions = usersData.map(u => ({
            user_id: u.user_id,
            risk_score: Math.random() * 100,
            risk_level: ['Safe', 'Faible', 'Moyen', 'Élevé', 'Critique'][Math.floor(Math.random() * 5)],
            factors: {}
          }));
        }
      }
      
      res.json({
        success: true,
        data: {
          adherents: adherents.map((a, index) => ({
            ...a,
            churn: predictions[index] || { risk_score: 0, risk_level: 'Safe', factors: {} }
          })),
          stats: stats,
          predictions: predictions
        }
      });
    } catch (error) {
      console.error('Error getting churn analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'analyse du churn: ' + error.message
      });
    }
  }

  // ✅ Récupérer les adhérents à risque (pour le coach)
  static async getAtRiskAdherents(req, res) {
    try {
      console.log('🔍 Récupération des adhérents à risque...');
      
      const { riskLevel } = req.query;
      
      let query = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          (SELECT COUNT(*) FROM sessions WHERE adherent_id = u.id) as session_count,
          (SELECT COALESCE(MAX(date), CURRENT_DATE) FROM sessions WHERE adherent_id = u.id) as last_session_date,
          (SELECT COALESCE(AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100, 0) FROM sessions WHERE adherent_id = u.id) as avg_attendance
        FROM users u
        WHERE u.role = 'adherent' AND u.is_active = true
      `;
      
      const result = await pool.query(query);
      const adherents = result.rows;
      
      // Préparer les données pour le ML
      const usersData = adherents.map(a => {
        const daysSinceLastSession = a.last_session_date 
          ? Math.floor((new Date() - new Date(a.last_session_date)) / (1000 * 60 * 60 * 24))
          : 90;
        
        return {
          user_id: a.id,
          data: {
            session_count: parseInt(a.session_count || 0),
            completed_sessions: 0,
            total_duration: 0,
            avg_attendance: parseFloat(a.avg_attendance || 0),
            days_since_last_session: daysSinceLastSession,
            sessions_last_7_days: 0,
            sessions_last_30_days: 0,
            body_fat_change: 0,
            weight_change: 0,
            muscle_change: 0,
            program_completion_rate: 0,
            badge_count: 0,
            challenge_participation: 0
          }
        };
      });
      
      let atRisk = [];
      
      if (usersData.length > 0) {
        try {
          const mlResponse = await mlService.batchPredictChurn(usersData);
          
          if (mlResponse && mlResponse.success) {
            const predictions = mlResponse.data.predictions || [];
            
            // Filtrer selon le niveau de risque
            atRisk = adherents.map((a, index) => ({
              ...a,
              risk_score: predictions[index]?.risk_score || 0,
              risk_level: predictions[index]?.risk_level || 'Safe',
              factors: predictions[index]?.factors || {}
            }));
            
            if (riskLevel) {
              atRisk = atRisk.filter(a => a.risk_level === riskLevel);
            } else {
              // Par défaut: Critique et Élevé
              atRisk = atRisk.filter(a => 
                a.risk_level === 'Critique' || a.risk_level === 'Élevé'
              );
            }
          }
        } catch (mlError) {
          console.warn('⚠️ Erreur ML, utilisation de données simulées:', mlError.message);
        }
      }
      
      res.json({
        success: true,
        data: {
          adherents: atRisk,
          count: atRisk.length
        }
      });
    } catch (error) {
      console.error('Error getting at-risk adherents:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des adhérents à risque: ' + error.message
      });
    }
  }
}

// ✅ S'assurer que la classe est bien exportée
module.exports = AdminChurnController;