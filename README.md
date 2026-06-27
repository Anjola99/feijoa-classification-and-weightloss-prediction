Purpose: Repository overview and deployment instructions for the Feijoa Fruit Quality ML System.

# Feijoa Fruit Quality ML System

This repository contains the deployable backend and frontend for a two-model feijoa fruit quality system.

The system evaluates feijoa fruit quality under perforated modified atmosphere packaging using:

- **Model 1:** TensorFlow/Keras MobileNetV2 CNN for fruit state classification: `unripe`, `ripe`, `overripe`.
- **Model 2:** scikit-learn Random Forest regressor for post-harvest quality prediction.
- **Backend:** FastAPI API deployed as a Vercel Python serverless app.
- **Frontend:** React-style static interface deployed as a Vercel frontend app.
- **Database:** Supabase PostgreSQL for prediction history.
- **Model storage:** Hugging Face Hub.

SigLIP was used only for one-time image auto-labelling during dataset preparation. It is not the deployed Model 1 and is not loaded by the backend or frontend.

## Current Model Performance

Model 1, the MobileNetV2 classifier, achieved:

| Metric | Value |
| --- | --- |
| Test accuracy | `0.900990` |
| Macro F1 | `0.901290` |
| Weighted F1 | `0.901328` |
| Unripe F1 | `0.906977` |
| Ripe F1 | `0.870968` |
| Overripe F1 | `0.925926` |

Model 2, the Random Forest regressor, achieved held-out test R2 values above `0.99` for all six targets:

- `weight_loss_pct`
- `wvtr_g_m2_day`
- `o2_pct`
- `co2_pct`
- `rh_pct`
- `firmness_N`

## Repository Structure

```text
backend/
  main.py                    FastAPI app entry point
  requirements.txt           Python dependencies for Vercel
  vercel.json                Vercel backend routing/build config
  app/
    models/                  SQLAlchemy and Pydantic models
    routes/                  classify, quality prediction, history routes
    services/                Hugging Face model loading and inference helpers

frontend/
  package.json               Static frontend scripts
  vercel.json                Vercel frontend build config
  public/                    Static HTML and model result assets
  src/                       React-style pages, components, and API client

docs/
  deployment_guide.md        Dashboard-first deployment guide

PROJECT.md                   Project specification and source of truth
```

Large local training assets such as `data/`, `models/`, notebooks, and dissertation drafts are not pushed in this deployment commit. The trained model files should be uploaded to Hugging Face Hub and loaded by the backend at runtime.

## Backend API

Base URL locally:

```text
http://localhost:8000
```

Main endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `POST` | `/predict/classify` | Upload a feijoa image and classify fruit state |
| `POST` | `/predict/quality` | Predict six quality parameters |
| `GET` | `/predict/quality/curve` | Predict 0-35 day quality curve |
| `GET` | `/history` | Read persisted prediction history |

The backend downloads these Hugging Face files at runtime when `HF_USERNAME` is configured:

- `your-username/feijoa-classifier/model1_best.onnx`
- `your-username/feijoa-classifier/class_indices.json`
- `your-username/feijoa-regressor/random_forest.pkl`
- `your-username/feijoa-regressor/scaler.pkl`

For local development only, the backend can fall back to local `models/model1/` and `models/model2/` paths if they exist.

## Environment Variables

Backend Vercel project:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase Postgres transaction pooler URL with `sslmode=require` |
| `HF_USERNAME` | Yes | Hugging Face username, without `@` |
| `HF_TOKEN` | Only for private HF repos | Hugging Face read token |
| `HF_HOME` | Recommended | Writable Hugging Face cache path: `/tmp/feijoa_huggingface_cache` |
| `POSTGRES_URL` | Optional fallback | Alternate DB URL name if supplied by a provider |

Frontend Vercel project:

| Variable | Required | Description |
| --- | --- | --- |
| `REACT_APP_API_URL` | Yes | Deployed backend URL, for example `https://feijoa-backend-xxxx.vercel.app` |

Do not commit real `.env` files, tokens, database URLs, or passwords.

## How To Get `HF_USERNAME`

1. Go to https://huggingface.co.
2. Sign in.
3. Open your profile.
4. Your username is the part after `huggingface.co/`.

Example:

```text
https://huggingface.co/myusername
HF_USERNAME=myusername
```

## How To Get `DATABASE_URL`

1. Go to https://supabase.com/dashboard.
2. Open your project.
3. Click `Connect`.
4. Choose the **transaction pooler** connection string for serverless deployment.
5. Replace the placeholder password with your actual database password.
6. Keep `sslmode=require`.

Expected shape:

```text
postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
```

The backend also normalizes `postgres://` to `postgresql://` for SQLAlchemy compatibility.

## Deployment

Use the dashboard-first guide:

[docs/deployment_guide.md](docs/deployment_guide.md)

High-level flow:

1. Upload Model 1 and Model 2 artifacts to Hugging Face Hub using the web UI.
2. Create a Supabase project and run the `predictions` table SQL.
3. Import this GitHub repository into Vercel as `feijoa-backend` with root directory `backend`.
4. Add backend env vars in Vercel.
5. Import the same repository into Vercel as `feijoa-frontend` with root directory `frontend`.
6. Add `REACT_APP_API_URL` in the frontend Vercel project.
7. Run the six smoke tests in the deployment guide.

## Optional Local Backend Test

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open:

```text
http://localhost:8000/health
http://localhost:8000/docs
```

## Optional Local Frontend Test

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

## Deployment Smoke Tests

Deployment is complete only when all checks pass:

1. `GET /health` returns `{"status":"ok"}`.
2. `/docs` loads FastAPI Swagger UI.
3. `POST /predict/quality` returns six quality values.
4. `POST /predict/classify` returns `predicted_state`, `confidence`, and class scores.
5. `GET /history` returns a prediction history response.
6. Frontend loads and can call both prediction flows.

## Notes

- Hugging Face repositories may be public to avoid needing `HF_TOKEN`.
- If Hugging Face repositories are private, set `HF_TOKEN` in the backend Vercel project.
- The MobileNetV2 classifier was trained in TensorFlow/Keras, then exported to ONNX for lightweight Vercel inference. Upload `model1_best.onnx` to Hugging Face before deploying.
- Supabase transaction pooler on port `6543` is recommended for Vercel serverless usage.
