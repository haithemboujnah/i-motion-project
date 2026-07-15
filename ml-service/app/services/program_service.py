import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import os
import copy
import random
from typing import Dict, Optional

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)
random.seed(RANDOM_SEED)


class ProgramRecommender:
    def __init__(self):
        self.model_goal = None
        self.model_level = None
        self.scaler = None
        self.label_encoders = {}
        self.feature_columns = ['age', 'weight', 'height', 'bmi', 'body_fat', 'muscle_mass']
        self.model_path = os.getenv('MODEL_PATH', './models/')
        os.makedirs(self.model_path, exist_ok=True)
        self.load_model()

    def load_model(self):
        model_file = os.path.join(self.model_path, 'program_recommender_v4.pkl')
        if os.path.exists(model_file):
            try:
                model_data = joblib.load(model_file)
                self.model_goal = model_data['model_goal']
                self.model_level = model_data['model_level']
                self.scaler = model_data['scaler']
                self.label_encoders = model_data['encoders']
                print("✅ Modèles ML chargés")
                print(f"📊 Précision objectif: {model_data.get('goal_accuracy', 0):.2%}")
                print(f"📊 Précision niveau: {model_data.get('level_accuracy', 0):.2%}")
                return
            except Exception as e:
                print(f"⚠️ Erreur lors du chargement: {e}")

        print("🔄 Entraînement des modèles ML...")
        self.train_model()

    def train_model(self):
        np.random.seed(42)
        random.seed(42)

        n_samples = 10000
        age = np.random.randint(18, 65, n_samples)
        weight = np.random.uniform(50, 120, n_samples)
        height = np.random.uniform(150, 200, n_samples)
        bmi = weight / ((height / 100) ** 2)
        body_fat = np.random.uniform(8, 40, n_samples)
        muscle_mass = np.random.uniform(25, 55, n_samples)

        bmi_noisy = bmi + np.random.normal(0, 1.5, n_samples)

        goals = []
        for i in range(n_samples):
            if bmi_noisy[i] > 29:
                goal = 'perte_de_poids'
            elif bmi_noisy[i] < 21:
                goal = 'prise_de_masse'
            else:
                if age[i] < 30 and weight[i] < 70:
                    goal = random.choices(['prise_de_masse', 'remise_en_forme'], weights=[0.7, 0.3])[0]
                elif age[i] > 50:
                    goal = random.choices(['remise_en_forme', 'perte_de_poids'], weights=[0.7, 0.3])[0]
                else:
                    goal = random.choices(['remise_en_forme', 'prise_de_masse', 'perte_de_poids'],
                                           weights=[0.4, 0.3, 0.3])[0]
            goals.append(goal)

        levels = []
        for i in range(n_samples):
            if age[i] > 55 or weight[i] > 110 or body_fat[i] > 32:
                level = random.choices(['debutant', 'intermediaire'], weights=[0.8, 0.2])[0]
            elif age[i] < 30 and body_fat[i] < 18 and muscle_mass[i] > 35:
                level = random.choices(['avance', 'intermediaire'], weights=[0.7, 0.3])[0]
            elif age[i] < 40 and body_fat[i] < 22:
                level = random.choices(['intermediaire', 'avance'], weights=[0.6, 0.4])[0]
            else:
                level = random.choices(['debutant', 'intermediaire', 'avance'], weights=[0.4, 0.4, 0.2])[0]
            levels.append(level)

        data = pd.DataFrame({
            'age': age, 'weight': weight, 'height': height, 'bmi': bmi,
            'body_fat': body_fat, 'muscle_mass': muscle_mass,
            'goal': goals, 'level': levels
        })

        self.label_encoders['goal'] = LabelEncoder()
        self.label_encoders['level'] = LabelEncoder()
        y_goal = self.label_encoders['goal'].fit_transform(data['goal'])
        y_level = self.label_encoders['level'].fit_transform(data['level'])

        X = data[self.feature_columns].values
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        X_train, X_test, y_goal_train, y_goal_test = train_test_split(
            X_scaled, y_goal, test_size=0.2, random_state=42
        )
        _, _, y_level_train, y_level_test = train_test_split(
            X_scaled, y_level, test_size=0.2, random_state=42
        )

        self.model_goal = RandomForestClassifier(
            n_estimators=300, max_depth=12, min_samples_leaf=3, random_state=42
        )
        self.model_goal.fit(X_train, y_goal_train)

        self.model_level = RandomForestClassifier(
            n_estimators=200, max_depth=10, min_samples_leaf=5, random_state=42
        )
        self.model_level.fit(X_train, y_level_train)

        goal_accuracy = self.model_goal.score(X_test, y_goal_test)
        level_accuracy = self.model_level.score(X_test, y_level_test)
        print(f"📊 Précision objectif: {goal_accuracy:.2%}")
        print(f"📊 Précision niveau: {level_accuracy:.2%}")

        model_data = {
            'model_goal': self.model_goal,
            'model_level': self.model_level,
            'scaler': self.scaler,
            'encoders': self.label_encoders,
            'goal_accuracy': goal_accuracy,
            'level_accuracy': level_accuracy
        }
        joblib.dump(model_data, os.path.join(self.model_path, 'program_recommender_v4.pkl'))
        print("✅ Modèles ML sauvegardés")

    def recommend_program(self, profile: Dict, goal: Optional[str] = None, level: Optional[str] = None) -> Dict:
        # ✅ Extraire les valeurs avec des valeurs par défaut sécurisées
        age = profile.get('age', 30)
        weight = profile.get('weight', 70)
        height = profile.get('height', 175)
        bmi = profile.get('bmi', weight / ((height / 100) ** 2))
        
        # ✅ Gérer les valeurs None pour body_fat et muscle_mass
        body_fat = profile.get('body_fat')
        muscle_mass = profile.get('muscle_mass')
        
        # ✅ Si body_fat est None, utiliser une valeur par défaut basée sur l'âge et le poids
        if body_fat is None:
            if age < 30:
                body_fat = 15 + (weight - 60) * 0.2
            elif age < 50:
                body_fat = 20 + (weight - 60) * 0.15
            else:
                body_fat = 25 + (weight - 60) * 0.1
            body_fat = max(8, min(40, body_fat))
        
        # ✅ Si muscle_mass est None, utiliser une valeur par défaut
        if muscle_mass is None:
            muscle_mass = 30 + (weight - 60) * 0.2
            muscle_mass = max(25, min(55, muscle_mass))

        features = np.array([[age, weight, height, bmi, body_fat, muscle_mass]])
        features_scaled = self.scaler.transform(features)

        goal_proba = self.model_goal.predict_proba(features_scaled)[0]
        level_proba = self.model_level.predict_proba(features_scaled)[0]

        goal_classes = self.label_encoders['goal'].classes_
        level_classes = self.label_encoders['level'].classes_

        model_goal = goal_classes[np.argmax(goal_proba)]
        model_level = level_classes[np.argmax(level_proba)]
        model_goal_confidence = float(np.max(goal_proba))
        model_level_confidence = float(np.max(level_proba))

        # --- Objectif final ---
        valid_goals = list(goal_classes)
        if goal and goal in valid_goals:
            final_goal = goal
            final_goal_confidence = float(goal_proba[valid_goals.index(goal)])
        else:
            final_goal = model_goal
            final_goal_confidence = model_goal_confidence

        # --- Niveau final ---
        valid_levels = list(level_classes)
        if level and level in valid_levels:
            final_level = level
            final_level_confidence = float(level_proba[valid_levels.index(level)])
        elif self.model_level is not None:
            final_level = model_level
            final_level_confidence = model_level_confidence
        else:
            final_level = self._resolve_level_fallback(age, weight, body_fat)
            final_level_confidence = 0.5

        confidence = final_goal_confidence * 0.6 + final_level_confidence * 0.4

        # ✅ Passer body_fat et muscle_mass avec des valeurs par défaut sécurisées
        program = self.generate_program(
            profile=profile,
            goal=final_goal, 
            level=final_level,
            age=age,
            weight=weight,
            body_fat=body_fat,
            muscle_mass=muscle_mass
        )
        
        explanation = self.generate_explanation(
            final_goal, final_level, confidence,
            model_goal, final_goal, model_level, final_level,
            final_goal_confidence, final_level_confidence
        )

        return {
            'goal': final_goal,
            'level': final_level,
            'program': program,
            'confidence_score': round(confidence, 3),
            'goal_confidence': round(final_goal_confidence, 3),
            'level_confidence': round(final_level_confidence, 3),
            'model_suggested_goal': model_goal,
            'model_suggested_level': model_level,
            'explanation': explanation
        }

    def _resolve_level_fallback(self, age, weight, body_fat):
        """Filet de sécurité UNIQUEMENT si le modèle ML n'a pas pu être chargé."""
        score = 0
        if age > 50:
            score += 1.5
        elif age > 40:
            score += 0.5
        if weight > 100:
            score += 1
        elif weight > 80:
            score += 0.5
        if body_fat > 28:
            score += 1
        elif body_fat > 22:
            score += 0.5
        if score >= 2:
            return 'debutant'
        elif score >= 1:
            return 'intermediaire'
        return 'avance'

    def generate_program(self, profile: Dict, goal: str, level: str, age: int = 30, 
                         weight: float = 70, body_fat: float = 20, muscle_mass: float = 35) -> Dict:
        """Générer le programme avec ajustements dynamiques"""
        base = self._base_programs()[goal][level]
        program = copy.deepcopy(base)

        duration_str = program['schedule']['duration']
        base_minutes = int(''.join(filter(str.isdigit, duration_str)))
        adjustment = 0

        if age > 50:
            adjustment -= 10
        elif age < 25:
            adjustment += 5

        if body_fat > 30 and goal == 'perte_de_poids':
            adjustment += 10
        elif body_fat < 15 and goal == 'prise_de_masse':
            adjustment += 5

        if weight > 100:
            adjustment -= 5
        elif weight < 60:
            adjustment += 5

        adjusted_minutes = max(20, min(90, base_minutes + adjustment))
        program['schedule']['duration'] = f"{adjusted_minutes} minutes"
        program['schedule']['note'] = (
            f"Ajusté selon votre profil (âge={age}, poids={weight}kg, body_fat={body_fat:.1f}%)"
        )
        return program

    def generate_explanation(self, goal, level, confidence, model_goal, final_goal,
                              model_level, final_level, goal_conf, level_conf) -> str:
        goal_texts = {
            'perte_de_poids': 'perte de poids (brûler des calories)',
            'prise_de_masse': 'prise de masse (développer la musculature)',
            'remise_en_forme': 'remise en forme (améliorer la condition physique)'
        }
        level_texts = {
            'debutant': 'débutant (exercices progressifs)',
            'intermediaire': 'intermédiaire (intensité modérée)',
            'avance': 'avancé (intensité élevée)'
        }

        notes = []
        if model_goal != final_goal:
            notes.append(f"le modèle suggérait l'objectif '{model_goal}' mais '{final_goal}' a été imposé")
        if model_level != final_level:
            notes.append(f"le modèle suggérait le niveau '{model_level}' mais '{final_level}' a été imposé")
        note = f" (Note: {'; '.join(notes)}.)" if notes else ""

        return (
            f"Programme personnalisé pour {goal_texts.get(goal, goal)} "
            f"avec un niveau {level_texts.get(level, level)}. "
            f"Confiance: {int(confidence * 100)}% (objectif: {int(goal_conf * 100)}%, "
            f"niveau: {int(level_conf * 100)}%).{note}"
        )

    def _base_programs(self) -> Dict:
        """Programmes de base"""
        return {
            'perte_de_poids': {
                'debutant': {
                    'name': 'Programme Perte de Poids - Débutant',
                    'description': 'Programme adapté pour commencer votre perte de poids en douceur',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Cardio 30 min', 'Circuit training léger']},
                        {'day': 'Mercredi', 'exercises': ['Cardio 35 min', 'Musculation légère']},
                        {'day': 'Vendredi', 'exercises': ['Cardio 30 min', 'Étirements']}
                    ],
                    'schedule': {'frequency': '3 fois par semaine', 'duration': '45 minutes'}
                },
                'intermediaire': {
                    'name': 'Programme Perte de Poids - Intermédiaire',
                    'description': 'Programme intensifié pour accélérer votre perte de poids',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Cardio 45 min', 'HIIT 15 min', 'Musculation']},
                        {'day': 'Mercredi', 'exercises': ['Cardio 40 min', 'Circuit training']},
                        {'day': 'Vendredi', 'exercises': ['Cardio 45 min', 'HIIT 20 min']},
                        {'day': 'Samedi', 'exercises': ['Cardio 30 min', 'Musculation']}
                    ],
                    'schedule': {'frequency': '4 fois par semaine', 'duration': '60 minutes'}
                },
                'avance': {
                    'name': 'Programme Perte de Poids - Avancé',
                    'description': 'Programme intense pour une perte de poids maximale',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Cardio 60 min', 'HIIT 25 min', 'Musculation avancée']},
                        {'day': 'Mardi', 'exercises': ['Cardio 50 min', 'Circuit training intensif']},
                        {'day': 'Jeudi', 'exercises': ['Cardio 60 min', 'HIIT 30 min']},
                        {'day': 'Vendredi', 'exercises': ['Cardio 45 min', 'Musculation avancée']},
                        {'day': 'Samedi', 'exercises': ['Cardio 40 min', 'HIIT 20 min']}
                    ],
                    'schedule': {'frequency': '5 fois par semaine', 'duration': '75 minutes'}
                }
            },
            'prise_de_masse': {
                'debutant': {
                    'name': 'Programme Prise de Masse - Débutant',
                    'description': 'Commencez votre prise de masse musculaire',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Musculation (haut du corps)', 'Cardio léger']},
                        {'day': 'Mercredi', 'exercises': ['Musculation (bas du corps)', 'Cardio léger']},
                        {'day': 'Vendredi', 'exercises': ['Musculation (corps entier)']}
                    ],
                    'schedule': {'frequency': '3 fois par semaine', 'duration': '50 minutes'}
                },
                'intermediaire': {
                    'name': 'Programme Prise de Masse - Intermédiaire',
                    'description': 'Programme structuré pour une prise de masse efficace',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Musculation (poitrine, dos)', 'Cardio modéré']},
                        {'day': 'Mardi', 'exercises': ['Musculation (jambes, abdos)']},
                        {'day': 'Jeudi', 'exercises': ['Musculation (épaules, bras)']},
                        {'day': 'Vendredi', 'exercises': ['Musculation (corps entier)', 'Cardio']}
                    ],
                    'schedule': {'frequency': '4 fois par semaine', 'duration': '60 minutes'}
                },
                'avance': {
                    'name': 'Programme Prise de Masse - Avancé',
                    'description': 'Programme intensif pour une prise de masse maximale',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Musculation (pecs, triceps)', 'Cardio 15 min']},
                        {'day': 'Mardi', 'exercises': ['Musculation (dos, biceps)', 'Cardio 15 min']},
                        {'day': 'Mercredi', 'exercises': ['Musculation (jambes, abdos)']},
                        {'day': 'Jeudi', 'exercises': ['Musculation (épaules, trapèzes)']},
                        {'day': 'Vendredi', 'exercises': ['Musculation (corps entier)']},
                        {'day': 'Samedi', 'exercises': ['Cardio 20 min', 'Étirements']}
                    ],
                    'schedule': {'frequency': '5-6 fois par semaine', 'duration': '70 minutes'}
                }
            },
            'remise_en_forme': {
                'debutant': {
                    'name': 'Programme Remise en Forme - Débutant',
                    'description': 'Reprenez le sport en douceur',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Cardio 20 min', 'Renforcement musculaire léger']},
                        {'day': 'Mercredi', 'exercises': ['Cardio 25 min', 'Étirements']},
                        {'day': 'Vendredi', 'exercises': ['Cardio 20 min', 'Renforcement']}
                    ],
                    'schedule': {'frequency': '3 fois par semaine', 'duration': '40 minutes'}
                },
                'intermediaire': {
                    'name': 'Programme Remise en Forme - Intermédiaire',
                    'description': 'Améliorez votre condition physique',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Cardio 30 min', 'Circuit training']},
                        {'day': 'Mardi', 'exercises': ['Cardio 25 min', 'Renforcement']},
                        {'day': 'Jeudi', 'exercises': ['Cardio 35 min', 'Circuit training']},
                        {'day': 'Samedi', 'exercises': ['Cardio 20 min', 'Étirements']}
                    ],
                    'schedule': {'frequency': '4 fois par semaine', 'duration': '50 minutes'}
                },
                'avance': {
                    'name': 'Programme Remise en Forme - Avancé',
                    'description': 'Programme complet pour une forme optimale',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Cardio 40 min', 'HIIT 15 min']},
                        {'day': 'Mardi', 'exercises': ['Cardio 30 min', 'Musculation']},
                        {'day': 'Mercredi', 'exercises': ['Cardio 35 min', 'Circuit training']},
                        {'day': 'Jeudi', 'exercises': ['Cardio 30 min', 'Musculation']},
                        {'day': 'Vendredi', 'exercises': ['Cardio 45 min', 'HIIT 20 min']},
                        {'day': 'Samedi', 'exercises': ['Cardio 25 min', 'Étirements']}
                    ],
                    'schedule': {'frequency': '5-6 fois par semaine', 'duration': '60 minutes'}
                }
            }
        }


if __name__ == '__main__':
    import shutil
    os.environ['MODEL_PATH'] = './models_v4_test/'
    if os.path.exists('./models_v4_test/'):
        shutil.rmtree('./models_v4_test/')

    rec = ProgramRecommender()

    profile1 = {'age': 28, 'weight': 75.5, 'height': 180, 'bmi': 23.2, 'body_fat': 18.5, 'muscle_mass': 35.2}
    profile2 = {'age': 23, 'weight': 67.0, 'height': 178, 'bmi': 21.1, 'body_fat': None, 'muscle_mass': None}

    print("\n=== Profil 1 (complet) ===")
    result1 = rec.recommend_program(profile1, goal='perte_de_poids', level='intermediaire')
    print(f"Goal: {result1['goal']}, Level: {result1['level']}, Confiance: {result1['confidence_score']}")

    print("\n=== Profil 2 (body_fat = None, muscle_mass = None) ===")
    result2 = rec.recommend_program(profile2, goal='prise_de_masse', level='intermediaire')
    print(f"Goal: {result2['goal']}, Level: {result2['level']}, Confiance: {result2['confidence_score']}")
    print("✅ Les valeurs None sont maintenant gérées correctement !")