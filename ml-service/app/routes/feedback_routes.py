from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from ..services.feedback_service import FeedbackService

router = APIRouter()
feedback_service = FeedbackService()

class FeedbackAnalysisRequest(BaseModel):
    feedback: Dict

class FeedbackBatchAnalysisRequest(BaseModel):
    feedbacks: List[Dict]

@router.post("/analyze")
async def analyze_feedback(request: FeedbackAnalysisRequest):
    """Analyser un feedback avec NLP"""
    try:
        analysis = feedback_service.analyze_feedback(request.feedback)
        
        return {
            "success": True,
            "data": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-batch")
async def analyze_batch(request: FeedbackBatchAnalysisRequest):
    """Analyser plusieurs feedbacks"""
    try:
        results = []
        for feedback in request.feedbacks:
            analysis = feedback_service.analyze_feedback(feedback)
            results.append({
                "feedback_id": feedback.get("id"),
                "analysis": analysis
            })
        
        insights = feedback_service.get_insights(request.feedbacks)
        
        return {
            "success": True,
            "data": {
                "results": results,
                "insights": insights
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sentiment/test")
async def test_sentiment():
    """Tester le modèle de sentiment"""
    test_texts = [
        "Super séance aujourd'hui avec mon coach !",
        "L'application plante tout le temps, c'est frustrant",
        "Le planning est correct, rien de spécial"
    ]
    
    results = []
    for text in test_texts:
        analysis = feedback_service.sentiment_model.predict(text)
        results.append({
            "text": text,
            "analysis": analysis
        })
    
    return {
        "success": True,
        "data": results
    }

@router.get("/health")
async def feedback_health():
    """Vérifier si le service de feedback est opérationnel"""
    return {
        "status": "healthy",
        "service": "Feedback Analysis Service",
        "version": "1.0.0"
    }