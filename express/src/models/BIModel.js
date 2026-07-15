const { pool } = require('../config/database');

class BIModel {
  // ✅ Récupérer les KPIs principaux
  static async getKPIs() {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'adherent' AND is_active = true) as total_members,
        (SELECT COUNT(*) FROM users WHERE role = 'adherent' AND is_active = true AND created_at >= CURRENT_DATE - INTERVAL '30 days') as new_members,
        (SELECT COUNT(*) FROM users WHERE role = 'adherent' AND is_active = false AND updated_at >= CURRENT_DATE - INTERVAL '30 days') as churned_members,
        (SELECT COUNT(*) FROM sessions) as total_sessions,
        (SELECT COUNT(*) FROM sessions WHERE status = 'completed') as completed_sessions,
        (SELECT ROUND(AVG(duration)::numeric, 0) FROM sessions) as avg_session_duration,
        (SELECT COUNT(DISTINCT adherent_id) FROM sessions WHERE date >= CURRENT_DATE - INTERVAL '30 days') as active_members
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  // ✅ Chiffre d'affaires (CORRIGÉ - basé sur les transactions)
  static async getRevenue() {
    const query = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(amount) as revenue,
        COUNT(*) as transactions_count,
        COUNT(DISTINCT user_id) as unique_customers
      FROM transactions 
      WHERE status = 'completed'
        AND created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;
    const result = await pool.query(query);
    
    // Si pas de transactions, utiliser les abonnements
    if (result.rows.length === 0) {
      const fallbackQuery = `
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          SUM(amount) as revenue,
          COUNT(*) as transactions_count,
          COUNT(DISTINCT user_id) as unique_customers
        FROM subscriptions 
        WHERE status = 'active' OR status = 'cancelled'
          AND created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
      `;
      const fallbackResult = await pool.query(fallbackQuery);
      return fallbackResult.rows;
    }
    
    return result.rows;
  }

  // ✅ Taux de renouvellement (CORRIGÉ)
  static async getRetention() {
    const query = `
        WITH monthly_subscriptions AS (
        SELECT 
            DATE_TRUNC('month', start_date) as cohort_month,
            user_id
        FROM subscriptions
        WHERE status = 'active' OR status = 'cancelled'
        ),
        monthly_renewals AS (
        SELECT 
            DATE_TRUNC('month', start_date) as renewal_month,
            user_id
        FROM subscriptions
        WHERE status = 'active'
            AND start_date > CURRENT_DATE - INTERVAL '12 months'
        )
        SELECT 
        ms.cohort_month,
        COUNT(DISTINCT ms.user_id) as total_subscribers,
        COUNT(DISTINCT mr.user_id) as renewed_subscribers,
        ROUND((COUNT(DISTINCT mr.user_id)::numeric / NULLIF(COUNT(DISTINCT ms.user_id), 0)) * 100, 2) as retention_rate
        FROM monthly_subscriptions ms
        LEFT JOIN monthly_renewals mr ON ms.user_id = mr.user_id 
        AND mr.renewal_month > ms.cohort_month
        AND mr.renewal_month <= ms.cohort_month + INTERVAL '30 days'
        GROUP BY ms.cohort_month
        ORDER BY ms.cohort_month ASC
        LIMIT 12
    `;
    const result = await pool.query(query);
    return result.rows;
    }

  // ✅ Heures de pointe
  static async getPeakHours() {
    const query = `
      SELECT 
        EXTRACT(HOUR FROM time) as hour,
        COUNT(*) as sessions_count
      FROM sessions
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM time)
      ORDER BY hour ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // ✅ Activité par jour de la semaine
  static async getWeeklyActivity() {
    const query = `
      SELECT 
        EXTRACT(DOW FROM date) as day_of_week,
        COUNT(*) as sessions_count
      FROM sessions
      WHERE date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY EXTRACT(DOW FROM date)
      ORDER BY day_of_week ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // ✅ Distribution des types de séances
  static async getSessionTypes() {
    const query = `
      SELECT 
        type,
        COUNT(*) as count
      FROM sessions
      WHERE date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY type
      ORDER BY count DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // ✅ Satisfaction client
  static async getSatisfaction() {
    const query = `
      SELECT 
        ROUND(AVG(rating)::numeric, 2) as avg_rating,
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_reviews,
        COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_reviews
      FROM feedbacks
      WHERE rating IS NOT NULL
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  // ✅ Prévisions (basées sur les données réelles)
  static async getForecast() {
    const query = `
      WITH monthly_stats AS (
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as new_members
        FROM users
        WHERE role = 'adherent'
          AND created_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      ),
      revenue_stats AS (
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          SUM(amount) as revenue
        FROM transactions
        WHERE status = 'completed'
          AND created_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
      )
      SELECT 
        json_agg(
          json_build_object(
            'month', ms.month,
            'new_members', ms.new_members,
            'revenue', COALESCE(rs.revenue, 0),
            'forecast_members', ROUND(ms.new_members * 1.15, 0),
            'forecast_revenue', ROUND(COALESCE(rs.revenue, 0) * 1.12, 2)
          )
        ) as forecast_data,
        ROUND(AVG(ms.new_members)::numeric * 1.15, 0) as predicted_next_month_members,
        ROUND(AVG(rs.revenue)::numeric * 1.12, 2) as predicted_next_month_revenue
      FROM monthly_stats ms
      LEFT JOIN revenue_stats rs ON ms.month = rs.month
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  // ✅ Répartition par âge
  static async getAgeDistribution() {
    const query = `
      SELECT 
        CASE 
          WHEN age < 20 THEN '18-20'
          WHEN age BETWEEN 20 AND 29 THEN '20-29'
          WHEN age BETWEEN 30 AND 39 THEN '30-39'
          WHEN age BETWEEN 40 AND 49 THEN '40-49'
          WHEN age >= 50 THEN '50+'
          ELSE 'Non renseigné'
        END as age_group,
        COUNT(*) as count
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE u.role = 'adherent' AND u.is_active = true
      GROUP BY age_group
      ORDER BY age_group
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // ✅ Répartition par objectif
  static async getGoalDistribution() {
    const query = `
      SELECT 
        goal,
        COUNT(*) as count
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE u.role = 'adherent' AND u.is_active = true
      GROUP BY goal
      ORDER BY count DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // ✅ Taux de conversion (nouveaux → actifs)
  static async getConversionRate() {
    const query = `
        WITH new_users AS (
        SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) as total_new
        FROM users
        WHERE role = 'adherent'
        GROUP BY DATE_TRUNC('month', created_at)
        ),
        active_users AS (
        SELECT 
            DATE_TRUNC('month', date) as month,
            COUNT(DISTINCT adherent_id) as active
        FROM sessions
        WHERE date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', date)
        )
        SELECT 
        nu.month,
        nu.total_new,
        COALESCE(au.active, 0) as active,
        ROUND(COALESCE(au.active, 0)::numeric / NULLIF(nu.total_new, 0) * 100, 2) as conversion_rate
        FROM new_users nu
        LEFT JOIN active_users au ON nu.month = au.month
        ORDER BY nu.month ASC
        LIMIT 12
    `;
    const result = await pool.query(query);
    return result.rows;
    }

  // ✅ Chiffre d'affaires par plan
  static async getRevenueByPlan() {
    const query = `
      SELECT 
        plan_type,
        COUNT(*) as subscriptions_count,
        SUM(amount) as total_revenue,
        ROUND(AVG(amount)::numeric, 2) as avg_amount
      FROM subscriptions
      WHERE status = 'active'
      GROUP BY plan_type
      ORDER BY total_revenue DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = BIModel;