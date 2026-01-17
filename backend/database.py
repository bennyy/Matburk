"""Database configuration and session management.

Supports optional Postgres via the `DATABASE_URL` environment variable.
If `DATABASE_URL` is not set the module falls back to a local SQLite file.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Read DATABASE_URL from environment; fallback to local SQLite file
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./matplanerare.db")

# Fetch variables
USER = os.getenv("user", "sqlite")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

# Construct the SQLAlchemy connection string


# Create engine with backend-specific options
if USER.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"
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
