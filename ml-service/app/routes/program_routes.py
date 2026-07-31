from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from ..schemas.schemas import ProgramRequest, ProgramResponse, Profile
from ..services.program_service import ProgramRecommender
import json
import logging

# Configurer les logs
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()
recommender = ProgramRecommender()

@router.post("/recommend", response_model=Dict)
async def recommend_program(request: ProgramRequest):
    """Recommander un programme personnalisé"""
    try:
        logger.info(f"📥 Requête reçue: user_id={request.user_id}, goal={request.goal}, level={request.level}")
        logger.debug(f"Profile: {request.profile.dict()}")
        
        profile_dict = request.profile.dict()
        
        result = recommender.recommend_program(
            profile=profile_dict,
            goal=request.goal.value if request.goal else None,
            level=request.level.value if request.level else None
        )
        
        logger.info(f"✅ Recommandation générée avec succès")
        
        return {
            "success": True,
            "data": {
                "user_id": request.user_id,
                "goal": result['goal'],
                "level": result['level'],
                "program": result['program'],
                "confidence_score": result['confidence_score'],
                "goal_confidence": result.get('goal_confidence', 0),
                "level_confidence": result.get('level_confidence', 0),
                "model_suggested_goal": result.get('model_suggested_goal'),
                "model_suggested_level": result.get('model_suggested_level'),
                "explanation": result['explanation']
            }
        }
    except Exception as e:
        logger.error(f"❌ Erreur: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))