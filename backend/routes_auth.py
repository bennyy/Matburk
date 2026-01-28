"""Authentication endpoints for Matplanerare API."""

from typing import Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import auth
import schemas
from auth import verify_token
from database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.User)
async def register_user_endpoint(
    decoded_token: Dict = Depends(verify_token),
    db: Session = Depends(get_db),
) -> schemas.User:
    """Register or fetch user from Firebase token.

    This endpoint automatically creates a User record if it doesn't exist.
    """
    user = auth.register_user(decoded_token, db)
    return user


@router.get("/me")
def get_current_user(user_info: dict = Depends(verify_token)):
    """Get current user info."""
    return user_info
