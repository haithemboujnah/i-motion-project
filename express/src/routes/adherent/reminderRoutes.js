const express = require('express');
const ReminderScheduler = require('../../services/reminderScheduler');
const { authenticate } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

// ✅ Envoyer un rappel immédiat pour une séance
router.post('/send/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;
    
    // Vérifier que la séance appartient à l'utilisateur
    const { pool } = require('../../config/database');
    const checkQuery = `
      SELECT * FROM sessions 
      WHERE id = $1 AND adherent_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [sessionId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Séance non trouvée'
      });
    }
    
    const result = await ReminderScheduler.sendImmediateReminder(sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;