from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ================================================================
# Enums
# ================================================================

class Goal(str, Enum):
    perte_de_poids = "perte_de_poids"
    prise_de_masse = "prise_de_masse"
    remise_en_forme = "remise_en_forme"
    modelage_raffermissement = "modelage_raffermissement"
    recuperation_bien_etre = "recuperation_bien_etre"      
    lifting_naturel = "lifting_naturel"                    

class Level(str, Enum):
    debutant = "debutant"
    intermediaire = "intermediaire"
    avance = "avance"

# ================================================================
# Constants for Frontend
# ================================================================

GOAL_LABELS = {
    "perte_de_poids": "Perte de poids",
    "prise_de_masse": "Prise de masse musculaire",
    "remise_en_forme": "Remise en forme",
    "modelage_raffermissement": "Modelage & Raffermissement",
    "recuperation_bien_etre": "Récupération & Bien-être",
    "lifting_naturel": "Lifting naturel & Anti-âge"
}

GOAL_DESCRIPTIONS = {
    "perte_de_poids": "Brûlez des calories et perdez du poids efficacement avec l'EMS",
    "prise_de_masse": "Développez votre masse musculaire avec une stimulation profonde",
    "remise_en_forme": "Améliorez votre condition physique globale",
    "modelage_raffermissement": "Sculptez votre silhouette, raffermissez et réduisez la cellulite",
    "recuperation_bien_etre": "Retrouvez votre tonicité (post-partum) et soulagez les douleurs",
    "lifting_naturel": "Raffermissez votre visage et rajeunissez votre peau"
}

GOAL_ICONS = {
    "perte_de_poids": "🔥",
    "prise_de_masse": "💪",
    "remise_en_forme": "❤️",
    "modelage_raffermissement": "⭐",
    "recuperation_bien_etre": "🧘",
    "lifting_naturel": "✨"
}

# ================================================================
# Profile Schema
# ================================================================

class Profile(BaseModel):
    id: Optional[int] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    goal: Optional[str] = "remise_en_forme"
    level: Optional[str] = "debutant"
    bmi: Optional[float] = None
    body_fat: Optional[float] = None
    muscle_mass: Optional[float] = None
    
    def dict(self, *args, **kwargs):
        """Convert to dict, excluding None values"""
        data = super().dict(*args, **kwargs)
        return {k: v for k, v in data.items() if v is not None}

# ================================================================
# Program Schemas
# ================================================================

class ProgramExercise(BaseModel):
    day: str
    exercises: List[str]

class ProgramRequest(BaseModel):
    user_id: int
    goal: Optional[Goal] = None
    level: Optional[Level] = None
    profile: Profile

class ProgramResponse(BaseModel):
    program_id: int
    name: str
    description: str
    goal: str
    level: str
    duration_weeks: int
    exercises: List[ProgramExercise]
    schedule: dict
    confidence_score: float
    explanation: str

# ================================================================
# Churn Prediction Schemas
# ================================================================

class SessionData(BaseModel):
    user_id: Optional[int] = None
    session_count: int = 0
    completed_sessions: int = 0
    total_duration: float = 0.0
    avg_attendance: float = 0.0
    days_since_last_session: int = 0
    sessions_last_7_days: int = 0
    sessions_last_30_days: int = 0
    body_fat_change: float = 0.0
    weight_change: float = 0.0
    muscle_change: float = 0.0
    program_completion_rate: float = 0.0
    badge_count: int = 0
    challenge_participation: int = 0

class ChurnRequest(BaseModel):
    user_id: int
    data: SessionData

class ChurnResponse(BaseModel):
    user_id: int
    risk_score: float
    risk_level: str
    probability: float
    recommendations: List[str]
    factors: dict

# ================================================================
# Health Check
# ================================================================

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str