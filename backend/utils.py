"""Utility functions for Matplanerare API."""

import secrets
import string
from typing import Optional
from sqlalchemy.orm import Session
import models


def generate_share_code(length: int = 6) -> str:
    """Generate a random alphanumeric code (uppercase A-Z and 0-9).

    Uses cryptographically secure randomness.

    Args:
        length: Length of the code (default 6)

    Returns:
        Random alphanumeric code
    """
    chars = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))


def generate_token(length: int = 24) -> str:
    """Generate a longer mixed-case token suitable for URLs.

    Uses uppercase/lowercase letters and digits with secure randomness.
    """
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))


def get_user_permission_for_plan(user_id: int, meal_plan_id: int, db: Session) -> Optional[models.Permission]:
    """Get the permission level for a user on a specific meal plan.

    Args:
        user_id: User ID
        meal_plan_id: Meal plan ID
        db: Database session

    Returns:
        Permission enum or None if no access
    """
    access = (
        db.query(models.UserMealPlanAccess)
        .filter(
            models.UserMealPlanAccess.user_id == user_id,
            models.UserMealPlanAccess.meal_plan_id == meal_plan_id,
        )
        .first()
    )
    return access.permission if access else None


def can_edit_plan(user_id: int, meal_plan_id: int, db: Session) -> bool:
    """Check if user has edit permission on a meal plan.

    Args:
        user_id: User ID
        meal_plan_id: Meal plan ID
        db: Database session

    Returns:
        True if user can edit, False otherwise
    """
    permission = get_user_permission_for_plan(user_id, meal_plan_id, db)
    return permission in (models.Permission.OWNER, models.Permission.EDIT)


def can_view_plan(user_id: int, meal_plan_id: int, db: Session) -> bool:
    """Check if user has any access to a meal plan.

    Args:
        user_id: User ID
        meal_plan_id: Meal plan ID
        db: Database session

    Returns:
        True if user has access (view or edit), False otherwise
    """
    permission = get_user_permission_for_plan(user_id, meal_plan_id, db)
    return permission is not None
