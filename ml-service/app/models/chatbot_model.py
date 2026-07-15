import numpy as np
import pandas as pd
import json
import os
import pickle
import joblib
from typing import List, Dict, Tuple
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import nltk
from nltk.stem import SnowballStemmer
import re

# Télécharger les ressources NLTK si nécessaire
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

class ChatbotMLModel:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.label_encoder = None
        self.stemmer = SnowballStemmer('french')
        self.model_path = os.getenv('MODEL_PATH', './models/')
        self.data_path = os.path.join(os.path.dirname(__file__), '../data/intents.json')
        os.makedirs(self.model_path, exist_ok=True)
        self.load_model()
    
    def load_model(self):
        """Charger le modèle entraîné ou créer un nouveau"""
        model_file = os.path.join(self.model_path, 'chatbot_model.h5')
        tokenizer_file = os.path.join(self.model_path, 'chatbot_tokenizer.pkl')
        encoder_file = os.path.join(self.model_path, 'chatbot_encoder.pkl')
        
        if os.path.exists(model_file) and os.path.exists(tokenizer_file):
            self.model = keras.models.load_model(model_file)
            self.tokenizer = joblib.load(tokenizer_file)
            self.label_encoder = joblib.load(encoder_file)
            print("✅ Modèle chatbot ML chargé")
        else:
            print("🔄 Création du modèle chatbot ML...")
            self.train_model()
    
    def preprocess_text(self, text: str) -> str:
        """Prétraiter le texte"""
        # Mettre en minuscules
        text = text.lower()
        # Supprimer la ponctuation
        text = re.sub(r'[^\w\s]', '', text)
        # Supprimer les nombres
        text = re.sub(r'\d+', '', text)
        # Supprimer les espaces multiples
        text = re.sub(r'\s+', ' ', text).strip()
        # Stemming
        words = text.split()
        words = [self.stemmer.stem(word) for word in words]
        return ' '.join(words)
    
    def train_model(self):
        """Entraîner le modèle ML"""
        # Charger les intents
        with open(self.data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        patterns = []
        tags = []
        
        for intent in data['intents']:
            for pattern in intent['patterns']:
                patterns.append(self.preprocess_text(pattern))
                tags.append(intent['tag'])
        
        # Encoder les labels
        self.label_encoder = LabelEncoder()
        y = self.label_encoder.fit_transform(tags)
        
        # Créer le tokenizer
        self.tokenizer = tf.keras.preprocessing.text.Tokenizer(
            num_words=1000,
            oov_token='<OOV>'
        )
        self.tokenizer.fit_on_texts(patterns)
        
        # Convertir les patterns en séquences
        X = self.tokenizer.texts_to_sequences(patterns)
        X = tf.keras.preprocessing.sequence.pad_sequences(X, maxlen=20)
        
        # Split en train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Créer le modèle TensorFlow
        model = keras.Sequential([
            layers.Embedding(1000, 64, input_length=20),
            layers.LSTM(64, dropout=0.2, recurrent_dropout=0.2),
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(len(self.label_encoder.classes_), activation='softmax')
        ])
        
        # Compiler le modèle
        model.compile(
            optimizer='adam',
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        # Entraîner le modèle
        history = model.fit(
            X_train, y_train,
            epochs=50,
            batch_size=16,
            validation_data=(X_test, y_test),
            verbose=1
        )
        
        # Évaluer le modèle
        y_pred = model.predict(X_test)
        y_pred_classes = np.argmax(y_pred, axis=1)
        accuracy = accuracy_score(y_test, y_pred_classes)
        
        print(f"📊 Précision du modèle: {accuracy:.2%}")
        print(f"📊 Nombre de classes: {len(self.label_encoder.classes_)}")
        
        # Sauvegarder le modèle
        self.model = model
        self.save_model()
        print("✅ Modèle chatbot entraîné et sauvegardé")
    
    def save_model(self):
        """Sauvegarder le modèle"""
        model_file = os.path.join(self.model_path, 'chatbot_model.h5')
        tokenizer_file = os.path.join(self.model_path, 'chatbot_tokenizer.pkl')
        encoder_file = os.path.join(self.model_path, 'chatbot_encoder.pkl')
        
        self.model.save(model_file)
        joblib.dump(self.tokenizer, tokenizer_file)
        joblib.dump(self.label_encoder, encoder_file)
    
    def predict(self, text: str) -> Tuple[str, float]:
        """Prédire l'intent et la confiance"""
        try:
            # Prétraiter le texte
            text_processed = self.preprocess_text(text)
            
            # Convertir en séquence
            seq = self.tokenizer.texts_to_sequences([text_processed])
            seq = tf.keras.preprocessing.sequence.pad_sequences(seq, maxlen=20)
            
            # Prédire
            predictions = self.model.predict(seq, verbose=0)
            predicted_class = np.argmax(predictions[0])
            confidence = np.max(predictions[0])
            
            # Décoder l'intent
            intent = self.label_encoder.inverse_transform([predicted_class])[0]
            
            return intent, float(confidence)
        except Exception as e:
            print(f"❌ Erreur de prédiction: {e}")
            return "fallback", 0.0
    
    def get_response(self, intent: str) -> str:
        """Obtenir une réponse pour un intent"""
        with open(self.data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        import random
        for intent_data in data['intents']:
            if intent_data['tag'] == intent:
                return random.choice(intent_data['responses'])
        
        return "Je n'ai pas compris, pouvez-vous reformuler ? 🤔"
    
    def get_fallback_response(self) -> str:
        """Obtenir une réponse de fallback"""
        fallbacks = [
            "Je n'ai pas bien compris. Pouvez-vous reformuler ? 🤔",
            "Désolé, je ne comprends pas. Pouvez-vous préciser ?",
            "Je ne suis pas sûr de comprendre. Dites-moi en plus.",
            "Je suis encore en apprentissage. Pouvez-vous réessayer ?"
        ]
        import random
        return random.choice(fallbacks)