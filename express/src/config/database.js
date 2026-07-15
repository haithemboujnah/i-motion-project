const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'imotion_db',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

// Fonction pour créer le compte admin par défaut
const createDefaultAdmin = async () => {
  const adminEmail = 'admin@imotion.com';
  
  try {
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [adminEmail]);
    
    if (checkResult.rows.length === 0) {
      const defaultPassword = 'Admin123!';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      
      const insertQuery = `
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, role
      `;
      
      const values = [adminEmail, passwordHash, 'Admin', 'System', 'admin', true];
      const result = await pool.query(insertQuery, values);
      
      console.log('✅ Admin account created automatically');
      console.log('📧 Email: admin@imotion.com');
      console.log('🔑 Password: Admin123!');
      
      return result.rows[0];
    }
    
    console.log('✅ Admin account already exists');
    return checkResult.rows[0];
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    throw error;
  }
};

// Fonction d'initialisation complète de la base de données
const initDatabase = async () => {
  const queries = `
    -- Table users
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      role VARCHAR(50) DEFAULT 'adherent',
      is_active BOOLEAN DEFAULT true,
      reset_token VARCHAR(255),           -- ✅ Ajouté
      reset_token_expires TIMESTAMP,      -- ✅ Ajouté
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    );

    -- Table profiles
    CREATE TABLE IF NOT EXISTS profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      age INTEGER,
      weight DECIMAL(5,2),
      height DECIMAL(5,2),
      goal VARCHAR(50),
      level VARCHAR(20),
      medical_conditions TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table sessions
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      adherent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      coach_id INTEGER REFERENCES users(id),
      date DATE NOT NULL,
      time TIME NOT NULL,
      duration INTEGER DEFAULT 60,
      type VARCHAR(50),
      status VARCHAR(20) DEFAULT 'reserved',
      reminder_24h_sent BOOLEAN DEFAULT false,  -- ✅ Ajouté pour les rappels
      reminder_1h_sent BOOLEAN DEFAULT false,   -- ✅ Ajouté pour les rappels
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table performances
    CREATE TABLE IF NOT EXISTS performances (
      id SERIAL PRIMARY KEY,
      adherent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      weight DECIMAL(5,2),
      body_fat DECIMAL(5,2),
      muscle_mass DECIMAL(5,2),
      notes TEXT,
      measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table programs
    CREATE TABLE IF NOT EXISTS programs (
      id SERIAL PRIMARY KEY,
      adherent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100),
      description TEXT,
      goal VARCHAR(50),
      level VARCHAR(20),
      duration_weeks INTEGER,
      exercises JSONB,
      schedule JSONB,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table badges
    CREATE TABLE IF NOT EXISTS badges (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      description TEXT,
      icon VARCHAR(50),
      points_required INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table user_badges
    CREATE TABLE IF NOT EXISTS user_badges (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
      awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table user_points
    CREATE TABLE IF NOT EXISTS user_points (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      points INTEGER DEFAULT 0,
      reason VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table challenges
    CREATE TABLE IF NOT EXISTS challenges (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      description TEXT,
      difficulty VARCHAR(20),
      points_reward INTEGER,
      start_date DATE,
      end_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table user_challenges
    CREATE TABLE IF NOT EXISTS user_challenges (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      progress INTEGER DEFAULT 0
    );

    -- Table notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255),
      message TEXT,
      type VARCHAR(50),
      link VARCHAR(255),
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table de liaison entre programmes et exercices
    CREATE TABLE IF NOT EXISTS program_exercises (
      id SERIAL PRIMARY KEY,
      program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
      exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
      day_order INTEGER, -- 1=Lundi, 2=Mardi, etc.
      exercise_order INTEGER, -- Ordre dans la journée
      duration_minutes INTEGER,
      intensity VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(program_id, exercise_id, day_order)
    );

    -- Index
    CREATE INDEX IF NOT EXISTS idx_program_exercises_program_id ON program_exercises(program_id);
    CREATE INDEX IF NOT EXISTS idx_program_exercises_exercise_id ON program_exercises(exercise_id);

    CREATE TABLE IF NOT EXISTS alert_history (
      id SERIAL PRIMARY KEY,
      adherent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      risk_level VARCHAR(20) NOT NULL,
      risk_score INTEGER,
      message TEXT,
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Index
    CREATE INDEX IF NOT EXISTS idx_alert_history_adherent_id ON alert_history(adherent_id);
    CREATE INDEX IF NOT EXISTS idx_alert_history_created_at ON alert_history(created_at);

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);  -- ✅ Ajouté
    CREATE INDEX IF NOT EXISTS idx_sessions_adherent_id ON sessions(adherent_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
    CREATE INDEX IF NOT EXISTS idx_performances_adherent_id ON performances(adherent_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

    -- Insert default badges
    INSERT INTO badges (name, description, icon, points_required) 
    SELECT * FROM (VALUES
      ('🌟 Débutant', 'Première séance complétée', '🌟', 10),
      ('🏃 Régulier', '10 séances complétées', '🏃', 100),
      ('💪 Déterminé', '30 séances complétées', '💪', 300),
      ('🏆 Expert', '100 séances complétées', '🏆', 1000),
      ('🎯 Objectif Atteint', 'Objectif personnel atteint', '🎯', 200),
      ('🔥 En Forme', '15 séances en 30 jours', '🔥', 150)
    ) AS v(name, description, icon, points_required)
    WHERE NOT EXISTS (SELECT 1 FROM badges);
  `;

  try {
    await pool.query(queries);
    console.log('✅ Database initialized successfully with all tables');
    
    await createDefaultAdmin();
    
    console.log('✅ Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

module.exports = { pool, initDatabase };