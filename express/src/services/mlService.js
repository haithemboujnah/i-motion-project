const axios = require('axios');

class MLService {
  constructor() {
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000/api';
    this.timeout = 30000;
    this.isAvailable = false;
    this.lastCheck = null;
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseUrl.replace('/api', '')}/health`, {
        timeout: 3000
      });
      this.isAvailable = response.data.status === 'healthy';
      this.lastCheck = new Date();
      return this.isAvailable;
    } catch (error) {
      this.isAvailable = false;
      return false;
    }
  }

  // ✅ Recommandation de programme
  async recommendProgram(userId, goal, level, profile) {
    if (!this.isAvailable) {
      await this.checkHealth();
      if (!this.isAvailable) {
        throw new Error('ML Service is not available');
      }
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/programs/recommend`,
        {
          user_id: userId,
          goal: goal,
          level: level,
          profile: {
            age: profile.age || null,
            weight: profile.weight || null,
            height: profile.height || null,
            bmi: profile.bmi || null,
            body_fat: profile.body_fat || null,
            muscle_mass: profile.muscle_mass || null
          }
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Error calling ML service:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      this.isAvailable = false;
      throw error;
    }
  }

  // ✅ Prédiction de churn (AJOUTÉ)
  async predictChurn(userId, data) {
    if (!this.isAvailable) {
      await this.checkHealth();
      if (!this.isAvailable) {
        throw new Error('ML Service is not available');
      }
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/churn/predict`,
        {
          user_id: userId,
          data: data
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error calling ML service:', error.message);
      this.isAvailable = false;
      throw error;
    }
  }

  // ✅ Batch prédiction de churn (AJOUTÉ)
  async batchPredictChurn(usersData) {
    if (!this.isAvailable) {
      await this.checkHealth();
      if (!this.isAvailable) {
        throw new Error('ML Service is not available');
      }
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/churn/batch-predict`,
        usersData,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error calling ML service:', error.message);
      this.isAvailable = false;
      throw error;
    }
  }
}

module.exports = new MLService();