import json
import re
from typing import Dict, List, Any
from ..models.sentiment_model import SentimentModel

class FeedbackService:
    def __init__(self):
        self.sentiment_model = SentimentModel()
        self.categories = {
            'seances': ['séance', 'réservation', 'planning', 'horaire', 'cours'],
            'coach': ['coach', 'entraîneur', 'prof', 'moniteur', 'accompagnement'],
            'application': ['application', 'app', 'site', 'interface', 'bug'],
            'paiement': ['paiement', 'abonnement', 'facture', 'prix', 'tarif'],
            'equipement': ['matériel', 'équipement', 'machine', 'salle', 'propre']
        }
    
    def analyze_feedback(self, feedback: Dict) -> Dict:
        """Analyser un feedback complet"""
        message = feedback.get('message', '')
        subject = feedback.get('subject', '')
        
        # Analyser le sentiment
        sentiment_analysis = self.sentiment_model.predict(message)
        
        # Catégoriser automatiquement
        auto_category = self.categorize(message + ' ' + subject)
        
        # Extraire les mots-clés
        keywords = self.extract_keywords(message)
        
        # Score de satisfaction
        rating = feedback.get('rating', 0)
        satisfaction_score = self.calculate_satisfaction(rating, sentiment_analysis)
        
        # Recommandations
        recommendations = self.get_recommendations(sentiment_analysis, auto_category)
        
        return {
            'sentiment_analysis': sentiment_analysis,
            'auto_category': auto_category,
            'keywords': keywords,
            'satisfaction_score': satisfaction_score,
            'recommendations': recommendations,
            'priority': self.determine_priority(feedback, sentiment_analysis)
        }
    
    def categorize(self, text: str) -> str:
        """Catégoriser automatiquement un feedback"""
        text_lower = text.lower()
        scores = {}
        
        for category, keywords in self.categories.items():
            score = 0
            for keyword in keywords:
                if keyword in text_lower:
                    score += 1
            scores[category] = score
        
        if scores:
            best_category = max(scores, key=scores.get)
            if scores[best_category] > 0:
                return best_category
        
        return 'autres'
    
    def extract_keywords(self, text: str) -> List[str]:
        """Extraire les mots-clés importants"""
        important_words = [
            'séance', 'coach', 'application', 'paiement', 'abonnement',
            'problème', 'bug', 'erreur', 'aide', 'amélioration',
            'super', 'excellent', 'mauvais', 'déçu', 'satisfait',
            'programme', 'exercice', 'réservation', 'planning'
        ]
        
        text_lower = text.lower()
        found_keywords = []
        for word in important_words:
            if word in text_lower:
                found_keywords.append(word)
        
        return found_keywords
    
    def calculate_satisfaction(self, rating: int, sentiment: Dict) -> float:
        """Calculer un score de satisfaction (0-100)"""
        if not rating or rating == 0:
            sentiment_score = (
                sentiment.get('positive_score', 0) * 100 -
                sentiment.get('negative_score', 0) * 100
            )
            return max(0, min(100, sentiment_score + 50))
        
        return (rating / 5) * 100
    
    def get_recommendations(self, sentiment: Dict, category: str) -> List[str]:
        """Générer des recommandations basées sur l'analyse"""
        recommendations = []
        
        if sentiment.get('sentiment') == 'negative' and sentiment.get('confidence', 0) > 0.7:
            recommendations.append("🔴 Feedback négatif détecté - Action prioritaire recommandée")
        
        if category == 'seances':
            recommendations.append("📅 Vérifier le planning des séances et les disponibilités")
        elif category == 'coach':
            recommendations.append("👨‍🏫 Contacter le coach pour un suivi personnalisé")
        elif category == 'application':
            recommendations.append("📱 Vérifier les problèmes techniques signalés")
        elif category == 'paiement':
            recommendations.append("💳 Vérifier le système de paiement et les abonnements")
        
        if sentiment.get('positive_score', 0) > 0.8:
            recommendations.append("⭐ Feedback positif - Partager avec l'équipe")
        
        return recommendations
    
    def determine_priority(self, feedback: Dict, sentiment: Dict) -> str:
        """Déterminer la priorité du feedback"""
        if sentiment.get('sentiment') == 'negative' and sentiment.get('confidence', 0) > 0.8:
            return 'high'
        
        if feedback.get('type') == 'complaint' and feedback.get('category') in ['paiement', 'application']:
            return 'high'
        
        if feedback.get('rating', 0) <= 2:
            return 'high'
        
        if sentiment.get('negative_score', 0) > 0.7:
            return 'high'
        
        if feedback.get('type') == 'complaint':
            return 'medium'
        
        if feedback.get('rating', 0) <= 3:
            return 'medium'
        
        return 'low'
    
    def get_insights(self, feedbacks: List[Dict]) -> Dict:
        """Analyser plusieurs feedbacks pour en tirer des insights"""
        total = len(feedbacks)
        if total == 0:
            return {
                'total': 0,
                'sentiment_distribution': {},
                'category_distribution': {},
                'avg_satisfaction': 0,
                'top_keywords': [],
                'priority_counts': {},
                'trend': 'neutral'
            }
        
        sentiments = []
        categories = []
        satisfactions = []
        all_keywords = []
        priorities = {'high': 0, 'medium': 0, 'low': 0}
        
        for feedback in feedbacks:
            analysis = self.analyze_feedback(feedback)
            sentiments.append(analysis['sentiment_analysis']['sentiment'])
            categories.append(analysis['auto_category'])
            satisfactions.append(analysis['satisfaction_score'])
            all_keywords.extend(analysis['keywords'])
            priorities[analysis['priority']] += 1
        
        sentiment_distribution = {}
        for s in sentiments:
            sentiment_distribution[s] = sentiment_distribution.get(s, 0) + 1
        
        category_distribution = {}
        for c in categories:
            category_distribution[c] = category_distribution.get(c, 0) + 1
        
        keyword_counts = {}
        for kw in all_keywords:
            keyword_counts[kw] = keyword_counts.get(kw, 0) + 1
        top_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        avg_satisfaction = sum(satisfactions) / total if satisfactions else 0
        
        positive_count = sentiment_distribution.get('positive', 0)
        negative_count = sentiment_distribution.get('negative', 0)
        if positive_count > negative_count:
            trend = 'positive'
        elif negative_count > positive_count:
            trend = 'negative'
        else:
            trend = 'neutral'
        
        return {
            'total': total,
            'sentiment_distribution': sentiment_distribution,
            'category_distribution': category_distribution,
            'avg_satisfaction': round(avg_satisfaction, 2),
            'top_keywords': top_keywords,
            'priority_counts': priorities,
            'trend': trend
        }