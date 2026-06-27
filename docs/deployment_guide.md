Purpose: Step-by-step deployment guide for hosting the Feijoa ML model artifacts on Hugging Face Hub and deploying the FastAPI backend and React frontend.

# Feijoa Fruit Quality ML System Deployment Guide

Last verified: 2026-06-08

This guide follows `PROJECT.md` as the project-specific source of truth. It covers:

1. Uploading trained model artifacts to Hugging Face Hub.
2. Creating the PostgreSQL database.
3. Setting up and deploying the FastAPI backend.
4. Setting up and deploying the React frontend.
5. Running the required end-to-end smoke tests.

Important project constraints:

- Model 1 is the TensorFlow/Keras MobileNetV2 CNN trained as `models/model1/model1_best.h5` and exported for Vercel inference as `models/model1/model1_best.onnx`.
- Model 2 is the scikit-learn Random Forest regressor stored at `models/model2/random_forest.pkl`.
- `models/model2/scaler.pkl` must be deployed with Model 2.
- SigLIP was used only for one-time image auto-labelling. Do not upload, load, import, deploy, or reference SigLIP as an inference model.
- The Hugging Face model repositories should be public unless you intentionally choose private repos and configure `HF_TOKEN`.
- The backend and frontend should be deployed as separate Vercel projects: `feijoa-backend` and `feijoa-frontend`.

## 0. Required Accounts and Local Tools

Create accounts:

- Hugging Face: https://huggingface.co
- Vercel: https://vercel.com
- Supabase PostgreSQL: https://supabase.com

Deployment will be done through web dashboards, not CLIs.

Also prepare one Git provider account because Vercel dashboard deployments are normally imported from Git:

- GitHub: https://github.com
- GitLab: https://gitlab.com
- Bitbucket: https://bitbucket.org

If the project is not already in a Git repository provider, upload it through GitHub Desktop or the GitHub web interface before importing it into Vercel.

Optional local tools for testing only:

```powershell
node --version
npm --version
python --version
```

You may skip all optional local terminal checks if you only want to deploy through the web UI. Vercel will install backend/frontend dependencies during dashboard deployments.

Get secrets:

- Hugging Face token with write access: https://huggingface.co/settings/tokens
- Supabase Postgres connection string after database creation.

Never commit `.env`, `.env.local`, `.env.production.local`, Hugging Face tokens, or database passwords.

## 1. Upload Models to Hugging Face Hub Using the Web UI

Create the Model 1 repository:

1. Go to https://huggingface.co.
2. Sign in.
3. Click your profile/avatar.
4. Click `New Model`.
5. Repository name: `feijoa-classifier`.
6. Visibility: `Public`, unless you intentionally want to configure `HF_TOKEN`.
7. Click `Create model`.
8. Open the new repository.
9. Go to `Files and versions`.
10. Click `Add file` → `Upload files`.
11. Upload the required files from `models/model1/`.

Model 1 required files:

- `model1_best.onnx`
- `class_indices.json`
- `training_log.json`
- `model1_evaluation_metrics.json`
- `confusion_matrix.png`
- `training_curves.png`
- `README.md`

Create the Model 2 repository:

1. Click your profile/avatar.
2. Click `New Model`.
3. Repository name: `feijoa-regressor`.
4. Visibility: `Public`, unless you intentionally want to configure `HF_TOKEN`.
5. Click `Create model`.
6. Open the new repository.
7. Go to `Files and versions`.
8. Click `Add file` → `Upload files`.
9. Upload the required files from `models/model2/`.

Model 2 required files:

- `random_forest.pkl`
- `scaler.pkl`
- `evaluation_metrics.json`
- `feature_importance.png`
- `actual_vs_predicted_*.png`
- `README.md`

Verify in the browser:

```text
https://huggingface.co/<your-huggingface-username>/feijoa-classifier
https://huggingface.co/<your-huggingface-username>/feijoa-regressor
```

If the repositories are public, the backend can download files without `HF_TOKEN`. If you make them private, add `HF_TOKEN` to the backend Vercel environment variables.

## 2. Create PostgreSQL Database on Supabase

Create a Supabase project:

1. Go to https://supabase.com.
2. Create a new project named `feijoa-ml`.
3. Choose a nearby region.
4. Save the database password securely.
5. Open the project dashboard and click `Connect`.
6. Choose the transaction pooler connection string for serverless deployments.

The connection string should look similar to:

```text
postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
```

Notes:

- Supabase may show the scheme as `postgres://`. The backend normalizes that to `postgresql://`, but using `postgresql://` in `DATABASE_URL` is preferred.
- For Vercel/serverless, use Supabase's transaction pooler on port `6543`.
- Keep `sslmode=require` in the connection string.
- If your database password contains special characters, URL-encode them before using the connection string.

Run the schema in the Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS predictions (
    id              SERIAL PRIMARY KEY,
    model_type      VARCHAR(20) NOT NULL,
    timestamp       TIMESTAMP DEFAULT NOW(),
    input_data      JSONB NOT NULL,
    output_data     JSONB NOT NULL,
    input_summary   TEXT
);

CREATE INDEX IF NOT EXISTS idx_predictions_model_type
    ON predictions(model_type);

CREATE INDEX IF NOT EXISTS idx_predictions_timestamp
    ON predictions(timestamp DESC);
```

Save the connection string. It will be used as `DATABASE_URL`.

## 3. Backend Setup

The backend directory does not currently exist in this workspace. Create it before deploying.

Required structure:

```text
backend/
  main.py
  requirements.txt
  vercel.json
  app/
    routes/
      classify.py
      predict.py
      history.py
    models/
      schemas.py
      db.py
```

`backend/main.py` must expose a FastAPI instance named `app`:

```python
"""FastAPI entry point for the Feijoa ML API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import classify, predict, history

app = FastAPI(title="Feijoa ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to frontend URL after deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router, prefix="/predict")
app.include_router(predict.router, prefix="/predict")
app.include_router(history.router, prefix="/history")


@app.get("/health")
def health():
    """Return backend health status."""
    return {"status": "ok"}
```

Create `backend/requirements.txt`:

```text
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

Do not include TensorFlow in the Vercel backend requirements. The classifier is trained in TensorFlow/Keras, but the deployed serverless backend uses the exported ONNX artifact to stay below Vercel's function size limit.

Create `backend/vercel.json`:

```json
{
  "builds": [{ "src": "main.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "main.py" }]
}
```

The backend must load these files from Hugging Face Hub at startup:

```python
"""Model loading helpers for Hugging Face-hosted Feijoa artifacts."""

import os
import json
from huggingface_hub import hf_hub_download
import joblib
import onnxruntime as ort


def load_models(app):
    """Download and attach trained Model 1 and Model 2 artifacts to app.state."""
    hf_username = os.environ["HF_USERNAME"]
    token = os.getenv("HF_TOKEN") or None

    classifier_repo = f"{hf_username}/feijoa-classifier"
    regressor_repo = f"{hf_username}/feijoa-regressor"

    classifier_path = hf_hub_download(
        repo_id=classifier_repo,
        filename="model1_best.onnx",
        token=token,
    )
    class_indices_path = hf_hub_download(
        repo_id=classifier_repo,
        filename="class_indices.json",
        token=token,
    )
    regressor_path = hf_hub_download(
        repo_id=regressor_repo,
        filename="random_forest.pkl",
        token=token,
    )
    scaler_path = hf_hub_download(
        repo_id=regressor_repo,
        filename="scaler.pkl",
        token=token,
    )

    app.state.classifier = ort.InferenceSession(classifier_path, providers=["CPUExecutionProvider"])
    app.state.regressor = joblib.load(regressor_path)
    app.state.scaler = joblib.load(scaler_path)

    with open(class_indices_path, "r", encoding="utf-8") as f:
        app.state.class_indices = json.load(f)
```

Backend endpoints required by `PROJECT.md`:

- `GET /health`
- `POST /predict/classify`
- `POST /predict/quality`
- `GET /predict/quality/curve`
- `GET /history`

Model 1 response:

```json
{
  "predicted_state": "ripe",
  "confidence": 0.91,
  "scores": {
    "unripe": 0.03,
    "ripe": 0.91,
    "overripe": 0.06
  }
}
```

Model 2 input:

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

Model 2 output:

```json
{
  "weight_loss_pct": 0.0,
  "wvtr_g_m2_day": 0.0,
  "o2_pct": 0.0,
  "co2_pct": 0.0,
  "rh_pct": 0.0,
  "firmness_N": 0.0
}
```

Use the real model prediction values in the backend response. The zeros above only show the response shape.

## 4. Backend Local Test

Create `backend/.env.local` for local reference only:

```text
DATABASE_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
HF_USERNAME=your-huggingface-username
HF_TOKEN=
HF_HOME=/tmp/feijoa_huggingface_cache
```

Unless the backend explicitly loads `.env.local`, set the same values in the terminal before running `uvicorn`:

```powershell
$env:DATABASE_URL = "postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require"
$env:HF_USERNAME = "your-huggingface-username"
$env:HF_TOKEN = ""
```

Run locally:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Verify:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Expected:

```json
{"status":"ok"}
```

Test quality prediction:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8000/predict/quality `
  -ContentType "application/json" `
  -Body '{"time_days":14,"temperature":12,"perforations":2,"a_star":-1.2,"b_star":16.5,"lightness_L":69.3}'
```

## 5. Backend Deployment to Vercel Using the Web UI

Prerequisite: the project repository must be available in GitHub, GitLab, or Bitbucket. Vercel's dashboard imports deployments from Git repositories.

Import the backend:

1. Go to https://vercel.com/dashboard.
2. Click `Add New` → `Project`.
3. Choose the Git provider that contains this repository.
4. Select/import the feijoa project repository.
5. Project name: `feijoa-backend`.
6. Set `Root Directory` to `backend`.
7. Keep the framework preset as `Other` if Vercel does not auto-detect the Python backend.
8. Confirm that Vercel will use `backend/vercel.json`.

Add backend environment variables before deploying:

1. In the import screen, open `Environment Variables`.
2. Add `DATABASE_URL` with the Supabase transaction pooler connection string.
3. Add `HF_USERNAME` with your Hugging Face username.
4. Add `HF_TOKEN` only if the Hugging Face repositories are private.
5. Add `HF_HOME` with `/tmp/feijoa_huggingface_cache`.
6. Apply the variables to `Production`, `Preview`, and `Development` unless you intentionally want different environments.
7. Click `Deploy`.

Save the deployed backend URL:

```text
https://feijoa-backend-xxxx.vercel.app
```

Verify:

Open this URL in a browser:

```text
https://feijoa-backend-xxxx.vercel.app/health
```

Expected:

```json
{"status":"ok"}
```

Also open:

```text
https://feijoa-backend-xxxx.vercel.app/docs
```

If the backend fails:

1. Open the `feijoa-backend` project in the Vercel dashboard.
2. Go to `Deployments`.
3. Open the failed deployment.
4. Read `Build Logs` first.
5. After a successful build, use the deployment `Runtime Logs` for request-time errors.

Common fixes:

- `ModuleNotFoundError`: dependency missing from `backend/requirements.txt`.
- `HFValidationError` or 404: `HF_USERNAME` or repo names are wrong.
- Vercel bundle exceeds 500 MB: confirm `tensorflow` is not in `backend/requirements.txt` and `model1_best.onnx` is uploaded to Hugging Face.
- Database connection failure: confirm `DATABASE_URL` uses the Supabase transaction pooler host, port `6543`, and `sslmode=require`.
- CORS failure: after frontend deploy, replace `allow_origins=["*"]` with the actual frontend URL.

## 6. Frontend Setup

The frontend directory does not currently exist in this workspace. Create it before deploying.

Because `PROJECT.md` uses `process.env.REACT_APP_API_URL`, set up the frontend as a Create React App style React app or keep the same environment variable convention in your chosen React setup.

Required pages/components:

```text
frontend/
  package.json
  .env.production
  src/
    api/
      client.js
    pages/
      Home.jsx
      Classify.jsx
      Predict.jsx
      History.jsx
      Methodology.jsx
```

Create the React app and install dependencies:

```powershell
cd "D:\document\dev\work\client projects\feijoa-classification-and-weightloss-prediction"
npx create-react-app frontend
cd frontend
npm install axios recharts react-router-dom
```

Create `frontend/src/api/client.js`:

```javascript
/** API client for the Feijoa React frontend. */

import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: API_BASE });

export const classifyImage = (formData) =>
  api.post("/predict/classify", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const predictQuality = (data) => api.post("/predict/quality", data);

export const getQualityCurve = (params) =>
  api.get("/predict/quality/curve", { params });

export const getPredictionHistory = (params) => api.get("/history", { params });
```

Create `frontend/.env.production`:

```text
REACT_APP_API_URL=https://feijoa-backend-xxxx.vercel.app
```

Use the real backend URL from the backend deployment.

Frontend behaviours required by `PROJECT.md`:

- `/` shows project summary and navigation.
- `/classify` uploads an image and calls `POST /predict/classify`.
- `/predict` submits six numeric features and calls `POST /predict/quality`.
- `/predict` also calls `GET /predict/quality/curve` for the 0-35 day chart.
- `/history` calls `GET /history`.
- `/methodology` explains Model 1 and Model 2.

Local test:

```powershell
cd frontend
npm install
npm run build
npm start
```

Open:

```text
http://localhost:3000
```

## 7. Frontend Deployment to Vercel

Deploy the frontend through the Vercel dashboard:

1. Go to https://vercel.com/dashboard.
2. Click `Add New` → `Project`.
3. Import the same Git repository again.
4. Project name: `feijoa-frontend`.
5. Set `Root Directory` to `frontend`.
6. Framework preset: `Create React App` if detected; otherwise choose the React/static frontend option Vercel suggests.
7. Open `Environment Variables`.
8. Add `REACT_APP_API_URL`.
9. Set its value to the deployed backend URL:

```text
https://feijoa-backend-xxxx.vercel.app
```

10. Apply the variable to `Production`, `Preview`, and `Development`.
11. Click `Deploy`.

Save the deployed frontend URL:

```text
https://feijoa-frontend-xxxx.vercel.app
```

Important: CRA embeds `REACT_APP_*` values at build time. If you change `REACT_APP_API_URL`, redeploy the frontend.

## 8. Lock Down Backend CORS

After the frontend URL is known, change backend CORS from:

```python
allow_origins=["*"]
```

to:

```python
allow_origins=["https://feijoa-frontend-xxxx.vercel.app"]
```

Redeploy backend:

1. Push the CORS code change to the Git repository.
2. Open the `feijoa-backend` project in the Vercel dashboard.
3. Go to `Deployments`.
4. Vercel should automatically create a new deployment from the pushed commit.
5. If automatic deployment is disabled, click the latest deployment menu and choose `Redeploy`.

## 9. Required Smoke Tests

Run all six checks from `PROJECT.md` Section 11.6. These checks can be completed from the browser and FastAPI Swagger UI; terminal commands are not required.

1. Backend health:

Open:

```text
https://feijoa-backend-xxxx.vercel.app/health
```

Expected:

```json
{"status":"ok"}
```

2. Backend API docs:

```text
https://feijoa-backend-xxxx.vercel.app/docs
```

Expected: FastAPI Swagger UI loads and shows all endpoints.

3. Model 2 quality prediction:

Open Swagger UI:

```text
https://feijoa-backend-xxxx.vercel.app/docs
```

Use `POST /predict/quality` → `Try it out` with this body:

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

Expected: JSON with `weight_loss_pct`, `wvtr_g_m2_day`, `o2_pct`, `co2_pct`, `rh_pct`, and `firmness_N`.

4. Model 1 image classification:

In Swagger UI, use `POST /predict/classify` → `Try it out`.

Upload any JPEG or PNG feijoa image from:

```text
data/images/test/ripe/
data/images/test/unripe/
data/images/test/overripe/
```

Expected: JSON with `predicted_state`, `confidence`, and all three class scores.

5. Prediction history:

Open:

```text
https://feijoa-backend-xxxx.vercel.app/history?limit=10&offset=0
```

Expected: JSON with a `predictions` array. It may be empty before the first successful prediction.

6. Frontend end-to-end:

Open:

```text
https://feijoa-frontend-xxxx.vercel.app
```

Expected:

- Home page loads.
- Navigation works.
- Classify page accepts an image and returns Model 1 output.
- Predict page returns Model 2 outputs.
- Quality curve chart renders.
- History page loads stored predictions.

Deployment is complete only after all six checks pass.

## 10. Final Environment Variable Summary

Backend Vercel project:

| Variable | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase Postgres transaction pooler connection string |
| `HF_USERNAME` | Yes | Hugging Face username |
| `HF_TOKEN` | Only for private repos | Hugging Face read token |
| `HF_HOME` | Recommended | `/tmp/feijoa_huggingface_cache` |

Frontend Vercel project:

| Variable | Required | Value |
| --- | --- | --- |
| `REACT_APP_API_URL` | Yes | Backend production URL |

Local-only files:

| File | Purpose |
| --- | --- |
| `backend/.env.local` | Local backend DB and Hugging Face config |
| `frontend/.env.production` | Local production build backend URL |

Do not commit local env files containing secrets.

## 11. Deployment Troubleshooting Checklist

Hugging Face:

- Confirm repo names are exactly `feijoa-classifier` and `feijoa-regressor`.
- Confirm `model1_best.onnx`, `class_indices.json`, `random_forest.pkl`, and `scaler.pkl` are present in the Hub repos.
- Confirm public/private setting matches whether `HF_TOKEN` is configured.

Backend:

- Confirm `main.py` exposes `app`.
- Confirm `backend/vercel.json` routes all traffic to `main.py`.
- Confirm `DATABASE_URL` is present in the backend Vercel project.
- Confirm the Supabase `predictions` table and indexes exist.
- Confirm no dataset folders are bundled into backend deployment.
- If the build says TensorFlow exceeds Vercel size limits, redeploy after removing TensorFlow from `backend/requirements.txt` and uploading `model1_best.onnx`.

Frontend:

- Confirm `REACT_APP_API_URL` is set in the frontend Vercel project.
- Redeploy after changing `REACT_APP_API_URL`.
- Confirm the frontend is calling the production backend URL, not `localhost`.
- Confirm CORS allows the deployed frontend URL.

## 12. Official References Used

- Hugging Face Hub upload guide: https://huggingface.co/docs/huggingface_hub/guides/upload
- Vercel FastAPI deployment: https://vercel.com/docs/frameworks/backend/fastapi
- Vercel Python runtime: https://vercel.com/docs/functions/runtimes/python
- Vercel Create React App deployment: https://vercel.com/docs/frameworks/frontend/create-react-app
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Supabase Postgres connections: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase SSL enforcement: https://supabase.com/docs/guides/platform/ssl-enforcement
- Supabase with Vercel: https://supabase.com/partners/integrations/vercel
- Create React App environment variables: https://create-react-app.dev/docs/adding-custom-environment-variables/
