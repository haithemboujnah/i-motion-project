from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..schemas.schemas import ProgramRequest, GOAL_LABELS, GOAL_DESCRIPTIONS, GOAL_ICONS
from ..services.program_service import ProgramRecommender
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()
recommender = ProgramRecommender()

@router.post("/recommend")
async def recommend_program(request: ProgramRequest):
    """Recommander un programme personnalisé"""
    try:
        logger.info(f"📥 Requête reçue: user_id={request.user_id}")
        logger.debug(f"goal={request.goal}, level={request.level}")
        logger.debug(f"profile={request.profile.dict()}")
        
        profile_dict = request.profile.dict()
        
        result = recommender.recommend_program(
            profile=profile_dict,
            goal=request.goal.value if request.goal else None,
            level=request.level.value if request.level else None
        )
        
        logger.info(f"✅ Recommandation générée: {result['goal']} / {result['level']}")
        
        return {
            "success": True,  # ✅ Fixed: true → True
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

@router.get("/goals")
async def get_goals():
    """Récupérer la liste des objectifs disponibles"""
    return {
        "success": True,  # ✅ Fixed: true → True
        "data": {
            "goals": [
                {
                    "id": "perte_de_poids", 
                    "label": GOAL_LABELS["perte_de_poids"], 
                    "description": GOAL_DESCRIPTIONS["perte_de_poids"],
                    "icon": GOAL_ICONS["perte_de_poids"]
                },
                {
                    "id": "prise_de_masse", 
                    "label": GOAL_LABELS["prise_de_masse"], 
                    "description": GOAL_DESCRIPTIONS["prise_de_masse"],
                    "icon": GOAL_ICONS["prise_de_masse"]
                },
                {
                    "id": "remise_en_forme", 
                    "label": GOAL_LABELS["remise_en_forme"], 
                    "description": GOAL_DESCRIPTIONS["remise_en_forme"],
                    "icon": GOAL_ICONS["remise_en_forme"]
                },
                {
                    "id": "modelage_raffermissement", 
                    "label": GOAL_LABELS["modelage_raffermissement"], 
                    "description": GOAL_DESCRIPTIONS["modelage_raffermissement"],
                    "icon": GOAL_ICONS["modelage_raffermissement"]
                },
                {
                    "id": "recuperation_bien_etre", 
                    "label": GOAL_LABELS["recuperation_bien_etre"], 
                    "description": GOAL_DESCRIPTIONS["recuperation_bien_etre"],
                    "icon": GOAL_ICONS["recuperation_bien_etre"]
                },
                {
                    "id": "lifting_naturel", 
                    "label": GOAL_LABELS["lifting_naturel"], 
                    "description": GOAL_DESCRIPTIONS["lifting_naturel"],
                    "icon": GOAL_ICONS["lifting_naturel"]
                }
            ]
        }
    }

@router.get("/levels")
async def get_levels():
    """Récupérer la liste des niveaux disponibles"""
    return {
        "success": True,  # ✅ Fixed: true → True
        "data": {
            "levels": [
                {"id": "debutant", "label": "Débutant", "description": "Pour commencer en douceur"},
                {"id": "intermediaire", "label": "Intermédiaire", "description": "Pour ceux qui ont déjà de l'expérience"},
                {"id": "avance", "label": "Avancé", "description": "Pour les sportifs confirmés"}
            ]
        }
    }

@router.get("/goal-labels")
async def get_goal_labels():
    """Récupérer les labels des objectifs"""
    return {
        "success": True,  # ✅ Fixed: true → True
        "data": {
            "labels": GOAL_LABELS,
            "descriptions": GOAL_DESCRIPTIONS,
            "icons": GOAL_ICONS
        }
    }

# Health check endpoint
@router.get("/health")
async def health_check():
    """Vérifier la santé du service ML"""
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "1.0.0"
    }