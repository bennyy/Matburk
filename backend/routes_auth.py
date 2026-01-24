"""Authentication endpoints for Matplanerare API."""

from fastapi import APIRouter, Depends
from auth import verify_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
def register_user(user_info: dict = Depends(verify_token)):
    """Endpoint to handle user registration after Firebase auth."""
    # Here you can create the user in your database if needed
    return {
        "message": "User registered",
        "uid": user_info["uid"],
        "email": user_info["email"],
    }


@router.get("/me")
def get_current_user(user_info: dict = Depends(verify_token)):
    """Get current user info."""
    return user_info
