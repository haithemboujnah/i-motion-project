import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
import joblib
import os
import random
from typing import Dict, List


class ChurnPredictor:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_columns = [
            'session_count', 'completed_sessions', 'total_duration',
            'avg_attendance', 'days_since_last_session', 'sessions_last_7_days',
            'sessions_last_30_days', 'body_fat_change', 'weight_change',
            'muscle_change', 'program_completion_rate', 'badge_count',
            'challenge_participation'
        ]
        self.model_path = os.getenv('MODEL_PATH', './models/')
        os.makedirs(self.model_path, exist_ok=True)
        self.load_model()

    def load_model(self):
        model_file = os.path.join(self.model_path, 'churn_predictor_v2.pkl')
        scaler_file = os.path.join(self.model_path, 'churn_scaler_v2.pkl')

        if os.path.exists(model_file) and os.path.exists(scaler_file):
            self.model = joblib.load(model_file)
            self.scaler = joblib.load(scaler_file)
            print("✅ Modèle de churn chargé")
        else:
            print("🔄 Création d'un nouveau modèle de churn...")
            self.train_model()

    def train_model(self):
        """
        Entraîner le modèle de prédiction de churn.

        IMPORTANT (fix par rapport à la v1): le label n'est plus une fonction
        déterministe et directe de 3 des features d'entrée (ce qui causait une
        fuite de données -> 100% accuracy triviale, cf. discussion précédente).
        Ici, le "vrai" risque de churn est un score latent = combinaison
        pondérée de PLUSIEURS facteurs (pas seulement 3), PLUS un bruit gaussien
        substantiel, transformé en probabilité puis échantillonné de façon
        stochastique (Bernoulli). Résultat: le modèle doit vraiment apprendre
        une relation statistique bruitée, comme dans un cas réel, au lieu de
        reconstruire un simple if/or déjà présent dans ses propres features.
        """
        np.random.seed(42)
        random.seed(42)
        n_samples = 5000

        data = {
            'session_count': np.random.randint(0, 50, n_samples),
            'completed_sessions': np.random.randint(0, 45, n_samples),
            'total_duration': np.random.uniform(0, 3000, n_samples),
            'avg_attendance': np.random.uniform(0, 100, n_samples),
            'days_since_last_session': np.random.randint(0, 90, n_samples),
            'sessions_last_7_days': np.random.randint(0, 7, n_samples),
            'sessions_last_30_days': np.random.randint(0, 30, n_samples),
            'body_fat_change': np.random.uniform(-5, 5, n_samples),
            'weight_change': np.random.uniform(-10, 10, n_samples),
            'muscle_change': np.random.uniform(-3, 3, n_samples),
            'program_completion_rate': np.random.uniform(0, 100, n_samples),
            'badge_count': np.random.randint(0, 10, n_samples),
            'challenge_participation': np.random.randint(0, 5, n_samples)
        }
        df = pd.DataFrame(data)

        def norm(s):
            return (s - s.mean()) / s.std()

        # Score latent: plusieurs facteurs contribuent, avec des poids réalistes
        # (l'inactivité et l'assiduité pèsent plus, mais rien n'est un seuil dur).
        latent = (
            0.9 * norm(df['days_since_last_session']) +
            -0.8 * norm(df['avg_attendance']) +
            -0.6 * norm(df['session_count']) +
            -0.4 * norm(df['program_completion_rate']) +
            0.3 * norm(df['weight_change']) +
            0.3 * norm(df['body_fat_change']) +
            -0.3 * norm(df['muscle_change']) +
            -0.2 * norm(df['badge_count']) +
            -0.2 * norm(df['challenge_participation']) +
            -0.15 * norm(df['sessions_last_30_days']) +
            np.random.normal(0, 1.8, n_samples)  # bruit: personne ne peut deviner à 100%
        )

        prob_true = 1 / (1 + np.exp(-latent))
        df['churn'] = (np.random.random(n_samples) < prob_true).astype(int)

        X = df[self.feature_columns].values
        y = df['churn'].values

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )

        self.model = RandomForestClassifier(
            n_estimators=300,
            max_depth=8,               # profondeur limitée: évite de mémoriser le bruit
            min_samples_leaf=10,       # idem
            class_weight='balanced',
            random_state=42
        )
        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)
        y_proba = self.model.predict_proba(X_test)[:, 1]
        accuracy = accuracy_score(y_test, y_pred)
        auc = roc_auc_score(y_test, y_proba)

        print(f"📊 Précision du modèle de churn: {accuracy:.2%}")
        print(f"📊 ROC-AUC: {auc:.3f}")
        print("📊 Importance des features (les 5 principales):")
        importances = pd.Series(self.model.feature_importances_, index=self.feature_columns)
        for name, imp in importances.sort_values(ascending=False).head(5).items():
            print(f"   - {name}: {imp:.3f}")

        joblib.dump(self.model, os.path.join(self.model_path, 'churn_predictor_v2.pkl'))
        joblib.dump(self.scaler, os.path.join(self.model_path, 'churn_scaler_v2.pkl'))
        print("✅ Modèle de churn entraîné et sauvegardé")

    def predict_churn(self, user_data: Dict) -> Dict:
        features = np.array([[
            user_data.get('session_count', 0),
            user_data.get('completed_sessions', 0),
            user_data.get('total_duration', 0),
            user_data.get('avg_attendance', 0),
            user_data.get('days_since_last_session', 0),
            user_data.get('sessions_last_7_days', 0),
            user_data.get('sessions_last_30_days', 0),
            user_data.get('body_fat_change', 0),
            user_data.get('weight_change', 0),
            user_data.get('muscle_change', 0),
            user_data.get('program_completion_rate', 0),
            user_data.get('badge_count', 0),
            user_data.get('challenge_participation', 0)
        ]])

        features_scaled = self.scaler.transform(features)
        probability = self.model.predict_proba(features_scaled)[0][1]
        risk_score = probability * 100

        if risk_score >= 80:
            risk_level = 'Critique'
        elif risk_score >= 60:
            risk_level = 'Élevé'
        elif risk_score >= 40:
            risk_level = 'Moyen'
        elif risk_score >= 20:
            risk_level = 'Faible'
        else:
            risk_level = 'Safe'

        factors = self.get_risk_factors(user_data)
        recommendations = self.get_recommendations(risk_level, user_data)

        return {
            'risk_score': round(risk_score, 2),
            'risk_level': risk_level,
            'probability': round(float(probability), 4),
            'factors': factors,
            'recommendations': recommendations
        }

    def get_risk_factors(self, user_data: Dict) -> Dict:
        """
        Note: ces facteurs restent des règles lisibles pour l'explication à
        l'utilisateur (utile en UI), mais ils ne définissent plus le label
        d'entraînement du modèle -> plus de fuite de données.
        """
        factors = {}
        if user_data.get('days_since_last_session', 0) > 30:
            factors['inactivite'] = f"Pas de séance depuis {user_data['days_since_last_session']} jours"
        if user_data.get('avg_attendance', 0) < 30:
            factors['assiduite'] = f"Assiduité faible: {user_data['avg_attendance']}%"
        if user_data.get('session_count', 0) < 5:
            factors['engagement'] = f"Peu de séances: {user_data['session_count']}"
        if user_data.get('weight_change', 0) > 3:
            factors['poids'] = f"Gain de poids: +{user_data['weight_change']} kg"
        if user_data.get('body_fat_change', 0) > 2:
            factors['masse_grasse'] = f"Augmentation de la masse grasse: +{user_data['body_fat_change']}%"
        if user_data.get('program_completion_rate', 0) < 50:
            factors['programme'] = f"Programme non suivi: {user_data['program_completion_rate']}%"
        if user_data.get('badge_count', 0) == 0:
            factors['gamification'] = "Aucun badge débloqué"
        return factors

    def get_recommendations(self, risk_level: str, user_data: Dict) -> List[str]:
        recommendations = []
        if risk_level in ['Critique', 'Élevé']:
            recommendations.append("📞 Contact immédiat : Appeler l'adhérent pour un suivi personnalisé")
            recommendations.append("📅 Proposer un programme de réengagement avec des objectifs atteignables")
            recommendations.append("🎯 Définir des objectifs courts terme pour motiver l'adhérent")
            if user_data.get('days_since_last_session', 0) > 30:
                recommendations.append("📧 Envoyer une offre spéciale de réengagement")
        if risk_level == 'Moyen':
            recommendations.append("📊 Augmenter la fréquence des rappels de séances")
            recommendations.append("🏆 Proposer un challenge motivant avec récompense")
            recommendations.append("💬 Envoyer un message d'encouragement personnalisé")
        if risk_level == 'Faible':
            recommendations.append("✅ Continuer le suivi régulier")
            recommendations.append("📈 Partager les progrès avec l'adhérent")
            recommendations.append("🌟 Féliciter l'adhérent pour sa régularité")
        if not recommendations:
            recommendations.append("✅ Excellent suivi, continuer ainsi !")
        return recommendations


if __name__ == '__main__':
    predictor = ChurnPredictor()

    user1 = {
        'session_count': 8, 'completed_sessions': 6, 'total_duration': 480,
        'avg_attendance': 75.0, 'days_since_last_session': 5,
        'sessions_last_7_days': 2, 'sessions_last_30_days': 8,
        'body_fat_change': -1.5, 'weight_change': -2.0, 'muscle_change': 1.2,
        'program_completion_rate': 80.0, 'badge_count': 3, 'challenge_participation': 2
    }
    user2 = {
        'session_count': 2, 'completed_sessions': 1, 'total_duration': 60,
        'avg_attendance': 20.0, 'days_since_last_session': 45,
        'sessions_last_7_days': 0, 'sessions_last_30_days': 1,
        'body_fat_change': 3.0, 'weight_change': 4.5, 'muscle_change': -1.0,
        'program_completion_rate': 10.0, 'badge_count': 0, 'challenge_participation': 0
    }
    # Profil intermédiaire volontairement ambigu, pour montrer que le modèle
    # ne se contente plus d'un simple OR de seuils comme avant.
    user3 = {
        'session_count': 12, 'completed_sessions': 9, 'total_duration': 700,
        'avg_attendance': 45.0, 'days_since_last_session': 20,
        'sessions_last_7_days': 1, 'sessions_last_30_days': 5,
        'body_fat_change': 0.5, 'weight_change': 1.0, 'muscle_change': 0.0,
        'program_completion_rate': 55.0, 'badge_count': 1, 'challenge_participation': 1
    }

    print("\n=== User 1 (profil très engagé) ===")
    print(predictor.predict_churn(user1))
    print("\n=== User 2 (profil clairement décroché) ===")
    print(predictor.predict_churn(user2))
    print("\n=== User 3 (profil ambigu, entre les deux) ===")
    print(predictor.predict_churn(user3))