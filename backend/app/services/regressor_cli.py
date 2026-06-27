"""Subprocess helper for Model 2 inference in a NumPy 2/scikit-learn runtime."""

import json
import sys

import joblib


def main() -> None:
    """Read rows from stdin, run scaler and Random Forest, and emit JSON."""
    payload = json.loads(sys.stdin.read())
    model = joblib.load(payload["model_path"])
    scaler = joblib.load(payload["scaler_path"])
    scaled = scaler.transform(payload["rows"])
    predictions = model.predict(scaled).tolist()
    print(json.dumps(predictions))


if __name__ == "__main__":
    main()
