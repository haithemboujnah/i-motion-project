const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Session = require('../../models/Session');
const Performance = require('../../models/Performance');

class ProfileController {
  static async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      const profile = await Profile.findByUserId(userId);
      
      if (!profile) {
        // Créer un profil par défaut si inexistant
        const defaultProfile = {
          age: null,
          weight: null,
          height: null,
          goal: 'remise_en_forme',
          level: 'debutant',
          medical_conditions: null
        };
        const newProfile = await Profile.create(userId, defaultProfile);
        
        return res.json({
          success: true,
          data: { user, profile: newProfile }
        });
      }
      
      res.json({
        success: true,
        data: { user, profile }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profileData = req.body;
      
      // Validation des données
      if (profileData.weight && profileData.weight < 20) {
        return res.status(400).json({
          success: false,
          error: 'Le poids doit être supérieur à 20 kg'
        });
      }
      
      if (profileData.height && profileData.height < 50) {
        return res.status(400).json({
          success: false,
          error: 'La taille doit être supérieure à 50 cm'
        });
      }
      
      if (profileData.age && profileData.age < 10) {
        return res.status(400).json({
          success: false,
          error: 'L\'âge doit être supérieur à 10 ans'
        });
      }
      
      // Vérifier si le profil existe
      const existingProfile = await Profile.findByUserId(userId);
      let profile;
      
      if (existingProfile) {
        profile = await Profile.update(userId, profileData);
      } else {
        profile = await Profile.create(userId, profileData);
      }
      
      // Si le poids est mis à jour, ajouter une mesure de performance
      if (profileData.weight) {
        await Performance.create({
          adherent_id: userId,
          weight: profileData.weight,
          body_fat: profileData.body_fat || null,
          muscle_mass: profileData.muscle_mass || null,
          notes: 'Mise à jour du profil',
          measured_at: new Date()
        });
      }
      
      // Calculer l'IMC si le poids et la taille sont disponibles
      let bmi = null;
      if (profile.weight && profile.height) {
        bmi = await Profile.calculateBMI(profile.weight, profile.height);
      }
      
      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: { profile, bmi }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  static async calculateBMI(req, res) {
    try {
      const userId = req.user.userId;
      const profile = await Profile.findByUserId(userId);
      
      if (!profile || !profile.weight || !profile.height) {
        return res.status(400).json({
          success: false,
          error: 'Poids et taille requis pour calculer l\'IMC'
        });
      }
      
      const bmi = await Profile.calculateBMI(profile.weight, profile.height);
      
      // Obtenir les mesures précédentes pour comparaison
      const measurements = await Performance.findByAdherentId(userId, 2);
      let evolution = null;
      
      if (measurements.length >= 2) {
        const latest = measurements[0];
        const previous = measurements[1];
        evolution = {
          weight_change: latest.weight - previous.weight,
          body_fat_change: latest.body_fat - previous.body_fat,
          period: '30 jours'
        };
      }
      
      res.json({
        success: true,
        data: { 
          bmi,
          weight: profile.weight,
          height: profile.height,
          evolution
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getProfileStats(req, res) {
    try {
      const userId = req.user.userId;
      
      const profile = await Profile.findByUserId(userId);
      const sessionStats = await Session.getSessionStats(userId);
      const performanceStats = await Performance.getStats(userId);
      const latestMeasurement = await Performance.getLatest(userId);
      
      // Calculer le taux d'assiduité
      const attendanceRate = sessionStats.total > 0 
        ? (sessionStats.completed / sessionStats.total) * 100 
        : 0;
      
      // Calculer l'IMC
      let bmi = null;
      if (profile && profile.weight && profile.height) {
        bmi = await Profile.calculateBMI(profile.weight, profile.height);
      }
      
      res.json({
        success: true,
        data: {
          profile,
          bmi,
          sessions: {
            total: sessionStats.total || 0,
            completed: sessionStats.completed || 0,
            cancelled: sessionStats.cancelled || 0,
            reserved: sessionStats.reserved || 0,
            attendance_rate: parseFloat(attendanceRate.toFixed(2)),
            total_duration: sessionStats.total_duration || 0
          },
          performance: {
            current_weight: latestMeasurement?.weight || profile?.weight || null,
            current_body_fat: latestMeasurement?.body_fat || null,
            current_muscle_mass: latestMeasurement?.muscle_mass || null,
            total_measurements: performanceStats?.total_measurements || 0,
            weight_evolution: performanceStats?.initial_weight && performanceStats?.current_weight
              ? {
                  initial: parseFloat(performanceStats.initial_weight).toFixed(2),
                  current: parseFloat(performanceStats.current_weight).toFixed(2),
                  difference: parseFloat(performanceStats.current_weight - performanceStats.initial_weight).toFixed(2)
                }
              : null
          },
          last_measurement: latestMeasurement
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = ProfileController;