"""SQLAlchemy database configuration and prediction history model."""

import os
from datetime import datetime
from functools import lru_cache
from pathlib import Path

from sqlalchemy import Column, DateTime, Integer, JSON, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


ROOT_DIR = Path(__file__).resolve().parents[3]
DEFAULT_SQLITE_URL = f"sqlite:///{ROOT_DIR / 'backend' / 'feijoa_predictions.db'}"


def _normalize_database_url(url: str) -> str:
    """Return a SQLAlchemy-compatible database URL."""
    if url.startswith("postgres://"):
        return "postgresql://" + url.removeprefix("postgres://")
    return url


DATABASE_URL = _normalize_database_url(os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or DEFAULT_SQLITE_URL)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True, pool_recycle=300)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Prediction(Base):
    """Persist a single classifier or regressor prediction."""

    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String(20), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    input_data = Column(JSON, nullable=False)
    output_data = Column(JSON, nullable=False)
    input_summary = Column(String(200))


@lru_cache(maxsize=1)
def ensure_tables() -> None:
    """Create persistence tables once, when a database-backed endpoint is used."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Yield a database session for FastAPI dependency injection."""
    ensure_tables()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
