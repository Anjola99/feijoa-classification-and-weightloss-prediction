# Feijoa Deployment Handoff

This package includes the latest Vercel fix for Hugging Face downloads.

## Latest Fix

The deployed backend was failing with:

```text
Read-only file system: '/home/sbx_user1051'
```

That happened because Hugging Face tried to write its cache in Vercel's read-only home directory.

The backend now forces Hugging Face downloads into:

```text
/tmp/feijoa_huggingface_cache
```

This is Vercel's writable runtime filesystem location.

## Backend Environment Variables

Set these in the backend Vercel project:

```text
DATABASE_URL=
HF_USERNAME=
HF_TOKEN=
HF_HOME=/tmp/feijoa_huggingface_cache
```

`HF_TOKEN` is only required if the Hugging Face repos are private.

## Frontend Environment Variable

Set this in the frontend Vercel project:

```text
REACT_APP_API_URL=https://your-current-working-backend-url.vercel.app
```

## Required Hugging Face Files

Classifier repo:

```text
model1_best.onnx
class_indices.json
```

Regressor repo:

```text
random_forest.pkl
scaler.pkl
```

## Redeploy Order

1. Upload this package to GitHub.
2. Redeploy backend with build cache disabled.
3. Test backend `/diagnostics`.
4. Redeploy frontend with the correct `REACT_APP_API_URL`.
5. Test classification and quality prediction.
