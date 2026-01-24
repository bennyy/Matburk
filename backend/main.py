"""Main FastAPI application for Matplanerare."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import engine
from routes_auth import router as auth_router
from routes_plans import router as plans_router
from routes_recipes import router as recipes_router

# CORS configuration from environment
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Matplanerare API", description="Recipe planner API")


# Health check endpoint (no auth required)
@app.get("/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "message": "Matplanerare API is running"}


# Include routers
app.include_router(auth_router)
app.include_router(plans_router)
app.include_router(recipes_router)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
