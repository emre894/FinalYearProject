# SpendSight: AI-Driven Budgeting and Expense Tracking App

A final year project web application that helps users upload and analyse personal financial transactions. The system allows users to import bank transaction data, categorise spending, and view summaries through a dashboard. It combines a full-stack web application with a machine learning microservice for transaction categorisation.

## Project Overview

This project was developed as an AI-driven budgeting and expense tracking platform. The main aim is to transform raw transaction data into structured, understandable financial information. Users can upload transactions through CSV files or manual entry, and the system processes the data to assign categories and display spending summaries.

The application uses a hybrid categorisation approach:

1. **Rule-based categorisation first** using known merchant and keyword matches
2. **Machine learning fallback** using a FastAPI service when no rule-based match is found

This makes the system both practical and explainable. Obvious and common transactions can be categorised quickly with rules, while less clear descriptions can be handled using the trained machine learning model.

## Main Features

- User registration, login, and logout
- Protected routes for authenticated users
- CSV upload and parsing using PapaParse
- Manual transaction entry workflow
- MongoDB database integration
- Dashboard with transaction summaries and recent transactions
- Rule-based categorisation for known merchants and keywords
- Machine learning fallback categorisation using FastAPI
- Hybrid architecture combining web development and ML inference

## Tech Stack

### Frontend / Main Web App
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend / Data
- Next.js API routes
- MongoDB Atlas
- Mongoose

### Machine Learning Service
- Python
- FastAPI
- scikit-learn
- pandas
- joblib

## Project Structure

```bash
fyp-final/
│
├── docs/
├── ml/
│   ├── api/
│   ├── data/
│   ├── models/
│   ├── src/
│   └── venv/
│
├── web/
│   ├── app/
│   ├── lib/
│   ├── models/
│   ├── public/
│   └── types/
│
└── README.md

## How the System Works

- CSV Upload Flow
- User uploads a CSV file
- CSV rows are parsed and validated
- Rule-based categorisation runs first
- If no keyword match is found, the system calls the FastAPI ML service
- Categorised transactions are stored in MongoDB
- Dashboard displays summaries and recent transactions

## Running the Project Locally

- This project has two parts that run separately during development:
- the Next.js web application
- the FastAPI ML service
- Both should be running if you want the ML fallback categorisation to work.

## Terminal 1 — Run the Next.js App

cd web
npm install
npm run dev

## Terminal 2 - Run the FastAPI service

From project route:

source ml/venv/bin/activate
uvicorn ml.api.main:app --reload