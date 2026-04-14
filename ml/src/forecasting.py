# ml/src/forecasting.py
import numpy as np
from sklearn.linear_model import LinearRegression


def calculate_wma(historical_amounts: list[float]) -> float:
    """Calculate the next value using a Weighted Moving Average."""
    n = len(historical_amounts)

    if n == 0:
        return 0.0
    if n == 1:
        return float(historical_amounts[0])

    # Give more weight to more recent months
    weights = np.arange(1, n + 1)
    weighted_average = np.sum(np.array(historical_amounts) * weights) / np.sum(weights)

    return round(float(weighted_average), 2)


def calculate_linear_regression(historical_amounts: list[float]) -> float:
    """Predict the next value using a simple Linear Regression trend line."""
    n = len(historical_amounts)

    if n == 0:
        return 0.0
    if n == 1:
        return float(historical_amounts[0])

    # X represents time periods: month 1, month 2, month 3, ...
    X = np.arange(1, n + 1).reshape(-1, 1)

    # y represents the historical spending values
    y = np.array(historical_amounts)

    # Fit a regression line to the historical values
    model = LinearRegression()
    model.fit(X, y)

    # Predict the next month
    next_month = np.array([[n + 1]])
    predicted_value = model.predict(next_month)[0]

    # Prevent negative forecast values
    return round(float(max(0, predicted_value)), 2)