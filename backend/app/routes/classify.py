"""Image classification route for Model 1 MobileNetV2 inference."""

from io import BytesIO

import numpy as np
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image
from sqlalchemy.orm import Session

from app.models.db import Prediction, get_db
from app.models.schemas import ClassifyOutput
from app.services.model_loader import get_classifier_bundle


router = APIRouter(tags=["classification"])


@router.post("/classify", response_model=ClassifyOutput)
async def classify_image(image: UploadFile = File(...), db: Session = Depends(get_db)):
    """Classify an uploaded feijoa image as unripe, ripe, or overripe."""
    if image.content_type not in {"image/jpeg", "image/png", "image/jpg"}:
        raise HTTPException(status_code=400, detail="Upload a JPEG or PNG image.")

    try:
        raw = await image.read()
        pil_image = Image.open(BytesIO(raw)).convert("RGB")
        pil_image = pil_image.resize((224, 224), Image.Resampling.LANCZOS)
        array = np.asarray(pil_image, dtype=np.float32) / 255.0
        batch = np.expand_dims(array, axis=0)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not read image.") from exc

    try:
        bundle = get_classifier_bundle()
        probabilities = bundle["session"].run(
            [bundle["output_name"]],
            {bundle["input_name"]: batch},
        )[0][0]
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Classifier model is not available: {exc}") from exc

    labels = bundle["labels"]
    scores = {label: float(probabilities[index]) for index, label in enumerate(labels)}
    best_index = int(np.argmax(probabilities))
    result = ClassifyOutput(
        predicted_state=labels[best_index],
        confidence=float(probabilities[best_index]),
        scores=scores,
    )

    db.add(
        Prediction(
            model_type="classifier",
            input_data={"filename": image.filename, "content_type": image.content_type},
            output_data=result.model_dump(),
            input_summary=image.filename or "uploaded image",
        )
    )
    db.commit()
    return result
