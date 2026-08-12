const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../auth/middleware/authMiddleware');

const router = express.Router();

// ✅ Récupérer les utilisateurs par rôle
router.get('/', authenticate, async (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, first_name, last_name, email, role, is_active FROM users WHERE 1=1';
    const values = [];
    
    if (role) {
      query += ' AND role = $1';
      values.push(role);
    }
    
    query += ' ORDER BY first_name ASC';
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: { users: result.rows }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

module.exports = router;