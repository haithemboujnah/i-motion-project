from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class Goal(str, Enum):
    perte_de_poids = "perte_de_poids"
    prise_de_masse = "prise_de_masse"
    remise_en_forme = "remise_en_forme"

class Level(str, Enum):
    debutant = "debutant"
    intermediaire = "intermediaire"
    avance = "avance"

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

class ProgramExercise(BaseModel):
    day: str
    exercises: List[str]

class ProgramRequest(BaseModel):
    user_id: int
    goal: Optional[Goal] = None  # ✅ Rendre optionnel
    level: Optional[Level] = None  # ✅ Rendre optionnel
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

# Churn Prediction
class SessionData(BaseModel):
    user_id: Optional[int] = None  # ✅ Rendre optionnel
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