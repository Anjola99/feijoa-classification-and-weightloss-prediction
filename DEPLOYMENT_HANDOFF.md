# Feijoa Deployment Handoff

This package contains the deployable backend and frontend source code only.

Do not add local `.env` files, datasets, model folders, database files, logs, or `node_modules` to GitHub.

## Backend Vercel Project

Use `backend` as the project root directory.

Set these environment variables in Vercel:

- `DATABASE_URL`: Supabase PostgreSQL connection string with special characters URL-encoded and `?sslmode=require`
- `HF_USERNAME`: Hugging Face username or organization that owns the model repos
- `HF_TOKEN`: Hugging Face token, only needed if the model repos are private
- `HF_HOME`: `/tmp/feijoa_huggingface_cache`

Required Hugging Face files:

- `<HF_USERNAME>/feijoa-classifier/model1_best.onnx`
- `<HF_USERNAME>/feijoa-classifier/class_indices.json`
- `<HF_USERNAME>/feijoa-regressor/random_forest.pkl`
- `<HF_USERNAME>/feijoa-regressor/scaler.pkl`

After deployment, open `/`, `/health`, and `/diagnostics`.

## Frontend Vercel Project

Use `frontend` as the project root directory.

Set this environment variable in Vercel:

- `REACT_APP_API_URL`: the working backend Vercel URL, for example `https://feijoa-classifier-backend.vercel.app`

Do not include a trailing slash. The frontend code normalizes trailing slashes too, but keeping the env var clean avoids bad cached builds.

For local testing, the frontend defaults to `/api`, and `frontend/scripts/serve-static.js` proxies `/api/*` to `http://127.0.0.1:8000`.

After deployment, open the frontend URL. The page should show the Feijoa Quality header and Home, Results, and History navigation.

## Current Fixes Included

- Backend uses ONNX Runtime instead of TensorFlow for Vercel compatibility.
- Backend Hugging Face downloads use `/tmp/feijoa_huggingface_cache`, which is writable on Vercel.
- Frontend is self-contained plain JavaScript, so it does not depend on React/Babel CDN scripts at runtime.
- Frontend normalizes `REACT_APP_API_URL` to prevent double-slash API calls such as `//predict/quality`.
- Local frontend calls use a same-origin `/api` proxy to avoid browser fetch failures during local testing.
- Fruit classification includes a Reset button to clear image preview, classification result, and quality outputs.
- Fruit classification and quality prediction now show visible processing states while Model 1 and Model 2 are running.
- Home page cards no longer show trailing arrow markers.
- Local static server sends `Cache-Control: no-store` to avoid stale blank-page caching.
