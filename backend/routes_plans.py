"""User and meal plan management endpoints for Matplanerare API."""

from typing import Dict, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

import auth
import models
import schemas
import utils
from database import get_db

router = APIRouter(prefix="/api", tags=["plans"])

# Default settings
DEFAULT_PERSON_A = "Person A"
DEFAULT_PERSON_B = "Person B"


class MealPlanNameUpdate(BaseModel):
    name: str


@router.post("/plans/{plan_id}/name", response_model=Dict[str, str])
async def update_meal_plan_name(
    plan_id: int,
    name_update: MealPlanNameUpdate,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """Update the name of a meal plan (owner or editor only)."""
    user = auth.get_user(decoded_token, db)
    if not utils.can_edit_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this meal plan",
        )
    meal_plan = db.query(models.MealPlan).filter(models.MealPlan.id == plan_id).first()
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found",
        )
    meal_plan.name = name_update.name
    db.commit()
    return {"ok": "true", "name": meal_plan.name}


@router.post("/plans", response_model=schemas.MealPlan)
async def create_meal_plan(
    plan_data: Dict,  # {"name": "My Plan", "seed_test_recipes": bool}
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> schemas.MealPlan:
    """Create a new meal plan for the user.

    The user becomes the owner of the plan.

    Request body:
    - name: Required, name of the plan
    - seed_test_recipes: Optional, whether to seed test recipes (default: False)
    """
    user = auth.get_user(decoded_token, db)

    if not isinstance(plan_data, dict) or "name" not in plan_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request body must contain 'name' field",
        )

    # Create meal plan
    meal_plan = models.MealPlan(
        name=plan_data["name"],
        created_by_user_id=user.id,
    )
    db.add(meal_plan)
    db.flush()

    # Add user as owner
    access = models.UserMealPlanAccess(
        user_id=user.id,
        meal_plan_id=meal_plan.id,
        permission=models.Permission.OWNER,
    )
    db.add(access)

    # Initialize default settings for the plan
    for key, value in [("name_A", DEFAULT_PERSON_A), ("name_B", DEFAULT_PERSON_B)]:
        setting = models.MealPlanSetting(
            meal_plan_id=meal_plan.id,
            key=key,
            value=value,
        )
        db.add(setting)

    db.commit()
    db.refresh(meal_plan)

    # Initialize meal types (global, not per-plan)
    from routes_recipes import _initialize_meal_types_for_plan

    _initialize_meal_types_for_plan(db)

    # Always seed placeholder recipes for new plans
    from routes_recipes import _seed_placeholder_recipes_for_plan

    _seed_placeholder_recipes_for_plan(meal_plan.id, db)

    # Seed test recipes if requested
    if plan_data.get("seed_test_recipes", False):
        from routes_recipes import _seed_recipes_for_plan

        _seed_recipes_for_plan(meal_plan.id, db)

    return meal_plan


@router.get("/plans", response_model=List[schemas.MealPlanWithAccess])
async def list_user_meal_plans(
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> List[schemas.MealPlanWithAccess]:
    """List all meal plans the user has access to."""
    user = auth.get_user(decoded_token, db)

    accesses = (
        db.query(models.UserMealPlanAccess, models.MealPlan)
        .join(models.MealPlan)
        .filter(models.UserMealPlanAccess.user_id == user.id)
        .all()
    )

    result = []
    for access, meal_plan in accesses:
        plan_dict = {
            "id": meal_plan.id,
            "name": meal_plan.name,
            "created_by_user": {
                "id": meal_plan.created_by_user.id,
                "email": meal_plan.created_by_user.email,
                "created_at": meal_plan.created_by_user.created_at,
            },
            "created_at": meal_plan.created_at,
            "updated_at": meal_plan.updated_at,
            "permission": access.permission,
        }
        result.append(schemas.MealPlanWithAccess(**plan_dict))

    return result


@router.get("/plans/{plan_id}", response_model=schemas.MealPlanWithAccess)
async def get_meal_plan(
    plan_id: int,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> schemas.MealPlanWithAccess:
    """Get a specific meal plan (must have access)."""
    user = auth.get_user(decoded_token, db)

    # Check if user has access
    permission = utils.get_user_permission_for_plan(user.id, plan_id, db)
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this meal plan",
        )

    meal_plan = db.query(models.MealPlan).filter(models.MealPlan.id == plan_id).first()
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found",
        )

    plan_dict = {
        "id": meal_plan.id,
        "name": meal_plan.name,
        "created_by_user": {
            "id": meal_plan.created_by_user.id,
            "email": meal_plan.created_by_user.email,
            "created_at": meal_plan.created_by_user.created_at,
        },
        "created_at": meal_plan.created_at,
        "updated_at": meal_plan.updated_at,
        "permission": permission,
    }
    return schemas.MealPlanWithAccess(**plan_dict)


@router.get("/plans/{plan_id}/users", response_model=List[schemas.UserInPlan])
async def list_plan_users(
    plan_id: int,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> List[schemas.UserInPlan]:
    """List users who have access to a specific meal plan, with their permissions."""
    user = auth.get_user(decoded_token, db)

    # Ensure requester has at least view access
    if not utils.can_view_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this meal plan",
        )

    accesses = (
        db.query(models.UserMealPlanAccess, models.User)
        .join(models.User, models.UserMealPlanAccess.user_id == models.User.id)
        .filter(models.UserMealPlanAccess.meal_plan_id == plan_id)
        .all()
    )

    users: List[schemas.UserInPlan] = []
    for access, u in accesses:
        users.append(
            schemas.UserInPlan(
                id=u.id,
                email=u.email,
                permission=access.permission,
            )
        )

    return users


# ============================================================================
# MEAL PLAN SHARING ENDPOINTS
# ============================================================================


@router.post("/plans/join", response_model=Dict[str, str])
async def join_meal_plan(
    share_code: str,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """Join a meal plan using a share code or one-time invite token."""
    user = auth.get_user(decoded_token, db)

    share = db.query(models.MealPlanShare).filter(models.MealPlanShare.share_code == share_code).first()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share code not found",
        )

    # If one-time invite has already been consumed, block reuse
    if share.is_one_time and share.consumed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invite link has already been used",
        )

    # Check if already has access
    existing_access = (
        db.query(models.UserMealPlanAccess)
        .filter(
            models.UserMealPlanAccess.user_id == user.id,
            models.UserMealPlanAccess.meal_plan_id == share.meal_plan_id,
        )
        .first()
    )

    if existing_access:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have access to this meal plan",
        )

    # Add access
    access = models.UserMealPlanAccess(
        user_id=user.id,
        meal_plan_id=share.meal_plan_id,
        permission=share.permission,
    )
    db.add(access)

    # Mark one-time invite as consumed
    if share.is_one_time:
        share.consumed_at = datetime.utcnow()
        db.add(share)

    db.commit()

    return {
        "message": f"Successfully joined meal plan '{share.meal_plan.name}'",
        "plan_id": str(share.meal_plan_id),
    }


@router.get("/plans/{plan_id}/shares", response_model=List[schemas.MealPlanShare])
async def list_share_codes(
    plan_id: int,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> List[schemas.MealPlanShare]:
    """List all share codes and invites for a meal plan.

    Only owner or editors can view share codes.
    """
    user = auth.get_user(decoded_token, db)

    if not utils.can_edit_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plan owners or editors can view share codes",
        )

    shares = db.query(models.MealPlanShare).filter(models.MealPlanShare.meal_plan_id == plan_id).all()

    return [schemas.MealPlanShare.model_validate(s) for s in shares]


@router.post("/plans/{plan_id}/invite", response_model=Dict[str, str])
async def create_one_time_invite(
    plan_id: int,
    permission: str = "edit",  # "view" or "edit"
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """Create an invite link for a meal plan.

    View permission creates a reusable link (only one can exist per plan).
    Edit permission creates a one-time link (multiple can exist).

    Requires edit permission on the plan. Returns a token to be embedded in a URL.
    """
    user = auth.get_user(decoded_token, db)

    if not utils.can_edit_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plan owners or editors can create invites",
        )

    # Validate permission parameter
    if permission not in ("view", "edit"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission must be 'view' or 'edit'",
        )

    # For view permission, check if a reusable view link already exists
    if permission == "view":
        existing_view = (
            db.query(models.MealPlanShare)
            .filter(
                models.MealPlanShare.meal_plan_id == plan_id,
                models.MealPlanShare.permission == models.Permission.VIEW,
                models.MealPlanShare.is_one_time.is_(False),
            )
            .first()
        )
        if existing_view:
            return {"invite_token": existing_view.share_code}

    # Generate unique token
    while True:
        token = utils.generate_token(32)
        exists = db.query(models.MealPlanShare).filter(models.MealPlanShare.share_code == token).first()
        if not exists:
            break

    invite = models.MealPlanShare(
        meal_plan_id=plan_id,
        share_code=token,
        permission=models.Permission(permission),
        is_one_time=(permission == "edit"),  # View = reusable, Edit = one-time
        created_by_user_id=user.id,
    )
    db.add(invite)
    db.commit()

    return {"invite_token": token}


@router.delete("/plans/{plan_id}/shares/{share_code_id}")
def delete_share_code(
    plan_id: int,
    share_code_id: int,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> Dict[str, bool]:
    """Delete a share code or invite.

    Only owner or editors can delete share codes.
    """
    user = auth.get_user(decoded_token, db)

    if not utils.can_edit_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only plan owners or editors can delete share codes",
        )

    share = (
        db.query(models.MealPlanShare)
        .filter(
            models.MealPlanShare.id == share_code_id,
            models.MealPlanShare.meal_plan_id == plan_id,
        )
        .first()
    )

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share code not found",
        )

    db.delete(share)
    db.commit()
    return {"ok": True}


@router.delete("/plans/{plan_id}/leave")
def leave_meal_plan(
    plan_id: int,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """Leave a meal plan by removing the user's access entry.

    If the user does not have access, returns 404.
    """
    user = auth.get_user(decoded_token, db)

    access = (
        db.query(models.UserMealPlanAccess)
        .filter(
            models.UserMealPlanAccess.user_id == user.id,
            models.UserMealPlanAccess.meal_plan_id == plan_id,
        )
        .first()
    )
    if not access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You do not have access to this meal plan",
        )

    # Prevent owners from leaving to avoid orphaned plans
    if access.permission == models.Permission.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("Plan owners cannot leave the plan. Please transfer ownership " "or delete the plan instead."),
        )

    db.delete(access)
    db.commit()
    return {"message": "Left meal plan", "plan_id": str(plan_id)}
