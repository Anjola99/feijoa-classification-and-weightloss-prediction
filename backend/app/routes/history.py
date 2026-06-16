"""Prediction history route backed by SQLAlchemy persistence."""

from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.db import Prediction, get_db
from app.models.schemas import HistoryItem, HistoryOutput


router = APIRouter(tags=["history"])


@router.get("", response_model=HistoryOutput)
def get_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    model: Literal["classifier", "regressor"] | None = None,
    db: Session = Depends(get_db),
):
    """Return paginated classifier and regressor prediction history."""
    query = db.query(Prediction)
    if model:
        query = query.filter(Prediction.model_type == model)
    total = query.count()
    rows = query.order_by(Prediction.timestamp.desc()).offset(offset).limit(limit).all()
    return HistoryOutput(
        total=total,
        predictions=[
            HistoryItem(
                id=row.id,
                model=row.model_type,
                timestamp=row.timestamp,
                input_summary=row.input_summary,
                result=row.output_data,
            )
            for row in rows
        ],
    )
