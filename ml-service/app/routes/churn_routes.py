from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List
from ..schemas.schemas import ChurnRequest, ChurnResponse, SessionData
from ..services.churn_service import ChurnPredictor

router = APIRouter()
predictor = ChurnPredictor()

@router.post("/predict", response_model=Dict)
async def predict_churn(request: ChurnRequest):
    """Prédire le risque de churn pour un adhérent"""
    try:
        data_dict = request.data.dict()
        
        result = predictor.predict_churn(data_dict)
        
        return {
            "success": True,
            "data": {
                "user_id": request.user_id,
                "risk_score": result['risk_score'],
                "risk_level": result['risk_level'],
                "probability": result['probability'],
                "factors": result['factors'],
                "recommendations": result['recommendations']
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-predict")
async def batch_predict_churn(users_data: List[Dict]):
    """Prédire le risque de churn pour plusieurs adhérents"""
    try:
        results = []
        for user_data in users_data:
            prediction = predictor.predict_churn(user_data['data'])
            results.append({
                "user_id": user_data['user_id'],
                "risk_score": prediction['risk_score'],
                "risk_level": prediction['risk_level'],
                "factors": prediction['factors']
            })
        
        # Trier par score de risque (descendant)
        results.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return {
            "success": True,
            "data": {
                "predictions": results,
                "total": len(results),
                "critical_count": len([r for r in results if r['risk_level'] == 'Critique']),
                "high_risk_count": len([r for r in results if r['risk_level'] == 'Élevé'])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))