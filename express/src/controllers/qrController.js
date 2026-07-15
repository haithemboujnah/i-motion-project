const QRCode = require('../models/QRCode');
const QRCodeGenerator = require('qrcode');
const Jimp = require('jimp');
const jsQR = require('jsqr');
const { pool } = require('../config/database');

class QRController {
  // ✅ Générer un QR Code pour un adhérent
  static async generateQR(req, res) {
    try {
      const adherentId = req.user.userId;
      
      if (req.user.role !== 'adherent') {
        return res.status(403).json({
          success: false,
          error: 'Seuls les adhérents peuvent générer un QR Code'
        });
      }
      
      const tokenData = await QRCode.generateQRToken(adherentId);
      
      const qrData = {
        userId: adherentId,
        token: tokenData.token,
        timestamp: new Date().toISOString()
      };
      
      const qrString = JSON.stringify(qrData);
      
      const qrImage = await QRCodeGenerator.toDataURL(qrString, {
        width: 400,
        margin: 2,
        color: {
          dark: '#57a1ce',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });
      
      res.json({
        success: true,
        data: {
          qrImage,
          token: tokenData.token,
          expires_at: tokenData.expires_at
        }
      });
    } catch (error) {
      console.error('Error generating QR:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération du QR Code'
      });
    }
  }

  // ✅ Scanner un QR Code depuis une image (AMÉLIORÉ)
  static async scanQRFromImage(req, res) {
    try {
      const coachId = req.user.userId;
      const { imageData, sessionId } = req.body;
      
      if (req.user.role !== 'coach' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Seuls les coachs peuvent scanner un QR Code'
        });
      }

      if (!imageData) {
        return res.status(400).json({
          success: false,
          error: 'Image requise'
        });
      }

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'ID de session requis'
        });
      }

      console.log('📸 Décodage du QR Code depuis l\'image...');

      let decodedData;
      try {
        decodedData = await QRController.decodeQRFromImage(imageData);
        console.log('✅ QR Code décodé avec succès:', decodedData);
      } catch (decodeError) {
        console.error('❌ Erreur de décodage:', decodeError);
        return res.status(400).json({
          success: false,
          error: 'QR Code non lisible ou invalide. Assurez-vous que l\'image contient un QR Code valide.'
        });
      }

      if (!decodedData || !decodedData.token) {
        return res.status(400).json({
          success: false,
          error: 'QR Code invalide - données manquantes'
        });
      }

      const tokenData = await QRCode.verifyQRToken(decodedData.token);
      
      if (!tokenData) {
        return res.status(400).json({
          success: false,
          error: 'QR Code expiré ou déjà utilisé'
        });
      }

      await QRCode.markTokenAsUsed(tokenData.id);
      
      const attendance = await QRCode.createAttendance(
        sessionId,
        tokenData.user_id,
        coachId
      );
      
      res.json({
        success: true,
        message: `✅ Pointage effectué pour ${tokenData.first_name} ${tokenData.last_name}`,
        data: {
          adherent: {
            id: tokenData.user_id,
            first_name: tokenData.first_name,
            last_name: tokenData.last_name,
            email: tokenData.email
          },
          attendance
        }
      });
    } catch (error) {
      console.error('Error scanning QR from image:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du scan du QR Code: ' + error.message
      });
    }
  }

  // ✅ Méthode de décodage avec prétraitement (AMÉLIORÉ)
  static async decodeQRFromImage(imageData) {
    try {
      // ✅ Supprimer le préfixe data:image/...;base64,
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // ✅ Lire l'image avec Jimp
      const image = await Jimp.read(imageBuffer);
      
      // ✅ Redimensionner pour meilleure lecture (taille optimale pour QR Code)
      image.resize(800, 800);
      
      // ✅ Améliorer le contraste pour meilleure lecture
      image.normalize();
      image.contrast(0.3);
      
      // ✅ Convertir en niveaux de gris
      image.grayscale();
      
      // ✅ Extraire les données brutes de l'image
      const { width, height } = image.bitmap;
      const imageDataArray = image.bitmap.data;
      
      // ✅ Convertir en format pour jsqr (Uint8ClampedArray)
      const uint8Array = new Uint8ClampedArray(imageDataArray);
      
      // ✅ Scanner le QR Code avec jsqr (avec paramètres optimisés)
      const decoded = jsQR(uint8Array, width, height, {
        inversionAttempts: "attemptBoth", // Essayer les deux inversions
      });
      
      if (!decoded || !decoded.data) {
        console.log('⚠️ Aucun QR Code détecté, tentative avec inversion...');
        
        // ✅ Tentative avec inversion de l'image
        const invertedImage = image.clone().invert();
        const invertedData = invertedImage.bitmap.data;
        const invertedArray = new Uint8ClampedArray(invertedData);
        
        const decodedInverted = jsQR(invertedArray, width, height, {
          inversionAttempts: "attemptBoth",
        });
        
        if (decodedInverted && decodedInverted.data) {
          console.log('✅ QR Code détecté après inversion');
          return QRController.parseDecodedData(decodedInverted.data);
        }
        
        throw new Error('Aucun QR Code trouvé dans l\'image');
      }
      
      console.log('📋 QR Code décodé:', decoded.data);
      
      return QRController.parseDecodedData(decoded.data);
      
    } catch (error) {
      console.error('❌ Erreur de décodage:', error);
      throw new Error('Impossible de décoder le QR Code: ' + error.message);
    }
  }

  // ✅ Parser les données décodées
  static parseDecodedData(data) {
    try {
      // ✅ Essayer de parser en JSON
      const parsedData = JSON.parse(data);
      return parsedData;
    } catch (parseError) {
      // ✅ Essayer de parser en format clé:valeur
      try {
        const parts = data.split(',');
        const result = {};
        parts.forEach(part => {
          const [key, value] = part.split(':');
          if (key && value) {
            result[key.trim()] = value.trim();
          }
        });
        if (result.token || result.userId) {
          return result;
        }
      } catch (e) {
        // Ignorer
      }
      
      // ✅ Essayer de parser en format URL
      try {
        const urlParams = new URLSearchParams(data);
        const result = {};
        for (const [key, value] of urlParams) {
          result[key] = value;
        }
        if (result.token || result.userId) {
          return result;
        }
      } catch (e) {
        // Ignorer
      }
      
      throw new Error('Format de QR Code non reconnu: ' + data.substring(0, 50));
    }
  }

  // ✅ Route de test pour vérifier que le QR est lisible
  static async testQRScan(req, res) {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({
          success: false,
          error: 'Image requise pour le test'
        });
      }
      
      console.log('🔍 Test de décodage QR...');
      
      const decoded = await QRController.decodeQRFromImage(imageData);
      
      res.json({
        success: true,
        data: {
          decoded: decoded,
          message: '✅ QR Code valide et lisible !'
        }
      });
    } catch (error) {
      console.error('❌ Test échoué:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'QR Code non lisible'
      });
    }
  }

  // ✅ Récupérer l'historique des pointages
  static async getHistory(req, res) {
    try {
      const adherentId = req.user.userId;
      const { limit = 20 } = req.query;
      
      const history = await QRCode.getAttendanceHistory(adherentId, parseInt(limit));
      
      res.json({
        success: true,
        data: { history }
      });
    } catch (error) {
      console.error('Error getting history:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'historique'
      });
    }
  }

  // ✅ Récupérer les pointages d'une séance (Coach)
  static async getSessionAttendances(req, res) {
    try {
      const { sessionId } = req.params;
      
      const attendances = await QRCode.getSessionAttendances(sessionId);
      
      res.json({
        success: true,
        data: { attendances }
      });
    } catch (error) {
      console.error('Error getting session attendances:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des pointages'
      });
    }
  }

  static async getCoachAttendances(req, res) {
    try {
        const coachId = req.user.userId;
        const { startDate, endDate, adherentId, limit = 50 } = req.query;
        
        const attendances = await QRCode.getCoachAttendances(coachId, {
        startDate,
        endDate,
        adherentId: adherentId ? parseInt(adherentId) : null,
        limit: parseInt(limit)
        });
        
        // Récupérer les statistiques
        const stats = await QRCode.getCoachAttendanceStats(coachId);
        
        res.json({
        success: true,
        data: {
            attendances,
            stats: {
            total: attendances.length,
            unique_adherents: stats[0]?.unique_adherents || 0,
            sessions_with_attendance: stats[0]?.sessions_with_attendance || 0,
            daily_stats: stats
            }
        }
        });
    } catch (error) {
        console.error('Error getting coach attendances:', error);
        res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'historique des pointages'
        });
    }
    }

    // ✅ Récupérer les statistiques de pointage d'un adhérent spécifique (Coach)
  static async getAdherentAttendanceStats(req, res) {
    try {
        const coachId = req.user.userId;
        const { adherentId } = req.params;
        
        if (!adherentId) {
        return res.status(400).json({
            success: false,
            error: 'ID de l\'adhérent requis'
        });
        }

        console.log(`📊 Récupération des stats pour l'adhérent ${adherentId} (coach: ${coachId})`);
        
        // ✅ Vérifier que l'adhérent existe
        const checkAdherent = await pool.query(
        'SELECT id, first_name, last_name FROM users WHERE id = $1 AND role = $2',
        [adherentId, 'adherent']
        );
        
        if (checkAdherent.rows.length === 0) {
        return res.status(404).json({
            success: false,
            error: 'Adhérent non trouvé'
        });
        }
        
        // ✅ Récupérer les statistiques globales
        const statsQuery = `
        SELECT 
            COUNT(*) as total_attendances,
            COUNT(DISTINCT session_id) as total_sessions,
            MIN(checked_at) as first_attendance,
            MAX(checked_at) as last_attendance
        FROM attendances
        WHERE coach_id = $1 AND adherent_id = $2
        `;
        
        const statsResult = await pool.query(statsQuery, [coachId, adherentId]);
        const globalStats = statsResult.rows[0] || { total_attendances: 0, total_sessions: 0 };
        
        // ✅ Récupérer la distribution par jour de la semaine
        const dayStatsQuery = `
        SELECT 
            EXTRACT(DOW FROM checked_at) as day_of_week,
            COUNT(*) as count_by_day
        FROM attendances
        WHERE coach_id = $1 AND adherent_id = $2
        GROUP BY EXTRACT(DOW FROM checked_at)
        ORDER BY day_of_week ASC
        `;
        
        const dayStatsResult = await pool.query(dayStatsQuery, [coachId, adherentId]);
        
        // ✅ Récupérer les dernières 10 présences
        const recentQuery = `
        SELECT 
            a.*,
            s.date,
            s.time,
            s.type as session_type
        FROM attendances a
        JOIN sessions s ON a.session_id = s.id
        WHERE a.coach_id = $1 AND a.adherent_id = $2
        ORDER BY a.checked_at DESC
        LIMIT 10
        `;
        
        const recentResult = await pool.query(recentQuery, [coachId, adherentId]);
        
        res.json({
        success: true,
        data: {
            stats: dayStatsResult.rows || [],
            global_stats: {
            total_attendances: parseInt(globalStats.total_attendances) || 0,
            total_sessions: parseInt(globalStats.total_sessions) || 0,
            first_attendance: globalStats.first_attendance || null,
            last_attendance: globalStats.last_attendance || null
            },
            recent_attendances: recentResult.rows || []
        }
        });
    } catch (error) {
        console.error('Error getting adherent attendance stats:', error);
        res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques: ' + error.message
        });
    }
    }
}

module.exports = QRController;