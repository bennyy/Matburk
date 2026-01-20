"""Database configuration and session management.

Supports optional Postgres via the `DATABASE_URL` environment variable.
If `DATABASE_URL` is not set the module falls back to a local SQLite file.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database type setting (sqlite or postgresql)
DB_TYPE = os.getenv("MATBURK_DATABASE_TYPE", "sqlite")

# Database URL setting
DATABASE_URL = os.getenv("MATBURK_DATABASE_URL", "sqlite:///./data/matplanerare.db")

# Create engine with backend-specific options
if DB_TYPE == "sqlite":
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    # For PostgreSQL (and other DSNs) rely on the provided URL and enable
    # pool_pre_ping to avoid stale connection errors in long-running servers.
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and closes it afterwards."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
