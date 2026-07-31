import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
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

    # ------------------------------------------------------------------ #
    # Model loading / training
    # ------------------------------------------------------------------ #

    def load_model(self):
        model_file = os.path.join(self.model_path, 'program_recommender_v6.pkl')
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

    # -- FIX 1: feature-driven, (mostly) deterministic label generation -- #

    @staticmethod
    def _goal_scores(age, bmi_noisy, body_fat, muscle_mass, noise_std=0.5):
        """Score each goal from features. Higher score = more likely.
        Only mild noise is added, so the label is a real function of the
        features instead of an almost-independent coin flip."""
        scores = {
            'perte_de_poids':
                max(0.0, bmi_noisy - 25) * 2.0 + max(0.0, body_fat - 22) * 1.5,
            'prise_de_masse':
                max(0.0, 23 - bmi_noisy) * 2.0 + max(0.0, 30 - muscle_mass) * 1.2,
            'modelage_raffermissement':
                max(0.0, bmi_noisy - 23) * 1.2 + max(0.0, 25 - muscle_mass) * 0.8,
            'remise_en_forme':
                5.0 - abs(bmi_noisy - 22) * 0.5,  # peaks near "normal" BMI
            'recuperation_bien_etre':
                max(0.0, age - 45) * 0.3 + max(0.0, body_fat - 25) * 0.5,
            'lifting_naturel':
                max(0.0, age - 45) * 0.4,
        }
        for k in scores:
            scores[k] += np.random.normal(0, noise_std)
        return scores

    # Thresholds picked from the empirical tertiles of `_readiness_score`
    # over the training feature ranges so the three level classes come
    # out roughly balanced.
    _LEVEL_LOW_THRESHOLD = -0.69
    _LEVEL_HIGH_THRESHOLD = 0.91

    @staticmethod
    def _readiness_score(age, body_fat, muscle_mass, weight, noise_std=0.15):
        """A single continuous 'training readiness' score: higher means
        the person can handle more intensity. Levels are ordinal
        (débutant < intermédiaire < avancé), so we threshold ONE score
        instead of having three classes compete on separate formulas —
        this gives the forest a clean, learnable ordinal boundary."""
        readiness = (
            (muscle_mass - 30) * 0.15
            - max(0.0, age - 40) * 0.08
            - max(0.0, body_fat - 20) * 0.1
            - max(0.0, weight - 90) * 0.05
        )
        readiness += np.random.normal(0, noise_std)
        return readiness

    @classmethod
    def _level_from_readiness(cls, readiness):
        if readiness <= cls._LEVEL_LOW_THRESHOLD:
            return 'debutant'
        elif readiness <= cls._LEVEL_HIGH_THRESHOLD:
            return 'intermediaire'
        return 'avance'

    def train_model(self):
        np.random.seed(RANDOM_SEED)
        random.seed(RANDOM_SEED)

        n_samples = 50000
        age = np.random.randint(18, 65, n_samples)
        weight = np.random.uniform(50, 120, n_samples)
        height = np.random.uniform(150, 200, n_samples)
        bmi = weight / ((height / 100) ** 2)
        body_fat = np.random.uniform(8, 40, n_samples)
        muscle_mass = np.random.uniform(25, 55, n_samples)

        bmi_noisy = bmi + np.random.normal(0, 1.5, n_samples)

        goals = []
        levels = []
        for i in range(n_samples):
            goal_scores = self._goal_scores(age[i], bmi_noisy[i], body_fat[i], muscle_mass[i])
            goals.append(max(goal_scores, key=goal_scores.get))

            readiness = self._readiness_score(age[i], body_fat[i], muscle_mass[i], weight[i])
            levels.append(self._level_from_readiness(readiness))

        data = pd.DataFrame({
            'age': age, 'weight': weight, 'height': height, 'bmi': bmi,
            'body_fat': body_fat, 'muscle_mass': muscle_mass,
            'goal': goals, 'level': levels
        })

        print("📊 Distribution des objectifs:")
        print(data['goal'].value_counts(normalize=True).round(3))
        print("📊 Distribution des niveaux:")
        print(data['level'].value_counts(normalize=True).round(3))

        self.label_encoders['goal'] = LabelEncoder()
        self.label_encoders['level'] = LabelEncoder()
        y_goal = self.label_encoders['goal'].fit_transform(data['goal'])
        y_level = self.label_encoders['level'].fit_transform(data['level'])

        X = data[self.feature_columns].values
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        X_train, X_test, y_goal_train, y_goal_test = train_test_split(
            X_scaled, y_goal, test_size=0.2, random_state=RANDOM_SEED, stratify=y_goal
        )
        _, _, y_level_train, y_level_test = train_test_split(
            X_scaled, y_level, test_size=0.2, random_state=RANDOM_SEED, stratify=y_level
        )

        self.model_goal = RandomForestClassifier(
            n_estimators=400, max_depth=15, min_samples_leaf=3, random_state=RANDOM_SEED
        )
        self.model_goal.fit(X_train, y_goal_train)

        self.model_level = RandomForestClassifier(
            n_estimators=250, max_depth=12, min_samples_leaf=5, random_state=RANDOM_SEED
        )
        self.model_level.fit(X_train, y_level_train)

        goal_accuracy = self.model_goal.score(X_test, y_goal_test)
        level_accuracy = self.model_level.score(X_test, y_level_test)
        print(f"📊 Précision objectif: {goal_accuracy:.2%}")
        print(f"📊 Précision niveau: {level_accuracy:.2%}")

        # -- FIX 4: quick evaluation to spot class confusion -- #
        try:
            goal_pred = self.model_goal.predict(X_test)
            print("\n--- Rapport de classification (objectif) ---")
            print(classification_report(
                y_goal_test, goal_pred,
                target_names=self.label_encoders['goal'].classes_,
                zero_division=0
            ))
            print("Matrice de confusion (objectif):")
            print(confusion_matrix(y_goal_test, goal_pred))

            level_pred = self.model_level.predict(X_test)
            print("\n--- Rapport de classification (niveau) ---")
            print(classification_report(
                y_level_test, level_pred,
                target_names=self.label_encoders['level'].classes_,
                zero_division=0
            ))
            print("Matrice de confusion (niveau):")
            print(confusion_matrix(y_level_test, level_pred))
        except Exception as e:
            print(f"⚠️ Évaluation impossible: {e}")

        model_data = {
            'model_goal': self.model_goal,
            'model_level': self.model_level,
            'scaler': self.scaler,
            'encoders': self.label_encoders,
            'goal_accuracy': goal_accuracy,
            'level_accuracy': level_accuracy
        }
        joblib.dump(model_data, os.path.join(self.model_path, 'program_recommender_v6.pkl'))
        print("✅ Modèles ML sauvegardés")

    # ------------------------------------------------------------------ #
    # Recommendation
    # ------------------------------------------------------------------ #

    def recommend_program(self, profile: Dict, goal: Optional[str] = None, level: Optional[str] = None) -> Dict:
        age = profile.get('age', 30)
        weight = profile.get('weight', 70)
        height = profile.get('height', 175)
        bmi = profile.get('bmi', weight / ((height / 100) ** 2))

        body_fat = profile.get('body_fat')
        muscle_mass = profile.get('muscle_mass')

        if body_fat is None:
            if age < 30:
                body_fat = 15 + (weight - 60) * 0.2
            elif age < 50:
                body_fat = 20 + (weight - 60) * 0.15
            else:
                body_fat = 25 + (weight - 60) * 0.1
            body_fat = max(8, min(40, body_fat))

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

        # --- Objectif final --- #
        valid_goals = list(goal_classes)
        goal_overridden = False
        if goal and goal in valid_goals:
            final_goal = goal
            final_goal_confidence = float(goal_proba[valid_goals.index(goal)])
            goal_overridden = (goal != model_goal)
        else:
            final_goal = model_goal
            final_goal_confidence = model_goal_confidence

        # --- Niveau final --- #
        valid_levels = list(level_classes)
        level_overridden = False
        if level and level in valid_levels:
            final_level = level
            final_level_confidence = float(level_proba[valid_levels.index(level)])
            level_overridden = (level != model_level)
        elif self.model_level is not None:
            final_level = model_level
            final_level_confidence = model_level_confidence
        else:
            final_level = self._resolve_level_fallback(age, weight, body_fat)
            final_level_confidence = 0.5

        # -- FIX 3: don't blend confidence for a class the user forced -- #
        confidence = self._compute_overall_confidence(
            final_goal_confidence, final_level_confidence,
            goal_overridden, level_overridden
        )

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
            final_goal=final_goal,
            final_level=final_level,
            confidence=confidence,
            model_goal=model_goal,
            model_level=model_level,
            model_goal_confidence=model_goal_confidence,
            model_level_confidence=model_level_confidence,
            final_goal_confidence=final_goal_confidence,
            final_level_confidence=final_level_confidence,
            goal_overridden=goal_overridden,
            level_overridden=level_overridden,
        )

        return {
            'goal': final_goal,
            'level': final_level,
            'program': program,
            'confidence_score': None if confidence is None else round(confidence, 3),
            'goal_confidence': round(final_goal_confidence, 3),
            'level_confidence': round(final_level_confidence, 3),
            'goal_overridden': goal_overridden,
            'level_overridden': level_overridden,
            'model_suggested_goal': model_goal,
            'model_suggested_level': model_level,
            'model_goal_confidence': round(model_goal_confidence, 3),
            'model_level_confidence': round(model_level_confidence, 3),
            'explanation': explanation
        }

    # -- FIX 3 helper: confidence formula that doesn't penalize user overrides -- #
    @staticmethod
    def _compute_overall_confidence(final_goal_confidence, final_level_confidence,
                                     goal_overridden, level_overridden):
        """
        Returns a single blended confidence score for the *model's own*
        contribution to the recommendation. If the user overrode both goal
        and level, there's nothing left for the model to be "confident"
        about, so we return None rather than a misleading number.
        """
        if goal_overridden and level_overridden:
            return None
        if goal_overridden:
            return final_level_confidence
        if level_overridden:
            return final_goal_confidence
        return final_goal_confidence * 0.6 + final_level_confidence * 0.4

    def _resolve_level_fallback(self, age, weight, body_fat):
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

    # ------------------------------------------------------------------ #
    # Program generation (unchanged logic)
    # ------------------------------------------------------------------ #

    def generate_program(self, profile: Dict, goal: str, level: str, age: int = 30,
                          weight: float = 70, body_fat: float = 20, muscle_mass: float = 35) -> Dict:
        """Générer le programme avec les objectifs et 2 jours par semaine"""
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

    # -- FIX 2: explanation now clearly separates "model's own confidence"
    #    from "how much the model agrees with a user override" -- #
    def generate_explanation(self, final_goal, final_level, confidence,
                              model_goal, model_level,
                              model_goal_confidence, model_level_confidence,
                              final_goal_confidence, final_level_confidence,
                              goal_overridden, level_overridden) -> str:
        goal_texts = {
            'perte_de_poids': 'perte de poids (brûler des calories)',
            'prise_de_masse': 'prise de masse (développer la musculature)',
            'remise_en_forme': 'remise en forme (améliorer la condition physique)',
            'modelage_raffermissement': 'modelage & raffermissement (sculpter votre silhouette)',
            'recuperation_bien_etre': 'récupération & bien-être (retrouver votre tonicité)',
            'lifting_naturel': 'lifting naturel & anti-âge (rajeunir votre peau)'
        }
        level_texts = {
            'debutant': 'débutant (exercices progressifs)',
            'intermediaire': 'intermédiaire (intensité modérée)',
            'avance': 'avancé (intensité élevée)'
        }

        notes = []
        if goal_overridden:
            notes.append(
                f"le modèle privilégiait l'objectif '{model_goal}' "
                f"({int(model_goal_confidence * 100)}%), mais '{final_goal}' a été imposé "
                f"(probabilité du modèle pour ce choix: {int(final_goal_confidence * 100)}%)"
            )
        if level_overridden:
            notes.append(
                f"le modèle privilégiait le niveau '{model_level}' "
                f"({int(model_level_confidence * 100)}%), mais '{final_level}' a été imposé "
                f"(probabilité du modèle pour ce choix: {int(final_level_confidence * 100)}%)"
            )
        note = f" (Note: {'; '.join(notes)}.)" if notes else ""

        if confidence is None:
            confidence_text = (
                "Objectif et niveau ont été choisis par vous ; "
                "aucun score de confiance du modèle n'est applicable ici."
            )
        else:
            confidence_text = f"Confiance: {int(confidence * 100)}%."

        return (
            f"Programme personnalisé pour {goal_texts.get(final_goal, final_goal)} "
            f"avec un niveau {level_texts.get(final_level, final_level)}. "
            f"{confidence_text}{note}"
        )

    # ------------------------------------------------------------------ #
    # Static base programs (unchanged)
    # ------------------------------------------------------------------ #

    def _base_programs(self) -> Dict:
        """Programmes de base avec 6 objectifs et 2 jours par semaine"""
        return {
            'perte_de_poids': {
                'debutant': {
                    'name': 'Programme Perte de Poids - Débutant',
                    'description': 'Programme adapté pour commencer votre perte de poids avec l\'EMS',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Squat EMS - 20 min', 'Gainage EMS - 15 min']},
                        {'day': 'Jeudi', 'exercises': ['Demi-squat EMS - 20 min', 'Bird Dog EMS - 15 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '45 minutes'}
                },
                'intermediaire': {
                    'name': 'Programme Perte de Poids - Intermédiaire',
                    'description': 'Programme intensifié pour accélérer votre perte de poids avec l\'EMS',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Squat EMS - 25 min', 'Gainage EMS - 20 min', 'Mountain Climber EMS - 15 min']},
                        {'day': 'Jeudi', 'exercises': ['Fente EMS - 25 min', 'Crunch EMS - 20 min', 'Jump Squat EMS - 15 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '60 minutes'}
                },
                'avance': {
                    'name': 'Programme Perte de Poids - Avancé',
                    'description': 'Programme intense pour une perte de poids maximale avec l\'EMS',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Jump Squat EMS - 25 min', 'Mountain Climber EMS - 20 min', 'Gainage EMS - 20 min']},
                        {'day': 'Jeudi', 'exercises': ['Squat EMS - 25 min', 'Russian Twist EMS - 20 min', 'Planche latérale EMS - 15 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '75 minutes'}
                }
            },
            'prise_de_masse': {
                'debutant': {
                    'name': 'Programme Prise de Masse - Débutant',
                    'description': 'Commencez votre prise de masse musculaire avec l\'EMS',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Squat EMS - 20 min', 'Gainage EMS - 15 min']},
                        {'day': 'Jeudi', 'exercises': ['Demi-squat EMS - 20 min', 'Pont fessier EMS - 15 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '50 minutes'}
                },
                'intermediaire': {
                    'name': 'Programme Prise de Masse - Intermédiaire',
                    'description': 'Programme structuré pour une prise de masse efficace avec l\'EMS',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Squat EMS - 25 min', 'Pont fessier EMS - 20 min', 'Gainage EMS - 15 min']},
                        {'day': 'Jeudi', 'exercises': ['Fente EMS - 25 min', 'Crunch EMS - 20 min', 'Superman EMS - 15 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '60 minutes'}
                },
                'avance': {
                    'name': 'Programme Prise de Masse - Avancé',
                    'description': 'Programme intensif pour une prise de masse maximale avec l\'EMS',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Jump Squat EMS - 25 min', 'Squat EMS - 20 min', 'Gainage EMS - 20 min']},
                        {'day': 'Jeudi', 'exercises': ['Fente EMS - 25 min', 'Planche latérale EMS - 20 min', 'Russian Twist EMS - 15 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '70 minutes'}
                }
            },
            'remise_en_forme': {
                'debutant': {
                    'name': 'Programme Remise en Forme - Débutant',
                    'description': 'Améliorez votre condition physique avec l\'EMS',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Squat EMS - 20 min', 'Gainage EMS - 15 min']},
                        {'day': 'Jeudi', 'exercises': ['Demi-squat EMS - 20 min', 'Bird Dog EMS - 15 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '40 minutes'}
                },
                'intermediaire': {
                    'name': 'Programme Remise en Forme - Intermédiaire',
                    'description': 'Améliorez votre condition physique globale avec l\'EMS',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Squat EMS - 25 min', 'Gainage EMS - 20 min', 'Mountain Climber EMS - 15 min']},
                        {'day': 'Jeudi', 'exercises': ['Fente EMS - 25 min', 'Crunch EMS - 20 min', 'Planche latérale EMS - 15 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '50 minutes'}
                },
                'avance': {
                    'name': 'Programme Remise en Forme - Avancé',
                    'description': 'Programme complet pour une forme optimale avec l\'EMS',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Jump Squat EMS - 25 min', 'Mountain Climber EMS - 20 min', 'Gainage EMS - 15 min']},
                        {'day': 'Jeudi', 'exercises': ['Squat EMS - 25 min', 'Russian Twist EMS - 20 min', 'Planche latérale EMS - 15 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '60 minutes'}
                }
            },
            'modelage_raffermissement': {
                'debutant': {
                    'name': 'Programme Modelage & Raffermissement - Débutant',
                    'description': 'Sculptez votre silhouette avec l\'EMS et I-Shape',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Drainage lymphatique - 25 min', 'Raffermissement des cuisses - 20 min']},
                        {'day': 'Jeudi', 'exercises': ['Raffermissement des fessiers - 25 min', 'Réduction de la cellulite - 20 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '50 minutes'}
                },
                'intermediaire': {
                    'name': 'Programme Modelage & Raffermissement - Intermédiaire',
                    'description': 'Programme complet pour sculpter votre silhouette',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Drainage lymphatique - 30 min', 'Raffermissement des cuisses - 25 min', 'Réduction de la cellulite - 20 min']},
                        {'day': 'Jeudi', 'exercises': ['Raffermissement des fessiers - 30 min', 'Raffermissement des bras - 25 min', 'Drainage lymphatique - 20 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '60 minutes'}
                },
                'avance': {
                    'name': 'Programme Modelage & Raffermissement - Avancé',
                    'description': 'Programme intensif pour une silhouette sculptée',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Drainage lymphatique - 35 min', 'Raffermissement des cuisses - 30 min', 'Réduction de la cellulite - 25 min']},
                        {'day': 'Jeudi', 'exercises': ['Raffermissement des fessiers - 35 min', 'Raffermissement des bras - 30 min', 'Drainage lymphatique - 25 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '70 minutes'}
                }
            },
            'recuperation_bien_etre': {
                'debutant': {
                    'name': 'Programme Récupération & Bien-être - Débutant',
                    'description': 'Retrouvez votre tonicité et soulagez les douleurs avec l\'EMS',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Renforcement abdominal - 25 min', 'Renforcement lombaire - 20 min']},
                        {'day': 'Jeudi', 'exercises': ['Renforcement fessiers - 25 min', 'Renforcement abdominal - 20 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '45 minutes'}
                },
                'intermediaire': {
                    'name': 'Programme Récupération & Bien-être - Intermédiaire',
                    'description': 'Programme complet pour votre bien-être avec I-Model',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Renforcement abdominal - 30 min', 'Renforcement lombaire - 25 min', 'Renforcement fessiers - 20 min']},
                        {'day': 'Jeudi', 'exercises': ['Renforcement fessiers - 30 min', 'Renforcement quadriceps - 25 min', 'Renforcement abdominal - 20 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '60 minutes'}
                },
                'avance': {
                    'name': 'Programme Récupération & Bien-être - Avancé',
                    'description': 'Programme intensif pour une récupération optimale',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Renforcement abdominal - 35 min', 'Renforcement lombaire - 30 min', 'Renforcement fessiers - 25 min']},
                        {'day': 'Jeudi', 'exercises': ['Renforcement quadriceps - 35 min', 'Renforcement abdominal - 30 min', 'Renforcement lombaire - 25 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '70 minutes'}
                }
            },
            'lifting_naturel': {
                'debutant': {
                    'name': 'Programme Lifting Naturel & Anti-âge - Débutant',
                    'description': 'Raffermissez votre visage avec I-Face',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Raffermissement du front - 25 min', 'Tonification des joues - 20 min']},
                        {'day': 'Jeudi', 'exercises': ['Raffermissement du cou - 25 min', 'Stimulation du collagène - 20 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '45 minutes'}
                },
                'intermediaire': {
                    'name': 'Programme Lifting Naturel & Anti-âge - Intermédiaire',
                    'description': 'Programme complet pour rajeunir votre peau',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Raffermissement du front - 30 min', 'Tonification des joues - 25 min', 'Stimulation du collagène - 20 min']},
                        {'day': 'Jeudi', 'exercises': ['Raffermissement du cou - 30 min', 'Stimulation du collagène - 25 min', 'Tonification des joues - 20 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '60 minutes'}
                },
                'avance': {
                    'name': 'Programme Lifting Naturel & Anti-âge - Avancé',
                    'description': 'Programme intensif pour un lifting naturel',
                    'exercises': [
                        {'day': 'Lundi', 'exercises': ['Stimulation du collagène - 35 min', 'Raffermissement du front - 30 min', 'Tonification des joues - 25 min']},
                        {'day': 'Jeudi', 'exercises': ['Raffermissement du cou - 35 min', 'Stimulation du collagène - 30 min', 'Raffermissement du front - 25 min']}
                    ],
                    'schedule': {'frequency': '2 fois par semaine', 'duration': '70 minutes'}
                }
            }
        }


if __name__ == '__main__':
    import shutil
    os.environ['MODEL_PATH'] = './models_v6_test/'
    if os.path.exists('./models_v6_test/'):
        shutil.rmtree('./models_v6_test/')

    rec = ProgramRecommender()

    profile1 = {'age': 28, 'weight': 75.5, 'height': 180, 'bmi': 23.2, 'body_fat': 18.5, 'muscle_mass': 35.2}
    profile2 = {'age': 55, 'weight': 85.0, 'height': 175, 'bmi': 27.8, 'body_fat': 25.0, 'muscle_mass': 30.0}
    profile3 = {'age': 23, 'weight': 65.5, 'height': 178, 'bmi': 20.7, 'body_fat': 14.5, 'muscle_mass': 38.0}

    print("\n=== Profil 1 (jeune, override goal+level) ===")
    result1 = rec.recommend_program(profile1, goal='perte_de_poids', level='intermediaire')
    print(f"Goal: {result1['goal']}, Level: {result1['level']}, Confiance: {result1['confidence_score']}")
    print(result1['explanation'])

    print("\n=== Profil 2 (senior, aucun override) ===")
    result2 = rec.recommend_program(profile2)
    print(f"Goal: {result2['goal']}, Level: {result2['level']}, Confiance: {result2['confidence_score']}")
    print(result2['explanation'])

    print("\n=== Profil 3 (comme la requête API, override level uniquement) ===")
    result3 = rec.recommend_program(profile3, goal='prise_de_masse', level='intermediaire')
    print(f"Goal: {result3['goal']}, Level: {result3['level']}, Confiance: {result3['confidence_score']}")
    print(result3['explanation'])