"""FastAPI entry point for the Feijoa ML web API."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.routes import classify, history, predict
from app.services.model_loader import artifact_status


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the API without blocking on external services."""
    yield


app = FastAPI(title="Feijoa ML API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router, prefix="/predict")
app.include_router(predict.router, prefix="/predict")
app.include_router(history.router, prefix="/history")


@app.get("/")
def root():
    """Return basic API metadata for the Vercel deployment root."""
    return {
        "name": "Feijoa ML API",
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    """Return API health for smoke tests and deployment checks."""
    return {"status": "ok"}


@app.get("/diagnostics")
def diagnostics():
    """Return non-secret deployment diagnostics for API dependencies."""
    from app.models.db import DATABASE_URL, engine

    database = {
        "configured": not DATABASE_URL.startswith("sqlite"),
        "dialect": DATABASE_URL.split(":", maxsplit=1)[0],
        "ok": False,
    }
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database["ok"] = True
    except Exception as exc:
        database["error"] = str(exc)

    return {
        "status": "ok",
        "database": database,
        "artifacts": artifact_status(),
    }
