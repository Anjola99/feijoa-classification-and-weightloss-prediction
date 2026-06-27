"""Pydantic request and response schemas for Feijoa predictions."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class QualityInput(BaseModel):
    """Inputs required by Model 2 quality prediction."""

    time_days: float = Field(..., ge=0, le=35)
    temperature: int = Field(..., ge=6, le=17)
    perforations: int = Field(..., ge=0, le=3)
    a_star: float = Field(..., ge=-15, le=15)
    b_star: float = Field(..., ge=0, le=35)
    lightness_L: float = Field(..., ge=40, le=85)


class QualityOutput(BaseModel):
    """Six-target Model 2 quality prediction result."""

    weight_loss_pct: float
    wvtr_g_m2_day: float
    o2_pct: float
    co2_pct: float
    rh_pct: float
    firmness_N: float


class QualityCurvePoint(QualityOutput):
    """A Model 2 prediction tied to a storage day for charting."""

    time_days: int


class ClassifyOutput(BaseModel):
    """Model 1 fruit state classification result."""

    predicted_state: str
    confidence: float
    scores: dict[str, float]


class HistoryItem(BaseModel):
    """Single prediction history row returned to the frontend."""

    id: int
    model: Literal["classifier", "regressor"]
    timestamp: datetime
    input_summary: str | None
    result: dict[str, Any]


class HistoryOutput(BaseModel):
    """Paginated prediction history response."""

    total: int
    predictions: list[HistoryItem]
