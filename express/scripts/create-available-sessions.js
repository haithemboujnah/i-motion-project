const { pool } = require('../src/config/database');

const createAvailableSessions = async () => {
  try {
    console.log('🔄 Création de séances disponibles...');
    
    // ✅ Supprimer d'abord les anciennes séances disponibles
    const deleteResult = await pool.query('DELETE FROM sessions WHERE status = $1', ['available']);
    console.log(`🗑️ ${deleteResult.rowCount} anciennes séances disponibles supprimées`);
    
    // ✅ Réinitialiser la séquence des IDs (optionnel mais recommandé)
    await pool.query('SELECT setval(pg_get_serial_sequence(\'sessions\', \'id\'), COALESCE((SELECT MAX(id) FROM sessions), 0) + 1, false)');
    
    // ✅ Récupérer les coachs
    const coachesQuery = 'SELECT id FROM users WHERE role = $1';
    const coachesResult = await pool.query(coachesQuery, ['coach']);
    
    if (coachesResult.rows.length === 0) {
      console.log('❌ Aucun coach trouvé');
      return;
    }
    
    const coachIds = coachesResult.rows.map(c => c.id);
    console.log(`👨‍🏫 Coachs trouvés: ${coachIds.join(', ')}`);
    
    // ✅ Dates pour les 7 prochains jours
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    console.log(`📅 Dates sélectionnées: ${dates.join(', ')}`);
    
    const types = ['EMS', 'Cardio', 'Musculation', 'HIIT', 'Yoga'];
    const times = ['09:00:00', '10:00:00', '11:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00'];
    
    let createdCount = 0;
    
    // ✅ Créer des séances pour chaque date
    for (const date of dates) {
      const numSessions = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numSessions; i++) {
        const coachId = coachIds[Math.floor(Math.random() * coachIds.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const time = times[Math.floor(Math.random() * times.length)];
        const duration = [45, 60, 75][Math.floor(Math.random() * 3)];
        
        const query = `
          INSERT INTO sessions (
            coach_id, date, time, duration, type, status, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, 'available', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `;
        
        const values = [coachId, date, time, duration, type];
        const result = await pool.query(query, values);
        createdCount++;
        console.log(`✅ Séance créée: ID ${result.rows[0].id} - ${date} ${time} - ${type}`);
      }
    }
    
    console.log(`\n📊 Résumé:`);
    console.log(`✅ ${createdCount} séances disponibles créées`);
    
    // ✅ Vérifier les séances disponibles
    const checkQuery = 'SELECT COUNT(*) as count FROM sessions WHERE status = $1';
    const checkResult = await pool.query(checkQuery, ['available']);
    console.log(`📋 Total séances disponibles: ${checkResult.rows[0].count}`);
    
    // ✅ Afficher les 5 premières séances disponibles
    const sampleQuery = `
      SELECT id, coach_id, date, time, type, status 
      FROM sessions 
      WHERE status = 'available' 
      ORDER BY date ASC, time ASC 
      LIMIT 5
    `;
    const sampleResult = await pool.query(sampleQuery);
    console.log('\n📋 Aperçu des séances disponibles:');
    sampleResult.rows.forEach(s => {
      console.log(`  - ${s.date} ${s.time} | ${s.type} | Coach ${s.coach_id}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
};

createAvailableSessions();