"""Load Feijoa model artifacts from Hugging Face or local development paths."""

from __future__ import annotations

import json
import os
import subprocess
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib


ROOT_DIR = Path(__file__).resolve().parents[3]
MODEL1_DIR = ROOT_DIR / "models" / "model1"
MODEL2_DIR = ROOT_DIR / "models" / "model2"
FEATURE_COLUMNS = ["time_days", "temperature", "perforations", "a_star", "b_star", "lightness_L"]
TARGET_COLUMNS = ["weight_loss_pct", "wvtr_g_m2_day", "o2_pct", "co2_pct", "rh_pct", "firmness_N"]


def _regressor_python_executable() -> str:
    """Return the Python executable for the optional Model 2 compatibility fallback."""
    configured = os.getenv("FEIJOA_REGRESSOR_PYTHON")
    if configured:
        return configured

    local_app_data = os.getenv("LOCALAPPDATA")
    if local_app_data:
        for version in ("Python313", "Python312", "Python311"):
            candidate = Path(local_app_data) / "Programs" / "Python" / version / "python.exe"
            if candidate.exists():
                return str(candidate)

    return "python"


def _download_from_hf(repo_name: str, filename: str) -> Path | None:
    """Download a model file from Hugging Face when a username is configured."""
    username = os.getenv("HF_USERNAME")
    if not username:
        return None
    from huggingface_hub import hf_hub_download

    token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_HUB_TOKEN")
    cache_dir = Path(os.getenv("HF_HOME") or "/tmp/feijoa_huggingface_cache")
    cache_dir.mkdir(parents=True, exist_ok=True)
    return Path(
        hf_hub_download(
            repo_id=f"{username}/{repo_name}",
            filename=filename,
            token=token,
            cache_dir=str(cache_dir),
        )
    )


def _artifact_path(repo_name: str, filename: str, local_dir: Path) -> Path:
    """Return the Hugging Face artifact path, falling back to a local dev artifact."""
    downloaded = _download_from_hf(repo_name, filename)
    if downloaded:
        return downloaded

    local_path = local_dir / filename
    if not local_path.exists():
        raise FileNotFoundError(
            f"Missing {filename}. Set HF_USERNAME for Hugging Face loading or place it in {local_dir}."
        )
    return local_path


def artifact_status() -> dict[str, Any]:
    """Return availability information for deployed model artifacts."""
    checks = [
        ("classifier_model", "feijoa-classifier", "model1_best.onnx", MODEL1_DIR),
        ("classifier_labels", "feijoa-classifier", "class_indices.json", MODEL1_DIR),
        ("regressor_model", "feijoa-regressor", "random_forest.pkl", MODEL2_DIR),
        ("regressor_scaler", "feijoa-regressor", "scaler.pkl", MODEL2_DIR),
    ]
    results: dict[str, Any] = {}
    for key, repo_name, filename, local_dir in checks:
        try:
            path = _artifact_path(repo_name, filename, local_dir)
            results[key] = {
                "ok": True,
                "filename": filename,
                "size_bytes": path.stat().st_size,
            }
        except Exception as exc:
            results[key] = {
                "ok": False,
                "filename": filename,
                "error": str(exc),
            }
    return results


@lru_cache(maxsize=1)
def get_classifier_bundle() -> dict[str, Any]:
    """Load and cache the MobileNetV2 classifier through an ONNX inference session."""
    import onnxruntime as ort

    model_path = _artifact_path("feijoa-classifier", "model1_best.onnx", MODEL1_DIR)
    labels_path = _artifact_path("feijoa-classifier", "class_indices.json", MODEL1_DIR)
    with labels_path.open("r", encoding="utf-8") as fh:
        class_indices = json.load(fh)
    labels = [class_indices[str(index)] for index in sorted(map(int, class_indices.keys()))]
    session = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
    return {
        "session": session,
        "input_name": session.get_inputs()[0].name,
        "output_name": session.get_outputs()[0].name,
        "labels": labels,
        "path": str(model_path),
    }


@lru_cache(maxsize=1)
def get_regressor_bundle() -> dict[str, Any]:
    """Load and cache the Random Forest regressor and feature scaler."""
    model_path = _artifact_path("feijoa-regressor", "random_forest.pkl", MODEL2_DIR)
    scaler_path = _artifact_path("feijoa-regressor", "scaler.pkl", MODEL2_DIR)
    try:
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        return {
            "mode": "direct",
            "model": model,
            "scaler": scaler,
            "model_path": str(model_path),
            "scaler_path": str(scaler_path),
        }
    except Exception as exc:
        return {
            "mode": "subprocess",
            "model_path": str(model_path),
            "scaler_path": str(scaler_path),
            "reason": str(exc),
        }


def predict_regressor_rows(rows: list[list[float]]) -> list[list[float]]:
    """Predict one or more Model 2 rows with the saved scaler and Random Forest."""
    bundle = get_regressor_bundle()
    if bundle["mode"] == "direct":
        scaled = bundle["scaler"].transform(rows)
        return bundle["model"].predict(scaled).tolist()

    payload = {
        "model_path": bundle["model_path"],
        "scaler_path": bundle["scaler_path"],
        "rows": rows,
    }
    proc = subprocess.run(
        [_regressor_python_executable(), str(Path(__file__).with_name("regressor_cli.py"))],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        timeout=60,
        check=False,
    )
    if proc.returncode != 0:
        reason = bundle.get("reason", "Regressor model is not available.")
        raise RuntimeError(proc.stderr or proc.stdout or reason)
    return json.loads(proc.stdout)


def load_models(app: Any) -> None:
    """Attach trained model artifacts to FastAPI app state when available."""
    load_errors = {}
    try:
        app.state.regressor_bundle = get_regressor_bundle()
    except Exception as exc:
        app.state.regressor_bundle = None
        load_errors["regressor"] = str(exc)

    try:
        app.state.classifier_bundle = get_classifier_bundle()
    except Exception as exc:
        app.state.classifier_bundle = None
        load_errors["classifier"] = str(exc)

    app.state.model_load_errors = load_errors


def warm_model_cache() -> None:
    """Best-effort cache warmup so first requests are less surprising."""
    try:
        get_regressor_bundle()
    except Exception:
        pass
