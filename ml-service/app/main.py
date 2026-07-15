from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import program_routes, churn_routes, chatbot_routes, feedback_routes
import uvicorn

app = FastAPI(
    title="I-Motion ML Service",
    description="Service de Machine Learning pour la recommandation de programmes et la prédiction de churn",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(program_routes.router, prefix="/api/programs", tags=["Programs"])
app.include_router(churn_routes.router, prefix="/api/churn", tags=["Churn"])
app.include_router(chatbot_routes.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(feedback_routes.router, prefix="/api/feedback", tags=["Feedback"])

@app.get("/")
async def root():
    return {
        "service": "I-Motion ML Service",
        "version": "1.0.0",
        "endpoints": {
            "programs": "/api/programs/recommend",
            "churn": "/api/churn/predict"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)