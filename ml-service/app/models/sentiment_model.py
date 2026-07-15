import numpy as np
import pandas as pd
import json
import os
import re
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report
import nltk
from nltk.stem import SnowballStemmer
from typing import Dict, List, Tuple

# Télécharger les ressources NLTK
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

# Mots de négation français qui inversent la polarité du mot suivant
NEGATION_WORDS = {
    'ne', 'pas', 'jamais', 'aucun', 'aucune', 'rien', 'sans', 'ni', 'non'
}


class SentimentModel:
    def __init__(self):
        self.vectorizer = None
        self.classifier = None
        self.stemmer = SnowballStemmer('french')
        self.model_path = os.getenv('MODEL_PATH', './models/')
        os.makedirs(self.model_path, exist_ok=True)
        self.load_model()

    def load_model(self):
        """Charger le modèle entraîné ou créer un nouveau"""
        model_file = os.path.join(self.model_path, 'sentiment_model.pkl')
        vectorizer_file = os.path.join(self.model_path, 'sentiment_vectorizer.pkl')

        if os.path.exists(model_file) and os.path.exists(vectorizer_file):
            self.classifier = joblib.load(model_file)
            self.vectorizer = joblib.load(vectorizer_file)
            print("✅ Modèle de sentiment chargé")
        else:
            print("🔄 Création du modèle de sentiment...")
            self.train_model()

    def preprocess_text(self, text: str) -> str:
        """
        Prétraiter le texte.
        - Conserve les apostrophes pour ne pas fusionner "j'adore" en "jadore"
          en un seul token (on les remplace par un espace à la place).
        - Fusionne les mots de négation avec le mot suivant en un seul token
          (ex: "pas content" -> "pas_content") pour que le TF-IDF capte
          la polarité inversée au lieu de compter "pas" et "content" séparément.
        """
        if not text:
            return ""
        text = text.lower()
        text = text.replace("'", " ").replace("’", " ")
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\d+', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        words = text.split()

        # Fusion négation + mot suivant
        merged_words = []
        skip_next = False
        for i, word in enumerate(words):
            if skip_next:
                skip_next = False
                continue
            if word in NEGATION_WORDS and i + 1 < len(words):
                merged_words.append(f"{word}_{words[i + 1]}")
                skip_next = True
            else:
                merged_words.append(word)

        # Stemming (on ne stemme pas les tokens fusionnés négation+mot pour
        # garder le signal intact, le stemmer francais gère mal les "_")
        stemmed = []
        for w in merged_words:
            if '_' in w:
                parts = w.split('_')
                stemmed.append('_'.join(self.stemmer.stem(p) for p in parts))
            else:
                stemmed.append(self.stemmer.stem(w))

        return ' '.join(stemmed)

    def _build_training_data(self) -> Dict[str, List[str]]:
        """
        Dataset élargi de phrases complètes et naturelles, dans le style
        d'avis utilisateurs réels (coaching sportif / app fitness), incluant
        négations, fautes courantes et registres de langue variés.
        """
        return {
            'positive': [
                "super séance aujourd'hui avec mon coach",
                "très bon coach, il m'a vraiment motivé",
                "excellent programme d'entraînement",
                "j'adore l'application, elle est super intuitive",
                "génial, j'ai enfin atteint mon objectif",
                "parfait du début à la fin",
                "je suis très satisfait de mon abonnement",
                "formidable, je recommande à 100%",
                "l'équipe est top, toujours à l'écoute",
                "je suis ravi de mes progrès depuis un mois",
                "exceptionnel, le meilleur coach que j'ai eu",
                "merveilleux accompagnement personnalisé",
                "incroyable, j'ai perdu 5kg grâce au programme",
                "extraordinaire séance de cardio ce matin",
                "fantastique, l'app est devenue indispensable",
                "je recommande vivement cette salle",
                "brillant travail de la part du coach",
                "superbe expérience du début à la fin",
                "magnifique organisation des séances",
                "excellent travail sur le suivi nutritionnel",
                "j'ai adoré la nouvelle interface de l'application",
                "meilleur coach que j'ai jamais eu",
                "super application, très simple à utiliser",
                "le coach est vraiment à l'écoute de mes besoins",
                "les séances sont toujours bien organisées",
                "très content du rapport qualité prix",
                "l'application fonctionne parfaitement maintenant",
                "je progresse rapidement grâce aux conseils du coach",
                "top les nouvelles fonctionnalités de l'app",
                "vraiment satisfait de mon coaching personnalisé",
                "le planning est très pratique et flexible",
                "j'apprécie beaucoup la disponibilité de mon coach",
                "les exercices proposés sont variés et efficaces",
                "bravo pour cette mise à jour, beaucoup plus fluide",
                "je suis impressionné par les résultats obtenus",
                "un grand merci à toute l'équipe, service impeccable",
                "l'ambiance en salle est vraiment agréable",
                "matériel neuf et bien entretenu, au top",
                "réservation des séances ultra simple",
                "coach très pédagogue et patient",
                "je n'ai aucun regret d'avoir pris cet abonnement",
                "pas déçu du tout, bien au contraire",
                "ça fonctionne très bien, aucun bug à signaler",
                "le service client a résolu mon problème rapidement, super",
                "franchement génial cette nouvelle salle de sport",
                "les tarifs sont raisonnables pour la qualité proposée",
                "ce n'est pas mauvais du tout, plutôt satisfait",
                "pas mal du tout, je suis très content",
                "vraiment pas déçu, au contraire",
                "je ne suis pas insatisfait, bien au contraire",
                "c'est pas si mal finalement",
                "pas de problème, tout est parfait",
                "je n'ai rien à redire, excellent",
                "pas déçu du tout, c'est super",
                "ce n'est pas grave, ça va",
                "je ne suis pas mécontent du tout",
                "vraiment pas mal, je recommande",
                "pas déçu par le coaching, au top",
                "je n'ai pas été déçu, c'était génial",
                "c'était pas si mal, plutôt bien même",
                "pas insatisfait du tout, très content",
                "je ne vais pas me plaindre, c'était parfait",
            ],
            'negative': [
                "très déçu de la dernière séance",
                "mauvais service client, personne ne répond",
                "problème technique récurrent sur l'application",
                "je n'aime pas du tout le nouveau planning",
                "insatisfait de la qualité du coaching",
                "médiocre, je m'attendais à mieux",
                "à éviter, perte de temps et d'argent",
                "décevant par rapport au prix payé",
                "pas bien organisé du tout",
                "je suis mécontent de mon abonnement",
                "horrible expérience avec le coach",
                "catastrophique, l'application plante sans arrêt",
                "inacceptable de payer pour un service qui ne fonctionne pas",
                "énervant de devoir toujours relancer le support",
                "frustrant, impossible de réserver une séance",
                "déplorable état du matériel dans la salle",
                "navrant, le coach n'était même pas là",
                "vraiment triste de la tournure de mon abonnement",
                "déçu par le manque de suivi personnalisé",
                "pas content du tout de cette expérience",
                "gros problème avec la facturation ce mois-ci",
                "très mauvais accueil à la réception",
                "décevant, le coach annule souvent au dernier moment",
                "l'application ne fonctionne pas depuis la mise à jour",
                "je ne suis pas satisfait des résultats obtenus",
                "aucune réponse du support depuis une semaine",
                "jamais je ne recommanderai cette salle",
                "le coach n'écoute pas du tout mes besoins",
                "les vestiaires ne sont jamais propres",
                "je regrette d'avoir pris cet abonnement",
                "encore un bug sur l'application, c'est fatigant",
                "prix beaucoup trop élevé pour ce qui est proposé",
                "le planning change sans prévenir, c'est inadmissible",
                "toujours en retard, ça devient pénible",
                "matériel cassé et jamais réparé",
                "impossible d'annuler mon abonnement, service injoignable",
                "franchement nul, je demande un remboursement",
                "coach désagréable et peu professionnel",
                "l'app plante à chaque connexion, très énervant",
                "sans aucune considération pour les clients",
                "vraiment pas satisfait, je résilie mon abonnement",
                "aucun suivi depuis le début du programme",
                "salle sale et mal entretenue",
            ],
            'neutral': [
                "la séance était ok, rien de spécial",
                "moyen, sans plus",
                "pas mal dans l'ensemble",
                "correct pour le prix",
                "acceptable mais peut mieux faire",
                "standard, comme dans toutes les salles",
                "normal, rien à signaler de particulier",
                "dans l'ordre des choses habituelles",
                "rien de spécial à noter cette semaine",
                "c'est bien, sans être exceptionnel",
                "l'application est ok, fonctionne comme prévu",
                "c'est correct, ça fait le travail",
                "comme d'habitude, ni bien ni mal",
                "neutre, je n'ai pas d'avis particulier",
                "le service est standard, rien à redire de plus",
                "la séance s'est déroulée normalement",
                "le planning est correct, sans plus",
                "coach compétent, expérience classique",
                "l'app fait ce qu'on lui demande, basique",
                "prix dans la moyenne du marché",
                "salle correcte, ni plus ni moins",
                "abonnement classique, rien de marquant",
            ]
        }

    def train_model(self):
        """Entraîner le modèle de sentiment sur le dataset élargi"""
        training_data = self._build_training_data()

        texts = []
        labels = []

        for label, examples in training_data.items():
            for example in examples:
                texts.append(self.preprocess_text(example))
                labels.append(label)

        # unigrammes + bigrammes : capte les tokens fusionnés type "pas_bien"
        # ainsi que des expressions comme "très déçu", "super séance"
        self.vectorizer = TfidfVectorizer(
            max_features=3000,
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True
        )
        X = self.vectorizer.fit_transform(texts)

        X_train, X_test, y_train, y_test = train_test_split(
            X, labels, test_size=0.2, random_state=42, stratify=labels
        )

        self.classifier = LogisticRegression(
            max_iter=1000,
            class_weight='balanced',
            C=1.0
        )
        self.classifier.fit(X_train, y_train)

        y_pred = self.classifier.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        # Validation croisée en plus du split simple pour une estimation
        # moins optimiste de la performance réelle
        cv_scores = cross_val_score(self.classifier, X, labels, cv=5)

        print(f"📊 Précision du modèle de sentiment (test set): {accuracy:.2%}")
        print(f"📊 Précision moyenne (cross-validation 5-fold): {cv_scores.mean():.2%} (+/- {cv_scores.std():.2%})")
        print(classification_report(y_test, y_pred))

        joblib.dump(self.classifier, os.path.join(self.model_path, 'sentiment_model.pkl'))
        joblib.dump(self.vectorizer, os.path.join(self.model_path, 'sentiment_vectorizer.pkl'))
        print("✅ Modèle de sentiment entraîné et sauvegardé")

    def predict(self, text: str) -> Dict:
        """Prédire le sentiment d'un texte"""
        if not text or self.classifier is None:
            return {
                'sentiment': 'neutral',
                'confidence': 0.0,
                'positive_score': 0.0,
                'negative_score': 0.0,
                'neutral_score': 0.0
            }

        text_processed = self.preprocess_text(text)
        X = self.vectorizer.transform([text_processed])

        proba = self.classifier.predict_proba(X)[0]
        classes = self.classifier.classes_

        sentiment_scores = {}
        for i, class_name in enumerate(classes):
            sentiment_scores[class_name] = float(proba[i])

        sentiment = classes[np.argmax(proba)]
        confidence = float(np.max(proba))

        return {
            'sentiment': sentiment,
            'confidence': confidence,
            'positive_score': sentiment_scores.get('positive', 0.0),
            'negative_score': sentiment_scores.get('negative', 0.0),
            'neutral_score': sentiment_scores.get('neutral', 0.0)
        }


if __name__ == "__main__":
    # Test rapide en local : force le réentraînement puis teste quelques phrases
    import shutil
    test_model_path = './models_test/'
    if os.path.exists(test_model_path):
        shutil.rmtree(test_model_path)
    os.environ['MODEL_PATH'] = test_model_path

    model = SentimentModel()

    test_phrases = [
        "Super séance aujourd'hui avec mon coach !",
        "L'application plante tout le temps, c'est frustrant",
        "Le planning est correct, rien de spécial",
        "Je ne suis pas content du tout de ce service",  # négation à tester
        "Pas mal, mais pas génial non plus",
        "Ce n'est pas mauvais du tout, plutôt satisfait",  # double négation
    ]

    print("\n--- Tests de prédiction ---")
    for phrase in test_phrases:
        result = model.predict(phrase)
        print(f"'{phrase}' -> {result['sentiment']} (confiance: {result['confidence']:.2%})")