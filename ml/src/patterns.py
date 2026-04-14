import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

def detect_spending_patterns(transactions):
    if len(transactions) < 5:
        return {
            "message": "Not enough transactions to detect patterns.",
            "clusters": []
        }

    df = pd.DataFrame(transactions)

    try:
        df["date"] = pd.to_datetime(df["date"])
    except Exception:
        return {
            "message": "Invalid transaction dates provided.",
            "clusters": []
        }

    df["day_of_week"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month
    df["absolute_amount"] = df["amount"].abs()
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)

    # Features for clustering
    X = df[["absolute_amount", "day_of_week", "month", "is_weekend"]]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df["cluster"] = kmeans.fit_predict(X_scaled)

    cluster_summary = []

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    for cluster_id in range(3):
        cluster_data = df[df["cluster"] == cluster_id]

        if not cluster_data.empty:
            avg_amount = cluster_data["absolute_amount"].mean()
            common_day = cluster_data["day_of_week"].mode()[0]
            common_month = cluster_data["month"].mode()[0]
            common_category = cluster_data["category"].mode()[0]

            weekend_ratio = cluster_data["is_weekend"].mean()
            weekend_label = "Mostly Weekend" if weekend_ratio >= 0.5 else "Mostly Weekday"

            if avg_amount < 10:
                spend_size = "Small Purchases"
            elif avg_amount < 50:
                spend_size = "Medium Spending"
            else:
                spend_size = "High Spending"

            cluster_summary.append({
                "cluster_id": int(cluster_id),
                "transaction_count": int(len(cluster_data)),
                "average_amount": round(avg_amount, 2),
                "common_day": days[int(common_day)],
                "common_month": months[int(common_month) - 1],
                "common_category": common_category,
                "week_pattern": weekend_label,
                "pattern_label": f"{weekend_label} - {spend_size}"
            })

    return {
        "message": "Spending patterns detected successfully.",
        "clusters": cluster_summary
    }