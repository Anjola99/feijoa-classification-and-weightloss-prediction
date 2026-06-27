"""Quality prediction routes for Model 2 Random Forest inference."""

import numpy as np
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.db import Prediction, get_db
from app.models.schemas import QualityCurvePoint, QualityInput, QualityOutput
from app.services.model_loader import FEATURE_COLUMNS, TARGET_COLUMNS, predict_regressor_rows


router = APIRouter(tags=["quality"])


def _predict_quality(payload: QualityInput) -> QualityOutput:
    """Run scaled Random Forest inference for a single input payload."""
    values = [[getattr(payload, column) for column in FEATURE_COLUMNS]]
    prediction = np.asarray(predict_regressor_rows(values)[0], dtype=float)
    data = {target: round(float(prediction[index]), 6) for index, target in enumerate(TARGET_COLUMNS)}
    return QualityOutput(**data)


@router.post("/quality", response_model=QualityOutput)
def predict_quality(payload: QualityInput, db: Session = Depends(get_db)):
    """Predict six feijoa quality parameters from environmental and colour inputs."""
    result = _predict_quality(payload)
    db.add(
        Prediction(
            model_type="regressor",
            input_data=payload.model_dump(),
            output_data=result.model_dump(),
            input_summary=f"{payload.time_days:g} days, {payload.temperature}C, {payload.perforations} perforations",
        )
    )
    db.commit()
    return result


@router.get("/quality/curve", response_model=list[QualityCurvePoint])
def quality_curve(
    temperature: int = Query(..., ge=6, le=17),
    perforations: int = Query(..., ge=0, le=3),
    a_star: float = Query(..., ge=-15, le=15),
    b_star: float = Query(..., ge=0, le=35),
    lightness_L: float = Query(..., ge=40, le=85),
):
    """Predict quality values for days 0 through 35 for frontend charting."""
    rows = [
        [day, temperature, perforations, a_star, b_star, lightness_L]
        for day in range(36)
    ]
    predictions = np.asarray(predict_regressor_rows(rows), dtype=float)
    points: list[QualityCurvePoint] = []
    for day, prediction in enumerate(predictions):
        result = {target: round(float(prediction[index]), 6) for index, target in enumerate(TARGET_COLUMNS)}
        points.append(QualityCurvePoint(time_days=day, **result))
    return points
