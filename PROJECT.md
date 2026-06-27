# Feijoa Fruit Quality ML System — Project Specification

> **Single source of truth for all agents building this project.**
> Every design decision, dataset detail, model specification, API contract,
> and dissertation writing instruction is documented here.
> No agent should make assumptions outside this file.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Research Context](#2-research-context)
3. [Repository Structure](#3-repository-structure)
4. [Datasets](#4-datasets)
5. [Design Decisions Log](#5-design-decisions-log)
6. [Model 1 — Fruit State Classifier (SigLIP)](#6-model-1--fruit-state-classifier-siglip)
7. [Model 2 — Environmental Parameter Regressor (Random Forest)](#7-model-2--environmental-parameter-regressor-random-forest)
8. [Backend Specification (FastAPI)](#8-backend-specification-fastapi)
9. [Frontend Specification (React)](#9-frontend-specification-react)
10. [Database Specification (PostgreSQL)](#10-database-specification-postgresql)
11. [Deployment Specification (Vercel + Hugging Face Hub)](#11-deployment-specification-vercel--hugging-face-hub)
12. [Dissertation Text Generation](#12-dissertation-text-generation)
13. [Sub-Agent Instructions](#13-sub-agent-instructions)
14. [Evaluation Criteria & Acceptance Thresholds](#14-evaluation-criteria--acceptance-thresholds)
15. [Completion Checklist](#15-completion-checklist)

---

## 1. Project Overview

**Full Title:**
Application of Machine Learning in the Modelling of Water Vapor Transportation,
Weight Loss, Firmness and Color Evaluation in a Perforated Modified Atmosphere
Package for Feijoa Fruit

**Deliverables:**
1. A trained and deployed ML system with two models accessible via a live web application
2. A complete research dissertation (Introduction, Literature Review, Methodology,
   Results & Discussion, Conclusion)

**Two primary ML models:**

| Model | Type | Task | Input | Output |
|---|---|---|---|---|
| Model 1 | Classification | Fruit state identification | Fruit image | unripe / ripe / overripe + confidence score |
| Model 2 | Regression | Quality parameter prediction | Environmental conditions | Weight loss, WVTR, O₂, CO₂, RH, Firmness |

**Tech stack (locked — do not deviate):**

| Layer | Technology |
|---|---|
| Image classification model | CNN — MobileNetV2 (transfer learning via TensorFlow/Keras) |
| Regression model | Scikit-learn Random Forest Regressor |
| Backend API | Python FastAPI |
| Database | PostgreSQL |
| Model storage | Hugging Face Hub (free tier) |
| Frontend | React.js + Tailwind CSS |
| HTTP client | Axios |
| Charts | Recharts |
| Deployment | Vercel (both frontend and backend) |

---

## 2. Research Context

**Fruit:** Feijoa (*Acca sellowiana*), also known as pineapple guava.
A subtropical fruit highly sensitive to post-harvest conditions.

**Packaging:** Perforated Modified Atmosphere Package (PMAP) using polypropylene (PP) bags.
Perforations regulate gas exchange (O₂, CO₂), water vapour transmission, and humidity.

**Storage conditions studied:**
- Temperatures: 6°C, 12°C, 17°C
- Perforation counts: 0, 1, 2, 3 (diameter: 0.225mm)
- Duration: 0 to 35 days

**Quality parameters tracked:**
- Color: CIELab a* (red-green), b* (yellow-blue), L* (lightness)
- Firmness (Newtons)
- Weight loss (%)
- Water vapour transport rate — WVTR (g/m²/day)
- Internal O₂ concentration (%)
- Internal CO₂ concentration (%)
- Internal relative humidity — RH (%)
- Fruit state: unripe / ripe / overripe

**Key finding from data analysis:**
Higher temperature and more perforations accelerate quality parameter changes.
Rate constants and equilibrium values are encoded in the dataset physics parameters sheet.

---

## 3. Repository Structure

Build the project with this exact folder structure:

```
feijoa-ml/
│
├── PROJECT.md                        ← this file
│
├── data/
│   ├── raw/
│   │   └── feijoa_model2_dataset.xlsx   ← tabular dataset (1,719 rows, 9 features)
│   ├── processed/
│   │   ├── model2_train.csv
│   │   ├── model2_val.csv
│   │   └── model2_test.csv
│   └── images/
│       ├── train/
│       │   ├── unripe/
│       │   ├── ripe/
│       │   └── overripe/
│       ├── val/
│       │   ├── unripe/
│       │   ├── ripe/
│       │   └── overripe/
│       └── test/
│           ├── unripe/
│           ├── ripe/
│           └── overripe/
│
├── notebooks/
│   ├── 01_eda.ipynb                  ← exploratory data analysis
│   ├── 02_model1_training.ipynb      ← SigLIP fine-tuning
│   └── 03_model2_training.ipynb      ← Random Forest training
│
├── models/
│   ├── model1/
│   │   ├── training_log.json         ← accuracy, loss per epoch
│   │   ├── confusion_matrix.png
│   │   └── README.md                 ← Hugging Face model card
│   └── model2/
│       ├── random_forest.pkl         ← serialised model
│       ├── scaler.pkl                ← feature scaler
│       ├── feature_importance.png
│       └── evaluation_metrics.json
│
├── backend/
│   ├── main.py                       ← FastAPI app entry point
│   ├── requirements.txt
│   ├── vercel.json                   ← Vercel serverless config
│   ├── app/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── classify.py           ← POST /predict/classify
│   │   │   ├── predict.py            ← POST /predict/quality
│   │   │   └── history.py            ← GET /history
│   │   ├── models/
│   │   │   ├── schemas.py            ← Pydantic request/response models
│   │   │   └── db.py                 ← SQLAlchemy + PostgreSQL connection
│   │   └── ml/
│   │       ├── classifier.py         ← SigLIP inference wrapper
│   │       └── regressor.py          ← Random Forest inference wrapper
│   └── tests/
│       ├── test_classify.py
│       └── test_predict.py
│
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── ImageClassifier.jsx   ← Model 1 UI
│       │   ├── QualityPredictor.jsx  ← Model 2 UI
│       │   ├── ResultsChart.jsx      ← Recharts quality curves
│       │   ├── PredictionHistory.jsx ← history table
│       │   └── Navbar.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Classify.jsx
│       │   ├── Predict.jsx
│       │   ├── History.jsx
│       │   └── Methodology.jsx
│       └── api/
│           └── client.js             ← Axios instance
│
└── docs/
    └── dissertation/
        ├── methodology.txt           ← auto-drafted by agent
        ├── results_discussion.txt    ← auto-drafted by agent
        └── conclusion.txt            ← auto-drafted by agent
```

---

## 4. Datasets

### 4.1 Model 1 — Image Dataset

**Source:** 1,000+ feijoa fruit photographs
**Auto-labelling:** SigLIP zero-shot classification (already implemented in `feijoa_auto_label.py`)
**Labels:** `unripe`, `ripe`, `overripe`
**Split:** 70% train / 15% val / 15% test (stratified by class)
**Minimum images per class (target):** 150 per class after filtering

**Expected folder location after running the labelling script:**
```
data/images/train/unripe/
data/images/train/ripe/
data/images/train/overripe/
data/images/val/...
data/images/test/...
```

**Image preprocessing for SigLIP fine-tuning:**
- Resize to 224×224 (SigLIP base patch16-224 input size)
- Normalise with SigLIP processor defaults (mean=[0.5,0.5,0.5], std=[0.5,0.5,0.5])
- Augmentation (training only): random horizontal flip, random rotation ±15°,
  colour jitter (brightness=0.2, contrast=0.2, saturation=0.1)
- No augmentation for val/test

### 4.2 Model 2 — Tabular Dataset

**File:** `data/raw/feijoa_model2_dataset.xlsx`, sheet: `Model 2 – Full Dataset`
**Rows:** 1,719 (99 original + 1,620 synthetic)
**Conditions:** 9 (3 temperatures × 3 perforation counts)

**Input features (X):**

| Feature | Type | Description |
|---|---|---|
| `time_days` | Float | Day 0–35 in post-harvest storage |
| `temperature` | Int | Storage temperature: 6, 12, or 17 (°C) |
| `perforations` | Int | Number of PP bag perforations: 0, 1, 2, or 3 |
| `a_star` | Float | CIELab a* (red-green axis) |
| `b_star` | Float | CIELab b* (yellow-blue axis) |
| `lightness_L` | Float | CIELab L* (brightness) |

**Target variables (y) — train one multi-output model:**

| Target | Unit | Description |
|---|---|---|
| `weight_loss_pct` | % | Cumulative weight loss |
| `wvtr_g_m2_day` | g/m²/day | Water vapour transport rate |
| `o2_pct` | % | Internal package O₂ concentration |
| `co2_pct` | % | Internal package CO₂ concentration |
| `rh_pct` | % | Internal relative humidity |
| `firmness_N` | N | Fruit firmness |

**Preprocessing steps:**
1. Drop columns: `replication`, `condition_id`, `packaging_type`, `state`
   (these are metadata, not model features)
2. Scale all input features using `StandardScaler` — fit on train, apply to val/test
3. Save fitted scaler as `models/model2/scaler.pkl`
4. Split: 70% train / 15% val / 15% test (stratified by `condition_id` to ensure
   all conditions appear in every split)

**Important:** `replication=0` rows are original data.
Replications 1–5 are synthetic. Include all in training.
Ensure test set contains at least some `replication=0` rows for validation against real data.

---

## 5. Design Decisions Log

Every decision made during this project is logged here.
Agents must not override these without explicit instruction.

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | Image classification model (Model 1) | CNN — MobileNetV2 (transfer learning via TensorFlow/Keras) | Proven architecture for fruit image classification; lightweight; fast inference within Vercel serverless limits; strong accuracy with fine-tuning on small-medium image datasets; well documented in post-harvest ML literature |
| 2 | Regression model (Model 2) | Random Forest Regressor (multi-output) | Non-linear environmental relationships; works well on small-medium tabular datasets; provides feature importance natively; robust to outliers in synthetic data |
| 3 | Auto-labelling tool (preprocessing only) | SigLIP — zero-shot, one-time step, NOT deployed | Used solely to assign unripe/ripe/overripe labels to raw images before CNN training; already completed; SigLIP plays no role in the trained system or web application |
| 4 | Image split ratio | 70 / 15 / 15 | Standard academic split; enough test data for reliable evaluation metrics |
| 5 | Tabular split ratio | 70 / 15 / 15 (stratified by condition_id) | Ensures all 9 conditions are represented in every split |
| 6 | Synthetic data method | Cubic spline interpolation + Gaussian noise (5 replications) | Preserves biological trends; noise calibrated to experimental measurement variability |
| 7 | Missing variable synthesis | Physics-based exponential/linear models | Weight loss, WVTR, O₂, CO₂, RH modelled from post-harvest literature; equations documented in dataset |
| 8 | Backend framework | FastAPI | Async support; auto-generates OpenAPI docs; faster than Flask; native Pydantic validation |
| 9 | Database | PostgreSQL | Relational; handles prediction history and session logs; Supabase free tier available |
| 10 | Model storage | Hugging Face Hub (free tier) | Version control for models; free; accessible from Vercel serverless functions |
| 11 | Deployment platform | Vercel (frontend + backend) | Single platform for both; free tier; serverless functions support Python FastAPI |
| 12 | Frontend framework | React.js + Tailwind CSS | Component-based; Tailwind removes custom CSS overhead; wide ecosystem |
| 13 | Charts library | Recharts | React-native; simpler API than D3; sufficient for quality curve visualisation |
| 14 | Feature scaler | StandardScaler | Tree models don't require scaling but applied for consistency and future model swaps |
| 15 | Model 2 structure | Single multi-output RF model | Predicts all 6 targets simultaneously; captures inter-variable correlations |
| 16 | Confidence threshold (labelling) | 0.45 | Balanced recall vs label quality; images below threshold sent to rejected/ for review |
| 17 | State classification thresholds | firmness ≥ 45N and a* ≤ 0 → unripe; firmness ≤ 25N or a* ≥ 2.5 → overripe; else → ripe | Calibrated from feijoa post-harvest literature and observed data transitions |
| 18 | Random seed | 42 | Fixed across all scripts for full reproducibility |

---

## 6. Model 1 — Fruit State Classifier (CNN — MobileNetV2)

> **IMPORTANT DISTINCTION:**
> SigLIP was used only as the auto-labelling tool (one-time preprocessing, already done).
> Model 1 is a CNN built with TensorFlow/Keras using MobileNetV2 transfer learning.
> SigLIP is NOT used in, loaded by, or deployed with the web application.

### 6.1 Model Architecture

```python
import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import MobileNetV2

# Load pre-trained MobileNetV2 without top classification layer
base_model = MobileNetV2(
    input_shape = (224, 224, 3),
    include_top = False,
    weights     = "imagenet"
)

# Freeze base model initially, then unfreeze top layers for fine-tuning
base_model.trainable = False

# Add custom classification head
inputs  = tf.keras.Input(shape=(224, 224, 3))
x       = base_model(inputs, training=False)
x       = layers.GlobalAveragePooling2D()(x)
x       = layers.Dropout(0.3)(x)
x       = layers.Dense(128, activation="relu")(x)
x       = layers.Dropout(0.2)(x)
outputs = layers.Dense(3, activation="softmax")(x)   # 3 classes

model = Model(inputs, outputs)
```

**Classes (in this order — do not change):** `['unripe', 'ripe', 'overripe']`
(index 0, 1, 2 respectively)

### 6.2 Training Configuration

Train in two phases:

**Phase A — Head only (frozen base):**
```python
BATCH_SIZE      = 32
LEARNING_RATE   = 1e-3
EPOCHS_PHASE_A  = 10
OPTIMIZER       = "Adam"
LOSS            = "sparse_categorical_crossentropy"
METRICS         = ["accuracy"]
```

**Phase B — Fine-tuning (unfreeze top 30 layers of base):**
```python
# Unfreeze top 30 layers of MobileNetV2
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

LEARNING_RATE   = 1e-5          # much lower for fine-tuning
EPOCHS_PHASE_B  = 20            # with early stopping
PATIENCE        = 4             # EarlyStopping on val_loss
SCHEDULER       = "ReduceLROnPlateau(factor=0.5, patience=2)"
SEED            = 42
```

### 6.3 Image Preprocessing

```python
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Training: with augmentation
train_datagen = ImageDataGenerator(
    rescale            = 1./255,
    rotation_range     = 15,
    horizontal_flip    = True,
    brightness_range   = [0.8, 1.2],
    zoom_range         = 0.1,
    width_shift_range  = 0.1,
    height_shift_range = 0.1,
)

# Val and test: rescale only, no augmentation
val_test_datagen = ImageDataGenerator(rescale=1./255)

train_gen = train_datagen.flow_from_directory(
    "data/images/train",
    target_size  = (224, 224),
    batch_size   = 32,
    class_mode   = "sparse",
    seed         = 42
)
```

### 6.4 Training Loop Requirements

- Use `ModelCheckpoint` to save best model by `val_accuracy` as `models/model1/model1_best.h5`
- Export the trained Keras model to `models/model1/model1_best.onnx` for Vercel inference
- Use `EarlyStopping` with `patience=4` on `val_loss`, restore best weights
- Log train loss, train accuracy, val loss, val accuracy every epoch
- Save full training history to `models/model1/training_log.json`
- After training: generate and save confusion matrix to `models/model1/confusion_matrix.png`
- Print full `classification_report` (precision, recall, F1 per class)
- Save training curves plot (accuracy and loss over epochs) to `models/model1/training_curves.png`

### 6.5 Evaluation Metrics (Model 1)

Run on the **test set only** after both training phases are complete:

| Metric | Target |
|---|---|
| Overall accuracy | ≥ 85% |
| Macro F1-score | ≥ 0.82 |
| Per-class F1 (unripe) | ≥ 0.80 |
| Per-class F1 (ripe) | ≥ 0.80 |
| Per-class F1 (overripe) | ≥ 0.80 |

If targets are not met, document actual values honestly and address in the dissertation
limitations section. Do not re-tune to artificially hit targets.

### 6.6 Inference API Contract

Input: image file (JPEG or PNG)
Output:
```json
{
  "predicted_state": "ripe",
  "confidence": 0.912,
  "scores": {
    "unripe": 0.043,
    "ripe": 0.912,
    "overripe": 0.045
  }
}
```

### 6.7 Model Saving and Loading

- Save trained model: `models/model1/model1_best.h5` (Keras HDF5 format)
- Save deployed inference artifact: `models/model1/model1_best.onnx` (ONNX export of the same MobileNetV2 classifier)
- Upload to Hugging Face Hub repo: `feijoa-classifier`
- Files to upload: `model1_best.onnx`, `class_indices.json`, `training_log.json`,
  `confusion_matrix.png`, `training_curves.png`, `README.md` (model card)
- Backend loads `model1_best.onnx` with ONNX Runtime to avoid Vercel's TensorFlow bundle-size limit
- Backend caches model in memory on startup — do not reload per request
- `class_indices.json` must store: `{"0": "unripe", "1": "ripe", "2": "overripe"}`

---

## 7. Model 2 — Environmental Parameter Regressor (Random Forest)

### 7.1 Model Architecture

```python
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor

base_rf = RandomForestRegressor(
    n_estimators    = 300,
    max_depth       = None,      # grow full trees
    min_samples_split = 5,
    min_samples_leaf  = 2,
    max_features    = "sqrt",
    random_state    = 42,
    n_jobs          = -1         # use all CPU cores
)

model = MultiOutputRegressor(base_rf)
```

### 7.2 Features and Targets

```python
FEATURE_COLS = [
    "time_days", "temperature", "perforations",
    "a_star", "b_star", "lightness_L"
]

TARGET_COLS = [
    "weight_loss_pct", "wvtr_g_m2_day",
    "o2_pct", "co2_pct", "rh_pct", "firmness_N"
]
```

### 7.3 Evaluation Metrics (Model 2)

Compute per target variable on the **test set**:

| Metric | Target |
|---|---|
| R² (per target) | ≥ 0.85 for all 6 targets |
| RMSE | Minimise; report per target |
| MAE | Minimise; report per target |

Also produce:
- Actual vs predicted scatter plot for each target
- Feature importance bar chart (averaged across targets)
- Save all metrics to `models/model2/evaluation_metrics.json`

### 7.4 Inference API Contract

Input:
```json
{
  "time_days": 14,
  "temperature": 12,
  "perforations": 2,
  "a_star": -1.2,
  "b_star": 16.5,
  "lightness_L": 69.3
}
```

Output:
```json
{
  "weight_loss_pct": 1.82,
  "wvtr_g_m2_day": 14.3,
  "o2_pct": 15.1,
  "co2_pct": 4.8,
  "rh_pct": 89.7,
  "firmness_N": 42.6
}
```

### 7.5 Model Saving

- Save serialised model: `models/model2/random_forest.pkl` (joblib)
- Save fitted scaler: `models/model2/scaler.pkl` (joblib)
- Upload both to Hugging Face Hub as: `feijoa-regressor`
- Backend loads both on startup and caches in memory

---

## 8. Backend Specification (FastAPI)

### 8.1 Entry Point

`backend/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import classify, predict, history

app = FastAPI(title="Feijoa ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router, prefix="/predict")
app.include_router(predict.router,  prefix="/predict")
app.include_router(history.router,  prefix="/history")

@app.get("/health")
def health(): return {"status": "ok"}
```

### 8.2 API Endpoints

#### POST `/predict/classify`
- Accepts: `multipart/form-data` with `image` field (JPEG/PNG)
- Runs CNN (MobileNetV2) inference
- Saves result to PostgreSQL `predictions` table
- Returns: Model 1 inference response (see §6.6)

#### POST `/predict/quality`
- Accepts: JSON body (see §7.4 input schema)
- Scales input using loaded `scaler.pkl`
- Runs Random Forest inference
- Saves result to PostgreSQL `predictions` table
- Returns: Model 2 inference response (see §7.4 output)

#### GET `/history`
- Query params: `limit` (default 50), `offset` (default 0), `model` (optional: `"classifier"` or `"regressor"`)
- Returns paginated prediction history from PostgreSQL
- Response:
```json
{
  "total": 143,
  "predictions": [
    {
      "id": 1,
      "model": "classifier",
      "timestamp": "2026-05-20T14:32:10",
      "input_summary": "image.jpg",
      "result": { "predicted_state": "ripe", "confidence": 0.91 }
    }
  ]
}
```

#### GET `/predict/quality/curve`
- Query params: `temperature`, `perforations`, `a_star`, `b_star`, `lightness_L`
- Runs Model 2 for every day from 0 to 35 at the given conditions
- Returns array of 36 predictions (one per day) for charting

### 8.3 Pydantic Schemas (`app/models/schemas.py`)

```python
from pydantic import BaseModel, Field

class QualityInput(BaseModel):
    time_days:     float = Field(..., ge=0, le=35)
    temperature:   int   = Field(..., ge=6, le=17)
    perforations:  int   = Field(..., ge=0, le=3)
    a_star:        float = Field(..., ge=-15, le=15)
    b_star:        float = Field(..., ge=0,   le=35)
    lightness_L:   float = Field(..., ge=40,  le=85)

class QualityOutput(BaseModel):
    weight_loss_pct: float
    wvtr_g_m2_day:   float
    o2_pct:          float
    co2_pct:         float
    rh_pct:          float
    firmness_N:      float

class ClassifyOutput(BaseModel):
    predicted_state: str
    confidence:      float
    scores:          dict[str, float]
```

### 8.4 Backend Dependencies (`requirements.txt`)

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
python-multipart==0.0.9
onnxruntime>=1.18.0
scikit-learn>=1.4.0
joblib>=1.4.0
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.0
pillow>=10.0.0
numpy>=1.26.0
huggingface-hub>=0.22.0
pydantic>=2.0.0
```

### 8.5 Vercel Serverless Config (`backend/vercel.json`)

```json
{
  "builds": [{ "src": "main.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "main.py" }]
}
```

---

## 9. Frontend Specification (React)

### 9.1 Pages and Components

| Page | Route | Component | Description |
|---|---|---|---|
| Home | `/` | `Home.jsx` | Landing page with project summary and navigation |
| Classify | `/classify` | `Classify.jsx` | Image upload → Model 1 result |
| Predict | `/predict` | `Predict.jsx` | Environmental inputs → Model 2 result + quality curve chart |
| History | `/history` | `History.jsx` | Paginated prediction log table |
| Methodology | `/methodology` | `Methodology.jsx` | In-app explanation of both models |

### 9.2 Key UI Behaviours

**Classify page:**
- Drag-and-drop or click-to-upload image
- Show image preview before submitting
- Display predicted state with confidence bar (green=unripe, yellow=ripe, red=overripe)
- Show all three class probabilities as a small bar chart
- Loading spinner during API call

**Predict page:**
- Input form: sliders or number inputs for all 6 features
- On submit: show predicted values for all 6 targets
- Below results: quality curve chart (Recharts LineChart)
  showing all 6 predicted targets plotted over 35 days
  (uses `/predict/quality/curve` endpoint)
- Highlight the current day on the chart

**History page:**
- Table with columns: timestamp, model type, input summary, prediction result
- Filterable by model type (classifier / regressor)
- Paginated (50 per page)

### 9.3 API Client (`src/api/client.js`)

```javascript
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: API_BASE });

export const classifyImage = (formData) =>
  api.post("/predict/classify", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

export const predictQuality = (data) =>
  api.post("/predict/quality", data);

export const getQualityCurve = (params) =>
  api.get("/predict/quality/curve", { params });

export const getPredictionHistory = (params) =>
  api.get("/history", { params });
```

### 9.4 Environment Variable

Create `frontend/.env`:
```
REACT_APP_API_URL=https://your-backend.vercel.app
```

---

## 10. Database Specification (PostgreSQL)

### 10.1 Connection

Use Supabase free-tier PostgreSQL.
Store the connection string as environment variable:
```
DATABASE_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
```

### 10.2 Schema

```sql
CREATE TABLE predictions (
    id              SERIAL PRIMARY KEY,
    model_type      VARCHAR(20) NOT NULL,   -- 'classifier' or 'regressor'
    timestamp       TIMESTAMP DEFAULT NOW(),
    input_data      JSONB NOT NULL,         -- raw input
    output_data     JSONB NOT NULL,         -- raw output
    input_summary   TEXT                    -- human-readable label for history table
);

CREATE INDEX idx_predictions_model_type ON predictions(model_type);
CREATE INDEX idx_predictions_timestamp  ON predictions(timestamp DESC);
```

### 10.3 SQLAlchemy Model (`app/models/db.py`)

```python
from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Prediction(Base):
    __tablename__ = "predictions"
    id            = Column(Integer, primary_key=True, index=True)
    model_type    = Column(String(20), nullable=False)
    timestamp     = Column(DateTime, default=datetime.utcnow)
    input_data    = Column(JSON, nullable=False)
    output_data   = Column(JSON, nullable=False)
    input_summary = Column(String(200))
```

---

## 11. Hosting & Deployment

This section covers every hosting step in full. Follow in the order given.
All services used are free tier unless stated otherwise.

---

### 11.1 Hugging Face Hub — Model Storage & Upload

**Purpose:** Store trained model files so the backend can download them at runtime.
Both repositories must be **public**.

#### Step 1 — Create a Hugging Face account
Go to https://huggingface.co and sign up for a free account.
Note your username — it is used in all repo IDs below.

#### Step 2 — Create two model repositories

In the Hugging Face UI:
- Click your profile → New Model
- Repo 1 name: `feijoa-classifier` (public)
- Repo 2 name: `feijoa-regressor` (public)

Get your access token from: https://huggingface.co/settings/tokens
(Create a token with **write** permission)

#### Step 3 — Upload Model 1 files after training

In the Hugging Face UI:
- Open `your-username/feijoa-classifier`
- Go to `Files and versions`
- Click `Add file` → `Upload files`
- Upload the files from `models/model1/`

Files uploaded must include:
- `model1_best.onnx`
- `class_indices.json`
- `training_log.json`
- `confusion_matrix.png`
- `training_curves.png`
- `README.md`

#### Step 4 — Upload Model 2 files after training

In the Hugging Face UI:
- Open `your-username/feijoa-regressor`
- Go to `Files and versions`
- Click `Add file` → `Upload files`
- Upload the files from `models/model2/`

Files uploaded must include:
- `random_forest.pkl`
- `scaler.pkl`
- `evaluation_metrics.json`
- `feature_importance.png`
- `README.md`

#### Model Loading in Backend at Runtime

```python
from huggingface_hub import hf_hub_download
import onnxruntime as ort
import joblib

@asynccontextmanager
async def lifespan(app: FastAPI):
    classifier_path = hf_hub_download(
        repo_id  = "your-username/feijoa-classifier",
        filename = "model1_best.onnx"
    )
    regressor_path = hf_hub_download(
        repo_id  = "your-username/feijoa-regressor",
        filename = "random_forest.pkl"
    )
    scaler_path = hf_hub_download(
        repo_id  = "your-username/feijoa-regressor",
        filename = "scaler.pkl"
    )
    app.state.classifier = ort.InferenceSession(classifier_path, providers=["CPUExecutionProvider"])
    app.state.regressor  = joblib.load(regressor_path)
    app.state.scaler     = joblib.load(scaler_path)
    yield
```

---

### 11.2 PostgreSQL Database — Supabase (Free)

**Purpose:** Store prediction history from both models.

#### Step 1 — Create a Supabase account
Go to https://supabase.com and sign up for free.

#### Step 2 — Create a new project
- Project name: `feijoa-ml`
- Region: choose closest to your location
- Supabase creates a default Postgres database automatically

#### Step 3 — Get your connection string
In the Supabase dashboard, click `Connect` and copy the transaction pooler connection string for serverless deployments.
It looks like:
```
postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
```

Save this — it becomes the `DATABASE_URL` environment variable. If Supabase shows `postgres://`, convert it to `postgresql://` or rely on the backend normalizer.

#### Step 4 — Run the schema
Connect to the database and run the SQL from §10.2:
```sql
CREATE TABLE predictions (
    id              SERIAL PRIMARY KEY,
    model_type      VARCHAR(20) NOT NULL,
    timestamp       TIMESTAMP DEFAULT NOW(),
    input_data      JSONB NOT NULL,
    output_data     JSONB NOT NULL,
    input_summary   TEXT
);

CREATE INDEX idx_predictions_model_type ON predictions(model_type);
CREATE INDEX idx_predictions_timestamp  ON predictions(timestamp DESC);
```

You can run this directly in the Supabase SQL editor in the dashboard.

---

### 11.3 Backend Deployment — Vercel (Serverless Python)

**Purpose:** Host the FastAPI API so the frontend can call it from anywhere.

#### Step 1 — Prepare dashboard deployment
Use the Vercel web dashboard instead of the Vercel CLI.
The project repository must be available in GitHub, GitLab, or Bitbucket so Vercel can import it.

#### Step 2 — Ensure `backend/vercel.json` exists
```json
{
  "builds": [{ "src": "main.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "main.py" }]
}
```

#### Step 3 — Ensure `backend/requirements.txt` is complete
All packages listed in §8.4 must be present.
Vercel installs them automatically during build.

#### Step 4 — Deploy the backend from the Vercel dashboard
Go to https://vercel.com/dashboard → Add New → Project.
Import the project repository and configure:
- Project name: `feijoa-backend`
- Root directory: `backend`
- Framework preset: `Other` if Vercel does not auto-detect the Python backend

After deploy, Vercel gives you a URL like:
`https://feijoa-backend-xxxx.vercel.app`

**Save this URL — the frontend needs it.**

#### Step 5 — Set environment variables in Vercel dashboard
Go to https://vercel.com → feijoa-backend project → Settings → Environment Variables

Add the following:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase Postgres transaction pooler connection string from §11.2 |
| `HF_USERNAME` | Your Hugging Face username |
| `HF_TOKEN` | Your HF access token (only needed if repos are private) |

#### Step 6 — Redeploy after setting variables
In the Vercel dashboard, open the `feijoa-backend` project and redeploy from the latest Git commit.

#### Step 7 — Verify the backend is live
Open in browser:
```
https://feijoa-backend-xxxx.vercel.app/health
```
Expected response: `{"status": "ok"}`

Also check the auto-generated API docs:
```
https://feijoa-backend-xxxx.vercel.app/docs
```

---

### 11.4 Frontend Deployment — Vercel (Static + SSR)

**Purpose:** Host the React web application publicly.

#### Step 1 — Set the backend URL in the frontend environment file
Create `frontend/.env.production`:
```
REACT_APP_API_URL=https://feijoa-backend-xxxx.vercel.app
```
Replace the URL with the actual backend URL from §11.3 Step 4.

#### Step 2 — Build and test locally first
```bash
cd frontend
npm install
npm run build    # must complete with no errors before deploying
npm start        # verify locally at http://localhost:3000
```

#### Step 3 — Deploy the frontend from the Vercel dashboard
Go to https://vercel.com/dashboard → Add New → Project.
Import the same project repository again and configure:
- Project name: `feijoa-frontend`
- Root directory: `frontend`
- Framework preset: `Create React App` if detected

After deploy, Vercel gives you a URL like:
`https://feijoa-frontend-xxxx.vercel.app`

**This is the public URL for the web application.**

#### Step 4 — Set environment variables in Vercel dashboard
Go to https://vercel.com → feijoa-frontend project → Settings → Environment Variables

| Variable | Value |
|---|---|
| `REACT_APP_API_URL` | `https://feijoa-backend-xxxx.vercel.app` |

#### Step 5 — Redeploy after setting variables
In the Vercel dashboard, open the `feijoa-frontend` project and redeploy from the latest Git commit.

---

### 11.5 Connecting Everything — Environment Variable Summary

| Service | Variable | Where it lives |
|---|---|---|
| Backend → Supabase DB | `DATABASE_URL` | Vercel backend project env vars |
| Backend → HF Hub | `HF_USERNAME` | Vercel backend project env vars |
| Backend → HF Hub | `HF_TOKEN` | Vercel backend project env vars (if private) |
| Frontend → Backend | `REACT_APP_API_URL` | Vercel frontend project env vars |

---

### 11.6 End-to-End Smoke Test

After all services are deployed, run through these checks in order:

```
1. GET  https://feijoa-backend-xxxx.vercel.app/health
   Expected: {"status": "ok"}

2. GET  https://feijoa-backend-xxxx.vercel.app/docs
   Expected: FastAPI Swagger UI loads with all endpoints visible

3. POST https://feijoa-backend-xxxx.vercel.app/predict/quality
   Body: {"time_days":14,"temperature":12,"perforations":2,
          "a_star":-1.2,"b_star":16.5,"lightness_L":69.3}
   Expected: JSON with 6 predicted values

4. POST https://feijoa-backend-xxxx.vercel.app/predict/classify
   Body: multipart image upload of any feijoa image
   Expected: JSON with predicted_state and confidence score

5. GET  https://feijoa-backend-xxxx.vercel.app/history
   Expected: JSON with predictions array (may be empty on first run)

6. Open https://feijoa-frontend-xxxx.vercel.app
   Expected: React app loads, all pages navigate correctly,
             classify and predict pages return results
```

All 6 checks must pass before marking deployment complete in the checklist (§15).

---

### 11.7 Vercel Limitations to Handle

| Limitation | Impact | Handling |
|---|---|---|
| Serverless timeout: 30s max | First classify request on cold start may be slow | Pre-warm with a /health ping; MobileNetV2 inference itself is ~1–2s |
| Memory: 1GB per function | MobileNetV2 ~14MB + RF model ~small | Both fit comfortably; no action needed |
| No persistent disk | Models cannot be saved to disk permanently | Load from Hugging Face Hub on startup and cache in `app.state` |
| Cold start latency | First request after inactivity takes ~10–20s | Expected behaviour on free tier; document in the app's loading UI |
| Build size limit / 500MB ephemeral storage | Full TensorFlow is too large for Vercel Python functions | Deploy `model1_best.onnx` with ONNX Runtime instead of installing TensorFlow in the backend |

---

## 12. Dissertation Text Generation

### INSTRUCTION FOR DISSERTATION AGENT

As each stage of the project is completed, generate the corresponding dissertation
section as a plain text `.txt` file in `docs/dissertation/`.
Write in formal academic English, third person, passive voice where appropriate.
Target word counts are given per section.

---

### 12.1 `methodology.txt` — Generate after models are trained

**Target:** 1,200–1,800 words
**Structure to follow:**

```
3. Methodology

3.1 Experimental Framework
    - Describe feijoa fruit samples and PMAP configuration
    - Detail the 9 packaging × temperature conditions
    - Explain the 0–35 day observation period

3.2 Data Collection and Sources
    - Describe original tabular dataset (color, firmness, 9 conditions)
    - Explain the WPD (WebPlotDigitizer) extraction method
    - Note which variables were directly observed vs synthesised

3.3 Synthetic Data Generation
    - Explain why synthetic data was necessary (small original dataset)
    - Describe cubic spline interpolation step
    - Describe Gaussian noise augmentation (5 replications, σ values)
    - Explain physics-based models for weight loss, WVTR, O2, CO2, RH
    - State that synthetic variables are estimates calibrated to literature
    - Cite the equations used (include them formally)

3.4 Image Dataset and Auto-Labelling
    - State that 1,000+ feijoa images were collected
    - Explain SigLIP zero-shot classification for automated labelling
    - State confidence threshold (0.45) and resulting class distribution
    - Describe 70/15/15 stratified split

3.5 Model 1 — Fruit State Classifier
    - Justify SigLIP selection over alternatives
    - Describe fine-tuning procedure (base model, head architecture,
      hyperparameters, augmentation, early stopping)
    - State evaluation metrics used

3.6 Model 2 — Quality Parameter Regressor
    - Justify Random Forest selection
    - Describe feature set and 6 target variables
    - Describe multi-output wrapper approach
    - State evaluation metrics used

3.7 Web Application Architecture
    - Briefly describe FastAPI backend, PostgreSQL, React frontend
    - Describe Vercel deployment and Hugging Face Hub model storage

3.8 Evaluation Framework
    - Accuracy, F1, confusion matrix (Model 1)
    - R², RMSE, MAE per target (Model 2)
    - State that test set was held out until final evaluation
```

**In the methodology text, fill in actual values from training:**
- Exact class distribution after SigLIP labelling
- Actual image count per split
- Actual training duration
- Actual hyperparameters used

---

### 12.2 `results_discussion.txt` — Generate after evaluation

**Target:** 2,000–2,800 words
**Structure to follow:**

```
4. Results and Discussion

4.1 Model 1 Results — Fruit State Classifier
    - Report accuracy, macro F1, per-class precision/recall/F1
    - Describe confusion matrix (which classes confused most)
    - Show training/validation accuracy curves (describe trends)
    - Sample prediction examples (describe 3–5 representative cases)

4.2 Model 2 Results — Quality Parameter Regressor
    - Report R², RMSE, MAE for all 6 targets in a table
    - Describe actual vs predicted plots for each target
    - Identify which targets were predicted most/least accurately
    - Feature importance analysis: which inputs drove predictions most

4.3 Discussion
    - Compare Model 1 accuracy against similar CNN fruit classification studies
    - Compare Model 2 R² against similar MAP quality prediction studies
    - Discuss whether temperature or perforation count had greater influence
    - Discuss the impact of synthetic data on model reliability
    - Discuss practical implications for supply chain packaging decisions

4.4 Limitations
    - Small original dataset (99 rows) before augmentation
    - Synthetic environmental variables (not directly measured)
    - SigLIP auto-labelling introduces potential labelling noise
    - Only three temperatures tested; generalisability to ambient conditions
    - Single fruit variety (feijoa); model not validated on other fruits
```

**Fill in from actual evaluation results:**
- All metric values from `evaluation_metrics.json` and Model 1 training log
- Confusion matrix cell counts
- Feature importance rankings

---

### 12.3 `conclusion.txt` — Generate last

**Target:** 600–900 words
**Structure to follow:**

```
5. Conclusion

5.1 Summary of Findings
    - Restate the two research objectives
    - Summarise Model 1 performance and what it achieved
    - Summarise Model 2 performance and what it achieved
    - State whether both models met the acceptance thresholds

5.2 Contributions to Knowledge
    - Demonstrated feasibility of SigLIP transfer learning for
      feijoa quality classification
    - Developed a multi-output Random Forest pipeline for
      simultaneous prediction of 6 quality parameters
    - Created a physics-informed synthetic dataset methodology
      applicable to other small post-harvest datasets
    - Delivered an accessible web application for real-world deployment

5.3 Recommendations for Future Work
    - Collect larger experimental dataset to reduce reliance on synthesis
    - Integrate real-time IoT sensor data (temperature, RH, gas sensors)
      for live prediction during transit
    - Extend to multi-fruit models
    - Investigate LSTM or Transformer-based models for time-series prediction
    - Conduct field validation with commercial supply chain partners

5.4 Final Remarks
    - Brief closing statement on significance of ML in post-harvest management
```

---

## 13. Sub-Agent Instructions

This project is broken into parallel workstreams that can be assigned to sub-agents.
Each agent has a clearly bounded scope. Agents must not modify files outside their scope.

---

### Agent 1 — Data Agent
**Scope:** `data/`, `notebooks/01_eda.ipynb`
**Tasks:**
1. Load `feijoa_model2_dataset.xlsx` from `data/raw/`
2. Perform EDA: distribution plots, correlation heatmap, time-series plots per condition
3. Split into train/val/test CSVs (stratified by `condition_id`)
4. Fit and save `StandardScaler` on training features
5. Save processed CSVs to `data/processed/`
6. Save scaler to `models/model2/scaler.pkl`

**Does NOT:** train any models, touch the image dataset

---

### Agent 2 — Model 1 Agent
**Scope:** `notebooks/02_model1_training.ipynb`, `models/model1/`
**Tasks:**
1. Load image dataset from `data/images/` using `ImageDataGenerator`
2. Build MobileNetV2 CNN architecture and two-phase training loop per §6
3. Run Phase A (frozen base, 10 epochs) then Phase B (fine-tuning, up to 20 epochs)
4. Evaluate on test set — report all metrics in §6.5
5. Save `model1_best.h5`, export `model1_best.onnx`, and save `training_log.json`, `confusion_matrix.png`, `training_curves.png`
6. Upload all model files to Hugging Face Hub per §11.1
7. Write `docs/dissertation/methodology.txt` (Model 1 sections only)

**Depends on:** Image dataset being present in `data/images/`
**Does NOT:** touch Model 2, backend, or frontend

---

### Agent 3 — Model 2 Agent
**Scope:** `notebooks/03_model2_training.ipynb`, `models/model2/`
**Tasks:**
1. Load `data/processed/model2_train.csv` (from Agent 1)
2. Load scaler from `models/model2/scaler.pkl`
3. Train MultiOutputRegressor(RandomForestRegressor) per §7
4. Evaluate on test set — all metrics in §7.3 per target
5. Save `random_forest.pkl` and evaluation plots
6. Upload to Hugging Face Hub
7. Append Model 2 sections to `docs/dissertation/methodology.txt`

**Depends on:** Agent 1 completing data processing
**Does NOT:** touch Model 1, backend, or frontend

---

### Agent 4 — Backend Agent
**Scope:** `backend/`
**Tasks:**
1. Build FastAPI app per §8
2. Set up PostgreSQL connection and run table creation
3. Implement all three endpoint routes
4. Load models from Hugging Face Hub on startup
5. Write unit tests for both endpoints
6. Test locally with Uvicorn before deployment

**Depends on:** Models uploaded to Hugging Face Hub (Agents 2 & 3)
**Does NOT:** touch frontend or dissertation

---

### Agent 5 — Frontend Agent
**Scope:** `frontend/`
**Tasks:**
1. Scaffold React app with Tailwind CSS
2. Build all pages and components per §9
3. Connect to backend API using Axios client
4. Implement Recharts quality curve chart
5. Test end-to-end with local backend before deployment

**Depends on:** Backend running locally (Agent 4)
**Does NOT:** touch backend, models, or dissertation

---

### Agent 6 — Deployment Agent
**Scope:** Vercel deployment, environment variables
**Tasks:**
1. Deploy backend to Vercel (serverless Python)
2. Deploy frontend to Vercel
3. Set all environment variables in Vercel dashboard
4. Run live end-to-end smoke test
5. Return live URLs

**Depends on:** Agents 4 and 5 complete
**Does NOT:** modify any application code

---

### Agent 7 — Dissertation Agent
**Scope:** `docs/dissertation/`
**Tasks:**
1. Wait for Agents 2 and 3 to complete and produce evaluation metrics
2. Draft `methodology.txt` per §12.1 using actual values
3. Draft `results_discussion.txt` per §12.2 using actual metric values
4. Draft `conclusion.txt` per §12.3
5. All text must be in formal academic English, third person

**Depends on:** All model training and evaluation complete
**Does NOT:** touch any code

---

## 14. Evaluation Criteria & Acceptance Thresholds

| Item | Acceptance Criteria |
|---|---|
| Model 1 accuracy | ≥ 85% on test set |
| Model 1 macro F1 | ≥ 0.82 |
| Model 2 R² (all targets) | ≥ 0.85 per target |
| API response time (classify) | < 5 seconds |
| API response time (predict) | < 1 second |
| Frontend renders on mobile | Yes (responsive Tailwind layout) |
| Prediction history persists | Yes (PostgreSQL) |
| Models load on cold start | < 30 seconds (Vercel limit) |
| Live URL accessible | Yes (Vercel deployment) |
| Dissertation sections drafted | methodology.txt, results_discussion.txt, conclusion.txt |

If any model metric falls below threshold, do NOT re-tune.
Document honest results and address in limitations section.

---

## 15. Completion Checklist

Use this to track progress. Mark each item `[x]` when done.

### Data
- [x] Image dataset labelled with SigLIP and split into train/val/test
- [x] Model 2 tabular dataset loaded and split into train/val/test CSVs
- [x] StandardScaler fitted and saved

### Models
- [x] Model 1 trained, evaluated, confusion matrix generated
- [ ] Model 1 uploaded to Hugging Face Hub
- [x] Model 2 trained, evaluated, feature importance generated
- [ ] Model 2 uploaded to Hugging Face Hub

### Backend
- [x] FastAPI app builds and runs locally
- [x] `/predict/classify` endpoint working
- [x] `/predict/quality` endpoint working
- [x] `/history` endpoint working
- [x] `/predict/quality/curve` endpoint working
- [ ] PostgreSQL connected and table created
- [ ] Unit tests passing

### Frontend
- [x] React app builds without errors
- [x] Classify page functional end-to-end
- [x] Predict page functional with chart
- [x] History page loading from database
- [x] Methodology page content added

### Deployment
- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] Live smoke test passed
- [ ] Live URL confirmed

### Dissertation
- [x] `methodology.txt` drafted with actual values
- [x] `results_discussion.txt` drafted with actual metrics
- [x] `conclusion.txt` drafted

---

*End of PROJECT.md — last updated: June 2026*
*All decisions are final unless explicitly revised with a dated update log entry above.*
