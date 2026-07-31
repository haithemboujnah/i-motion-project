import random
from typing import Dict, List, Optional
from ..models.chatbot_model import ChatbotMLModel

class ChatbotService:
    def __init__(self):
        self.ml_model = ChatbotMLModel()
        self.suggestions_map = {
            "greeting": ["Voir mon programme", "Réserver une séance", "Mes performances"],
            "program": ["Générer un programme", "Voir programme actif", "Modifier objectif"],
            "session": ["Séances disponibles", "Mon planning", "Annuler séance"],
            "performance": ["Mes statistiques", "Mon IMC", "Rapport mensuel"],
            "gamification": ["Mes points", "Mes badges", "Défis du mois"],
            "coach": ["Contacter coach", "Conseil personnalisé", "Rendez-vous"],
            "motivation": ["Objectifs", "Progression", "Encouragement"],
            "nutrition": ["Conseils nutrition", "Recettes healthy", "Hydratation"],
            "technical": ["Aide", "Support technique", "FAQ"],
            "goodbye": ["À bientôt", "Merci", "Au revoir"],
            "fallback": ["Posez-moi une question", "Je peux vous aider", "Que voulez-vous savoir ?"]
        }
    
    def get_response(self, message: str, user_data: Optional[Dict] = None) -> Dict:
        """Obtenir une réponse du chatbot avec ML"""
        
        # Prédire l'intent avec le modèle ML
        intent, confidence = self.ml_model.predict(message)
        
        # Obtenir une réponse
        if confidence > 0.4:
            response = self.ml_model.get_response(intent)
        else:
            intent = "fallback"
            response = self.ml_model.get_fallback_response()
        
        # Personnaliser la réponse
        if user_data and user_data.get("first_name"):
            response = response.replace("Cher adhérent", user_data["first_name"])
        
        # Obtenir les suggestions
        suggestions = self.suggestions_map.get(intent, self.suggestions_map["fallback"])
        
        return {
            "message": response,
            "intent": intent,
            "confidence": confidence,
            "suggestions": suggestions[:3]
        }
    
    def get_suggestions(self) -> List[str]:
        """Obtenir des suggestions de questions"""
        return [
            "Voir mon programme personnalisé",
            "Comment réserver une séance ?",
            "Mes statistiques de progression",
            "Gagner des points et badges",
            "Contacter mon coach",
            "Conseils nutritionnels",
            "J'ai besoin de motivation",
            "Comment fonctionne l'application ?"
        ]