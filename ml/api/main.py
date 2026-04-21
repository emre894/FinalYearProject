from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
from typing import List
from pathlib import Path

from src.preprocess import clean_text
from src.forecasting import calculate_wma, calculate_linear_regression
from src.patterns import detect_spending_patterns

# create FastAPI app
app = FastAPI(title="Transaction Category Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://finalyearproject-production-1879.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# load saved model and vectorizer
BASE_DIR = Path(__file__).resolve().parent.parent
model = joblib.load(BASE_DIR / "models" / "model.joblib")
vectorizer = joblib.load(BASE_DIR / "models" / "vectorizer.joblib")

# define request body model
class PredictionRequest(BaseModel):
    description: str

@app.get("/")
def root():
    return {"message": "Welcome to the Transaction Category Prediction API!"}

@app.post("/predict")
def predict(request: PredictionRequest):
    # Step 1: Clean the input text
    cleaned = clean_text(request.description)

    # Step 2: convert clean text to TF-IDF features
    features = vectorizer.transform([cleaned])

    # Step 3: Predict category using the trained model
    predicted_category = model.predict(features)[0]

    # Step 4: Predict probabilities for the confidence score
    probabilities = model.predict_proba(features)[0]
    confidence_score = float(max(probabilities))

    return {
        "original_description": request.description,
        "cleaned_description": cleaned,
        "predicted_category": predicted_category,
        "confidence_score": confidence_score
    }

# --- FORECASTING ---

class ForecastingRequest(BaseModel):
    category: str
    historical_amounts: List[float]

@app.post("/forecast")
def forecast(request: ForecastingRequest):
    if len(request.historical_amounts) == 0:
        return {
            "category": request.category,
            "error": "No historical amounts provided."
        }
    
    wma_prediction = calculate_wma(request.historical_amounts)
    lr_prediction = calculate_linear_regression(request.historical_amounts)

    return {
        "category": request.category,
        "historical_length":len(request.historical_amounts),
        "wma_prediction": wma_prediction,
        "linear_regression_prediction": lr_prediction
    }

# --- PATTERN DETECTION ---

# 1. Define the structure of a single transaction
class TransactionItem(BaseModel):
    amount: float
    date: str
    description: str
    category: str

# 2. Define the request body for pattern detection
class PatternDetectionRequest(BaseModel):
    transactions: List[TransactionItem]

@app.post("/patterns")
def patterns(request: PatternDetectionRequest):
    # Convert those Pydantic models into python dictionaries
    transactions_list = [t.dict() for t in request.transactions]

    result = detect_spending_patterns(transactions_list)

    return result