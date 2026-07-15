from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime
from ..services.chatbot_service import ChatbotService

router = APIRouter()
chatbot_service = ChatbotService()

class ChatRequest(BaseModel):
    user_id: int
    message: str
    context: Optional[Dict] = None

class ChatResponse(BaseModel):
    message: str
    intent: str
    confidence: float
    timestamp: str
    suggestions: List[str]

@router.post("/chat")
async def chat(request: ChatRequest):
    """Envoyer un message au chatbot avec ML"""
    try:
        # Récupérer les données utilisateur (à connecter avec la DB)
        user_data = {
            "first_name": request.context.get("first_name") if request.context else None
        }
        
        # Obtenir la réponse du chatbot
        response = chatbot_service.get_response(
            request.message,
            user_data
        )
        
        return {
            "success": True,
            "data": {
                "message": response["message"],
                "intent": response["intent"],
                "confidence": response["confidence"],
                "timestamp": datetime.now().isoformat(),
                "suggestions": response["suggestions"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/suggestions")
async def get_suggestions():
    """Obtenir des suggestions de questions"""
    return {
        "success": True,
        "data": {
            "suggestions": chatbot_service.get_suggestions()
        }
    }