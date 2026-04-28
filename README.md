# SpendSight — AI-Driven Budgeting & Expense Tracking Platform

**BSc Computer Science Final Year Project — University of Westminster, 2026**
**Student:** Mehmet Emre Asil (w1916997)

SpendSight transforms raw bank transaction data into personalised financial insights, spending forecasts, and behavioural patterns. Users can upload CSV exports from their bank or enter transactions manually, and the platform handles everything else — automatic categorisation, AI-generated insights, short-term forecasting, and pattern detection.

🔗 **Live Demo:** [finalyearproject-production-1879.up.railway.app](https://finalyearproject-production-1879.up.railway.app)

---

## Features

- **Secure Authentication** — Register, login, logout with JWT sessions and bcrypt password hashing
- **CSV Upload** — Upload bank export CSV files with flexible column matching and validation
- **Manual Entry** — Step-by-step wizard with slider-based inputs for monthly income and expenses
- **Hybrid Categorisation** — Rule-based keyword matching first, ML fallback for unrecognised merchants
- **Dashboard** — Summary cards, forecast preview, spending pattern clusters and latest transactions
- **AI Insights** — Deterministic financial facts engine + OpenAI-powered personalised Q&A and action plans
- **Spending Forecast** — Weighted Moving Average and Linear Regression predictions by category
- **Pattern Detection** — K-Means clustering to identify behavioural spending groups
- **Monthly Reports** — Filter by month, view category breakdown, download CSV export
- **Settings** — Edit display name, change password, delete transaction data

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts |
| Backend | Next.js API Routes, NextAuth, Mongoose |
| Database | MongoDB Atlas |
| ML Service | Python, FastAPI, scikit-learn, pandas, joblib |
| AI | OpenAI API (gpt-4o-mini) |
| Hosting | Railway (web + ML as separate services) |

---

## Project Structure

```
FinalYearProject/
│
├── web/                        # Next.js full-stack web application
│   ├── app/
│   │   ├── api/                # API routes (auth, transactions, analytics)
│   │   ├── dashboard/          # Dashboard page
│   │   ├── upload/             # CSV upload and manual entry
│   │   ├── insights/           # AI insights page
│   │   ├── forecast/           # Spending forecast page
│   │   ├── patterns/           # Pattern detection page
│   │   ├── reports/            # Monthly reports page
│   │   └── settings/           # Account settings page
│   ├── models/                 # Mongoose models (User, Transaction, Insight, Export)
│   ├── lib/                    # Database connection and utilities
│   └── middleware.ts            # Route protection
│
├── ml/                         # Python FastAPI ML microservice
│   ├── api/
│   │   └── main.py             # FastAPI endpoints (/predict, /forecast, /patterns)
│   ├── models/
│   │   ├── model.joblib        # Trained Logistic Regression classifier
│   │   └── vectorizer.joblib   # Fitted TF-IDF vectorizer
│   ├── src/
│   │   ├── preprocess.py       # Text normalisation for transaction descriptions
│   │   ├── forecasting.py      # WMA and Linear Regression forecasting
│   │   └── patterns.py         # K-Means clustering and cluster summarisation
│   ├── data/                   # Training dataset (labelled transaction descriptions)
│   └── requirements.txt        # Python dependencies
```

---

## How the Categorisation Pipeline Works

```
User uploads CSV
       ↓
PapaParse validates rows
       ↓
Rule-based categorisation (keyword matching)
       ↓
Match found? ──Yes──→ Assign category
       │
       No
       ↓
FastAPI ML service (/predict)
TF-IDF + Logistic Regression
       ↓
Confidence ≥ threshold? ──Yes──→ Assign predicted category
       │
       No
       ↓
Assign "Other / Unknown"
       ↓
Save to MongoDB
```

---

## Running Locally

Both services must be running for full functionality. The ML service handles categorisation, forecasting, and pattern detection.

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB Atlas account
- OpenAI API key

### Environment Variables

### Environment Variables

A pre-configured `.env.local` file is included in the submission zip.
If running from the GitHub repository independently, create `web/.env.local` with:

MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key
ML_API_URL=http://localhost:8000
```

### Terminal 1 — Next.js Web App

```bash
cd web
npm install
npm run dev
```

App runs at `http://localhost:3000`

### Terminal 2 — FastAPI ML Service

```bash
cd ml
python -m venv venv
source venv/bin/activate      # Mac/Linux
# or: venv\Scripts\activate   # Windows
pip install -r requirements.txt
cd ..
PYTHONPATH=ml uvicorn ml.api.main:app --reload
```

ML service runs at `http://localhost:8000`
API docs available at `http://localhost:8000/docs`

---

## ML Model Details

| Component | Details |
|-----------|---------|
| Algorithm | Logistic Regression |
| Feature extraction | TF-IDF (Term Frequency-Inverse Document Frequency) |
| Train/test split | 80/20 |
| Accuracy | 0.89 |
| Evaluation metrics | Accuracy, Precision, Recall, F1-score, Confusion Matrix |
| Clustering | K-Means (3 clusters) with StandardScaler |
| Forecasting | Weighted Moving Average + Linear Regression |