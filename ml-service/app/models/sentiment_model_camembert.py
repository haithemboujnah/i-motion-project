import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
from transformers import EarlyStoppingCallback
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import os
import warnings
from typing import Dict, List, Tuple  # ✅ Ajout de l'import manquant
warnings.filterwarnings('ignore')

class CamembertSentimentModel:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model_path = os.getenv('MODEL_PATH', './models/')
        os.makedirs(self.model_path, exist_ok=True)
        self.model_save_path = os.path.join(self.model_path, 'camembert_sentiment')
        self.label_map = {'positive': 0, 'negative': 1, 'neutral': 2}
        self.id_to_label = {0: 'positive', 1: 'negative', 2: 'neutral'}
        self.load_model()

    def load_model(self):
        """Charger le modèle CamemBERT entraîné ou utiliser le modèle pré-entraîné"""
        if os.path.exists(self.model_save_path):
            try:
                self.model = AutoModelForSequenceClassification.from_pretrained(self.model_save_path)
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_save_path)
                self.model.to(self.device)
                print("✅ Modèle CamemBERT chargé")
                return
            except Exception as e:
                print(f"⚠️ Erreur chargement modèle: {e}")
        
        print("🔄 Création du modèle CamemBERT...")
        self.train_model()

    def train_model(self):
        """Entraîner le modèle CamemBERT"""
        print("📊 Préparation des données...")
        
        # 1. Préparer les données d'entraînement
        texts, labels = self._prepare_training_data()
        
        # 2. Split train/validation
        train_texts, val_texts, train_labels, val_labels = train_test_split(
            texts, labels, test_size=0.15, random_state=42, stratify=labels
        )
        
        # 3. Charger le tokenizer et le modèle pré-entraîné
        print("🔄 Chargement du tokenizer et du modèle CamemBERT...")
        self.tokenizer = AutoTokenizer.from_pretrained("camembert-base")
        self.model = AutoModelForSequenceClassification.from_pretrained(
            "camembert-base",
            num_labels=3,
            id2label=self.id_to_label,
            label2id=self.label_map,
            ignore_mismatched_sizes=True
        )
        self.model.to(self.device)

        # 4. Tokenisation des données
        train_encodings = self.tokenizer(
            train_texts,
            truncation=True,
            padding=True,
            max_length=128,
            return_tensors="pt"
        )
        
        val_encodings = self.tokenizer(
            val_texts,
            truncation=True,
            padding=True,
            max_length=128,
            return_tensors="pt"
        )

        # 5. Créer les datasets
        class SentimentDataset(torch.utils.data.Dataset):
            def __init__(self, encodings, labels):
                self.encodings = encodings
                self.labels = labels

            def __getitem__(self, idx):
                item = {key: val[idx] for key, val in self.encodings.items()}
                item['labels'] = torch.tensor(self.labels[idx])
                return item

            def __len__(self):
                return len(self.labels)

        train_dataset = SentimentDataset(train_encodings, train_labels)
        val_dataset = SentimentDataset(val_encodings, val_labels)

        # 6. Configuration de l'entraînement
        training_args = TrainingArguments(
            output_dir=self.model_save_path,
            num_train_epochs=4,
            per_device_train_batch_size=8,
            per_device_eval_batch_size=8,
            warmup_steps=50,
            weight_decay=0.01,
            logging_dir=os.path.join(self.model_save_path, 'logs'),
            logging_steps=10,
            eval_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="accuracy",
            greater_is_better=True,
            save_total_limit=2,
            report_to="none",
            fp16=torch.cuda.is_available(),
            learning_rate=2e-5,
        )

        # 7. Métrique d'évaluation
        def compute_metrics(eval_pred):
            logits, labels = eval_pred
            predictions = np.argmax(logits, axis=-1)
            return {'accuracy': accuracy_score(labels, predictions)}

        # 8. Entraînement
        print("🚀 Entraînement de CamemBERT...")
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            compute_metrics=compute_metrics,
            callbacks=[EarlyStoppingCallback(early_stopping_patience=3)]
        )

        trainer.train()

        # 9. Évaluation finale
        print("📊 Évaluation du modèle...")
        eval_result = trainer.evaluate()
        print(f"📊 Précision sur validation: {eval_result.get('eval_accuracy', 0):.2%}")

        # 10. Sauvegarde du modèle
        self.model.save_pretrained(self.model_save_path)
        self.tokenizer.save_pretrained(self.model_save_path)
        print(f"✅ Modèle CamemBERT sauvegardé dans {self.model_save_path}")

    def _prepare_training_data(self) -> Tuple[List[str], List[int]]:
        """Préparer les données d'entraînement"""
        training_data = {
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
                "c'est catastrophique",
                "le service est nul",
                "je suis très déçu",
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
                "c'est acceptable",
                "c'est une expérience normale",
                "rien de particulier",
            ]
        }

        texts = []
        labels = []
        
        for label, examples in training_data.items():
            label_id = self.label_map[label]
            for example in examples:
                texts.append(example)
                labels.append(label_id)
        
        print(f"📊 Dataset: {len(texts)} phrases")
        
        return texts, labels

    def predict(self, text: str) -> Dict:
        """Prédire le sentiment avec CamemBERT"""
        if not text or self.model is None:
            return {
                'sentiment': 'neutral',
                'confidence': 0.0,
                'positive_score': 0.0,
                'negative_score': 0.0,
                'neutral_score': 0.0
            }

        try:
            inputs = self.tokenizer(
                text,
                truncation=True,
                padding=True,
                max_length=128,
                return_tensors="pt"
            )
            
            self.model.eval()
            with torch.no_grad():
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                outputs = self.model(**inputs)
                logits = outputs.logits
                probabilities = torch.nn.functional.softmax(logits, dim=-1)
                probs = probabilities.cpu().numpy()[0]
            
            predicted_class = np.argmax(probs)
            confidence = float(np.max(probs))
            sentiment = self.id_to_label[predicted_class]
            
            return {
                'sentiment': sentiment,
                'confidence': confidence,
                'positive_score': float(probs[0]),
                'negative_score': float(probs[1]),
                'neutral_score': float(probs[2])
            }
            
        except Exception as e:
            print(f"❌ Erreur de prédiction: {e}")
            return {
                'sentiment': 'neutral',
                'confidence': 0.0,
                'positive_score': 0.0,
                'negative_score': 0.0,
                'neutral_score': 0.0
            }


if __name__ == "__main__":
    import shutil
    import time
    
    # Supprimer l'ancien modèle de test
    test_model_path = './models_camembert_test/'
    if os.path.exists(test_model_path):
        shutil.rmtree(test_model_path)
    os.environ['MODEL_PATH'] = test_model_path
    
    print("🚀 Initialisation du modèle CamemBERT...")
    start_time = time.time()
    
    model = CamembertSentimentModel()
    
    print(f"✅ Modèle chargé en {time.time() - start_time:.1f}s")
    
    # Phrases de test
    test_phrases = [
        "Ce n'est pas catastrophique",
        "Super séance aujourd'hui",
        "L'application est géniale",
        "Je suis vraiment déçu",
        "Le service est catastrophique",
        "Ce n'est pas mauvais du tout",
        "J'adore cette application",
        "c'est catastrophique !"
    ]
    
    print("\n--- Tests de prédiction ---")
    for phrase in test_phrases:
        result = model.predict(phrase)
        print(f"📝 '{phrase}'")
        print(f"   → sentiment: {result['sentiment']} (confiance: {result['confidence']:.2%})")
        print(f"   → scores: P={result['positive_score']:.2%} | N={result['negative_score']:.2%} | Neutre={result['neutral_score']:.2%}")
        print()