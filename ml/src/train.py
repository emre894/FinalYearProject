import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix

from preprocess import clean_text

# Load dataset
df = pd.read_csv("../data/labelled_transactions.csv")

# Clean the transaction descriptions
df["cleaned_description"] = df["description"].apply(clean_text)

# Features and labels
X_text = df["cleaned_description"]
y = df["category"]

# Split before vectorization
X_train_text, X_test_text, y_train, y_test = train_test_split(
    X_text,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Create TF-IDF vectorizer
vectorizer = TfidfVectorizer()

# Conver t text to TF-IDF features
X_train = vectorizer.fit_transform(X_train_text)
X_test = vectorizer.transform(X_test_text)

# Create and train classifier
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

# Acurracy
accuracy = model.score(X_test, y_test)

print("Model trained successfully!")
print(f"Training rows: {len(X_train_text)}")
print(f"Testing rows: {len(X_test_text)}")
print(f"X_train shape: {X_train.shape}")
print(f"X_test shape: {X_test.shape}")
print(f"Test accuracy: {accuracy:.4f}")

# Classification report and confusion matrix
print("\nClassification Report:")
print(classification_report(y_test, model.predict(X_test)))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, model.predict(X_test)))

# Save trained model and vectorizer
joblib.dump(model, "../models/model.joblib")
joblib.dump(vectorizer, "../models/vectorizer.joblib")

print("\nModel and vectorizer saved successfully!")