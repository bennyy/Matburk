"""Recipe and meal plan slot endpoints for Matplanerare API."""

from typing import Dict, List
from datetime import date
from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

import auth
import models
import schemas
import utils
from database import get_db

router = APIRouter(prefix="/api", tags=["recipes_and_plan"])

# Configuration constants
DEFAULT_PORTIONS = 4
DEFAULT_PERSON_A = "Person A"
DEFAULT_PERSON_B = "Person B"

# ============================================================================
# MEAL TYPES CONFIGURATION
# Standard meals (LUNCH, DINNER) are created during initialization.
# Extra presets (Snack, Mellanmål, etc.) are optional meal types users can add.
# ============================================================================
STANDARD_MEAL_TYPES = ["LUNCH", "DINNER"]
EXTRA_MEAL_TYPES = [
    {"id": "snack", "name": "Snack"},
    {"id": "mellanmål", "name": "Mellanmål"},
    {"id": "tillbehör", "name": "Tillbehör"},
    {"id": "övrigt", "name": "Övrigt"},
]

# Placeholder recipes configuration
PLACEHOLDER_RECIPES = [
    {"name": "🥡 Takeaway", "tags": "Snabbval"},
    {"name": "🍽️ Äter ute", "tags": "Snabbval"},
    {"name": "🥪 Fixar eget", "tags": "Snabbval"},
    {"name": "🍕 Rester", "tags": "Snabbval"},
]

# Test recipes for initial seeding
TEST_RECIPES = [
    {"name": "Spaghetti Bolognese", "tags": "Italienskt, Pasta"},
    {"name": "Kyckling Curry", "tags": "Asiatiskt, Kryddigt"},
    {"name": "Vegetarisk Lasagne", "tags": "Italienskt, Vegetariskt"},
    {"name": "Tacos", "tags": "Mexikanskt, Snabbt"},
    {"name": "Lax med Citron och Dill", "tags": "Fisk, Hälsosamt"},
    {"name": "Grillad Ostsmörgås", "tags": "Snabbt, Vegetariskt"},
    {"name": "Caesarsallad", "tags": "Sallad, Lätt"},
    {"name": "Chili con Carne", "tags": "Kryddigt, Gryta"},
    {"name": "Pannkakor", "tags": "Sött, Frukost"},
    {"name": "Sushi Bowl", "tags": "Japanskt, Hälsosamt"},
]


def _get_meal_types(meal_plan_id: int, db: Session):
    """Get meal types (standard and extra) for a plan."""
    meal_types = db.query(models.MealTypeModel).all()
    return meal_types


def _get_or_create_meal_type(name: str, is_standard: bool, db: Session) -> models.MealTypeModel:
    """Get or create a meal type."""
    meal_type = db.query(models.MealTypeModel).filter(models.MealTypeModel.name == name).first()
    if not meal_type:
        meal_type = models.MealTypeModel(name=name, is_standard=is_standard)
        db.add(meal_type)
        db.commit()
        db.refresh(meal_type)
    return meal_type


def _initialize_meal_types_for_plan(db: Session) -> None:
    """Initialize standard meal types in database (global, not per-plan)."""
    for meal_type_name in STANDARD_MEAL_TYPES:
        _get_or_create_meal_type(meal_type_name, is_standard=True, db=db)

    for meal_type_data in EXTRA_MEAL_TYPES:
        _get_or_create_meal_type(meal_type_data["name"], is_standard=False, db=db)


def _seed_placeholder_recipes_for_plan(meal_plan_id: int, db: Session) -> None:
    """Seed only placeholder recipes for a meal plan."""
    for recipe_data in PLACEHOLDER_RECIPES:
        exists = (
            db.query(models.RecipeDB)
            .filter(
                models.RecipeDB.meal_plan_id == meal_plan_id,
                models.RecipeDB.name == recipe_data["name"],
            )
            .first()
        )

        if not exists:
            # Parse and create tags
            tag_names = [t.strip().lower() for t in recipe_data["tags"].split(",")]
            tags = []
            for tag_name in tag_names:
                tag = db.query(models.Tag).filter(func.lower(models.Tag.name) == tag_name).first()
                if not tag:
                    tag = models.Tag(name=tag_name)
                    db.add(tag)
                    db.flush()
                tags.append(tag)

            db.add(
                models.RecipeDB(
                    meal_plan_id=meal_plan_id,
                    name=recipe_data["name"],
                    default_portions=1,
                    is_placeholder=True,
                    tags=tags,
                )
            )

    db.commit()


def _seed_recipes_for_plan(meal_plan_id: int, db: Session) -> None:
    """Seed placeholder and test recipes for a meal plan."""
    for recipe_data in PLACEHOLDER_RECIPES + TEST_RECIPES:
        exists = (
            db.query(models.RecipeDB)
            .filter(
                models.RecipeDB.meal_plan_id == meal_plan_id,
                models.RecipeDB.name == recipe_data["name"],
            )
            .first()
        )

        if not exists:
            # Parse and create tags
            tag_names = [t.strip().lower() for t in recipe_data["tags"].split(",")]
            tags = []
            for tag_name in tag_names:
                tag = db.query(models.Tag).filter(func.lower(models.Tag.name) == tag_name).first()
                if not tag:
                    tag = models.Tag(name=tag_name)
                    db.add(tag)
                    db.flush()
                tags.append(tag)

            is_placeholder = recipe_data in PLACEHOLDER_RECIPES
            db.add(
                models.RecipeDB(
                    meal_plan_id=meal_plan_id,
                    name=recipe_data["name"],
                    default_portions=1 if is_placeholder else DEFAULT_PORTIONS,
                    is_placeholder=is_placeholder,
                    is_test_recipe=recipe_data in TEST_RECIPES and not is_placeholder,
                    tags=tags,
                )
            )

    db.commit()


# ============================================================================
# RECIPE ENDPOINTS
# ============================================================================


@router.get("/plans/{plan_id}/recipes", response_model=List[schemas.Recipe])
def get_recipes(
    plan_id: int,
    sort_by: str = "vote",
    sort_order: str = "desc",
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> List[schemas.Recipe]:
    """Get all recipes in a meal plan with optional sorting.

    User must have access to the plan.
    """
    user = auth.get_user(decoded_token, db)

    # Check access
    if not utils.can_view_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this meal plan",
        )

    # Calculate meal count for recipes in this plan (count only standard meals, not extras)
    standard_meal_types = db.query(models.MealTypeModel).filter(models.MealTypeModel.is_standard).all()
    standard_meal_type_ids = [mt.id for mt in standard_meal_types]

    meal_count_subquery = (
        db.query(
            models.PlanSlotDB.recipe_id,
            func.count(models.PlanSlotDB.id).label("meal_count"),
        )
        .filter(
            models.PlanSlotDB.meal_plan_id == plan_id,
            models.PlanSlotDB.meal_type_id.in_(standard_meal_type_ids),
        )
        .group_by(models.PlanSlotDB.recipe_id)
        .subquery()
    )

    query = (
        db.query(
            models.RecipeDB,
            func.coalesce(meal_count_subquery.c.meal_count, 0).label("meal_count"),
        )
        .outerjoin(meal_count_subquery, models.RecipeDB.id == meal_count_subquery.c.recipe_id)
        .filter(
            models.RecipeDB.meal_plan_id == plan_id,
            ~models.RecipeDB.is_deleted,
        )
    )

    # Determine sort column
    if sort_by == "name":
        column = func.lower(models.RecipeDB.name)
    elif sort_by == "last_cooked":
        column = models.RecipeDB.last_cooked_date
    elif sort_by == "total_meals":
        column = func.coalesce(meal_count_subquery.c.meal_count, 0)
    elif sort_by == "created":
        column = models.RecipeDB.created_at
    else:
        column = models.RecipeDB.vote_count

    # Apply primary sort order
    if sort_order == "asc":
        if sort_by == "last_cooked":
            query = query.order_by(column.asc().nullsfirst())
        else:
            query = query.order_by(column.asc())
    else:
        if sort_by == "last_cooked":
            query = query.order_by(column.desc().nullslast())
        else:
            query = query.order_by(column.desc())

    # Secondary sort by name for tie-breaking
    query = query.order_by(func.lower(models.RecipeDB.name).asc())

    results = query.all()
    recipes = []
    for row in results:
        recipe = row[0]
        recipe.meal_count = row[1]
        recipes.append(recipe)

    return recipes


@router.post("/plans/{plan_id}/recipes", response_model=schemas.Recipe)
async def create_recipe(
    plan_id: int,
    name: str = Form(...),
    link: str = Form(None),
    portions: int = Form(DEFAULT_PORTIONS),
    tags: str = Form(""),
    notes: str = Form(None),
    image_url: str = Form(None),
    is_test: bool = Form(False),
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> schemas.Recipe:
    """Create a new recipe in a meal plan.

    User must have edit permission on the plan.
    """
    user = auth.get_user(decoded_token, db)

    # Check edit permission
    if not utils.can_edit_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this meal plan",
        )

    # Verify plan exists
    meal_plan = db.query(models.MealPlan).filter(models.MealPlan.id == plan_id).first()
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found",
        )

    # Parse and create tags
    tag_objects = []
    if tags:
        tag_names = [t.strip().lower() for t in tags.split(",")]
        for tag_name in tag_names:
            if tag_name:
                tag = db.query(models.Tag).filter(func.lower(models.Tag.name) == tag_name).first()
                if not tag:
                    tag = models.Tag(name=tag_name)
                    db.add(tag)
                    db.flush()
                tag_objects.append(tag)

    db_recipe = models.RecipeDB(
        meal_plan_id=plan_id,
        name=name,
        link=link,
        default_portions=portions,
        notes=notes,
        image_url=image_url,
        is_test_recipe=is_test,
        tags=tag_objects,
    )

    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


@router.post("/plans/{plan_id}/recipes/bulk/import")
async def bulk_import_recipes(
    plan_id: int,
    csv_data: str = Form(...),
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> Dict:
    """Bulk import recipes from CSV/TSV data.

    Expected format (semicolon-separated):
    title;tags;recipe_url;image_url;portions

    - title: Required, recipe name
    - tags: Optional, comma-separated tag list
    - recipe_url: Optional, URL to recipe
    - image_url: Optional, URL to recipe image
    - portions: Optional, default portions (defaults to 4)
    - Use 'null' to skip a field

    Returns summary with created and error counts.
    """
    user = auth.get_user(decoded_token, db)

    # Check edit permission
    if not utils.can_edit_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this meal plan",
        )

    # Verify plan exists
    meal_plan = db.query(models.MealPlan).filter(models.MealPlan.id == plan_id).first()
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found",
        )

    created_count = 0
    error_count = 0
    errors = []

    # Parse CSV data
    lines = csv_data.strip().split("\n")
    for line_num, line in enumerate(lines, 1):
        if not line.strip():
            continue

        try:
            # Split by semicolon
            parts = [p.strip() for p in line.split(";")]

            # Ensure we have at least title
            if not parts or not parts[0]:
                error_count += 1
                errors.append(f"Line {line_num}: Missing title")
                continue

            title = parts[0]
            if title.lower() == "null" or not title:
                error_count += 1
                errors.append(f"Line {line_num}: Missing title")
                continue

            # Parse optional fields
            tags_str = parts[1] if len(parts) > 1 and parts[1].lower() != "null" else ""
            recipe_url = parts[2] if len(parts) > 2 and parts[2].lower() != "null" else None
            image_url = parts[3] if len(parts) > 3 and parts[3].lower() != "null" else None
            portions_str = parts[4] if len(parts) > 4 and parts[4].lower() != "null" else DEFAULT_PORTIONS

            # Parse portions
            try:
                portions = int(portions_str) if portions_str else DEFAULT_PORTIONS
                portions = max(1, portions)  # Ensure at least 1
            except (ValueError, TypeError):
                portions = DEFAULT_PORTIONS

            # Parse and create tags
            tag_objects = []
            if tags_str:
                tag_names = [t.strip().lower() for t in tags_str.split(",")]
                for tag_name in tag_names:
                    if tag_name:
                        tag = db.query(models.Tag).filter(func.lower(models.Tag.name) == tag_name).first()
                        if not tag:
                            tag = models.Tag(name=tag_name)
                            db.add(tag)
                            db.flush()
                        tag_objects.append(tag)

            # Create recipe
            db_recipe = models.RecipeDB(
                meal_plan_id=plan_id,
                name=title,
                link=recipe_url,
                default_portions=portions,
                image_url=image_url,
                tags=tag_objects,
            )

            db.add(db_recipe)
            created_count += 1

        except Exception as e:
            error_count += 1
            errors.append(f"Line {line_num}: {str(e)}")

    # Commit all changes
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error saving recipes: {str(e)}",
        )

    return {
        "created": created_count,
        "errors": error_count,
        "error_messages": errors if errors else [],
        "total": created_count + error_count,
    }


@router.put("/plans/{plan_id}/recipes/{recipe_id}", response_model=schemas.Recipe)
async def update_recipe(
    plan_id: int,
    recipe_id: int,
    name: str = Form(...),
    link: str = Form(None),
    portions: int = Form(DEFAULT_PORTIONS),
    tags: str = Form(""),
    notes: str = Form(None),
    image_url: str = Form(None),
    is_test: bool = Form(False),
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> schemas.Recipe:
    """Update a recipe in a meal plan.

    User must have edit permission on the plan.
    """
    user = auth.get_user(decoded_token, db)

    # Check edit permission
    if not utils.can_edit_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this meal plan",
        )

    db_recipe = (
        db.query(models.RecipeDB)
        .filter(
            models.RecipeDB.id == recipe_id,
            models.RecipeDB.meal_plan_id == plan_id,
        )
        .first()
    )

    if not db_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found",
        )

    # Update fields
    db_recipe.name = name
    db_recipe.link = link
    db_recipe.image_url = image_url
    db_recipe.default_portions = portions
    db_recipe.notes = notes
    db_recipe.is_test_recipe = is_test

    # Update tags
    tag_objects = []
    if tags:
        tag_names = [t.strip().lower() for t in tags.split(",")]
        for tag_name in tag_names:
            if tag_name:
                tag = db.query(models.Tag).filter(func.lower(models.Tag.name) == tag_name).first()
                if not tag:
                    tag = models.Tag(name=tag_name)
                    db.add(tag)
                    db.flush()
                tag_objects.append(tag)

    db_recipe.tags = tag_objects
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


@router.put("/plans/{plan_id}/recipes/{recipe_id}/vote")
def vote_recipe(
    plan_id: int,
    recipe_id: int,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> Dict[str, bool]:
    """Vote for a recipe in a meal plan."""
    user = auth.get_user(decoded_token, db)

    if not utils.can_view_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this meal plan",
        )

    recipe = (
        db.query(models.RecipeDB)
        .filter(
            models.RecipeDB.id == recipe_id,
            models.RecipeDB.meal_plan_id == plan_id,
        )
        .first()
    )

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found",
        )

    recipe.vote_count += 1
    db.commit()
    return {"ok": True}


@router.delete("/plans/{plan_id}/recipes/{recipe_id}")
def delete_recipe(
    plan_id: int,
    recipe_id: int,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> Dict[str, bool]:
    """Delete a recipe in a meal plan."""
    user = auth.get_user(decoded_token, db)

    if not utils.can_edit_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this meal plan",
        )

    recipe = (
        db.query(models.RecipeDB)
        .filter(
            models.RecipeDB.id == recipe_id,
            models.RecipeDB.meal_plan_id == plan_id,
        )
        .first()
    )

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found",
        )

    recipe.is_deleted = True
    db.commit()
    return {"ok": True}


# ============================================================================
# MEAL PLAN SLOT ENDPOINTS
# ============================================================================


def _update_recipe_last_cooked(recipe_id: int, meal_plan_id: int, db: Session) -> None:
    """Update a recipe's last_cooked_date based on plan slots."""
    if not recipe_id:
        return

    max_date = (
        db.query(func.max(models.PlanSlotDB.plan_date))
        .filter(
            models.PlanSlotDB.recipe_id == recipe_id,
            models.PlanSlotDB.meal_plan_id == meal_plan_id,
        )
        .scalar()
    )

    recipe = db.query(models.RecipeDB).filter(models.RecipeDB.id == recipe_id).first()
    if recipe:
        recipe.last_cooked_date = max_date
        if max_date and max_date >= date.today():
            recipe.vote_count = 0
        db.add(recipe)


@router.get("/plans/{plan_id}/plan", response_model=List[schemas.PlanSlot])
def get_plan(
    plan_id: int,
    start_date: date,
    end_date: date,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> List[schemas.PlanSlot]:
    """Get meal plan slots for a date range.

    User must have access to the plan.
    """
    user = auth.get_user(decoded_token, db)

    if not utils.can_view_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this meal plan",
        )

    return (
        db.query(models.PlanSlotDB)
        .filter(
            models.PlanSlotDB.meal_plan_id == plan_id,
            models.PlanSlotDB.plan_date >= start_date,
            models.PlanSlotDB.plan_date <= end_date,
        )
        .all()
    )  # type: ignore


@router.post("/plans/{plan_id}/plan", response_model=schemas.PlanSlot)
def update_plan_slot(
    plan_id: int,
    slot: schemas.PlanSlotUpdate,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> schemas.PlanSlot:
    """Update or create a meal plan slot.

    User must have edit permission on the plan.
    """
    user = auth.get_user(decoded_token, db)

    if not utils.can_edit_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this meal plan",
        )

    db_slot = (
        db.query(models.PlanSlotDB)
        .filter(
            models.PlanSlotDB.meal_plan_id == plan_id,
            models.PlanSlotDB.plan_date == slot.plan_date,
            models.PlanSlotDB.meal_type_id == slot.meal_type_id,
            models.PlanSlotDB.extra_id == slot.extra_id,
            models.PlanSlotDB.person == slot.person,
        )
        .first()
    )

    if not db_slot:
        db_slot = models.PlanSlotDB(
            meal_plan_id=plan_id,
            plan_date=slot.plan_date,
            meal_type_id=slot.meal_type_id,
            extra_id=slot.extra_id,
            person=slot.person,
        )
        db.add(db_slot)

    old_recipe_id = db_slot.recipe_id
    new_recipe_id = slot.recipe_id

    db_slot.recipe_id = new_recipe_id
    db.commit()

    if new_recipe_id:
        _update_recipe_last_cooked(new_recipe_id, plan_id, db)

    if old_recipe_id and old_recipe_id != new_recipe_id:
        _update_recipe_last_cooked(old_recipe_id, plan_id, db)

    db.commit()
    return db_slot


# ============================================================================
# MEAL PLAN SETTINGS ENDPOINTS
# ============================================================================


def _get_setting(meal_plan_id: int, key: str, default: str, db: Session) -> str:
    """Get a setting value with default fallback."""
    setting = (
        db.query(models.MealPlanSetting)
        .filter(
            models.MealPlanSetting.meal_plan_id == meal_plan_id,
            models.MealPlanSetting.key == key,
        )
        .first()
    )
    return setting.value if setting else default


def _update_setting(meal_plan_id: int, key: str, value: str, db: Session) -> None:
    """Update or create a setting."""
    setting = (
        db.query(models.MealPlanSetting)
        .filter(
            models.MealPlanSetting.meal_plan_id == meal_plan_id,
            models.MealPlanSetting.key == key,
        )
        .first()
    )

    if not setting:
        setting = models.MealPlanSetting(meal_plan_id=meal_plan_id, key=key)
        db.add(setting)

    setting.value = value


@router.get("/plans/{plan_id}/meal-types", response_model=List[schemas.MealType])
def get_meal_types(
    plan_id: int,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
):
    """Get meal types available for meal planning."""
    user = auth.get_user(decoded_token, db)

    if not utils.can_view_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this meal plan",
        )

    return _get_meal_types(plan_id, db)


@router.post("/plans/{plan_id}/meal-types")
def add_meal_type(
    plan_id: int,
    name: str,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> Dict[str, schemas.MealType]:
    """Add an extra meal type for a meal plan."""
    user = auth.get_user(decoded_token, db)

    if not utils.can_edit_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this meal plan",
        )

    meal_type = _get_or_create_meal_type(name, is_standard=False, db=db)
    return {"meal_type": meal_type}


@router.get("/plans/{plan_id}/settings", response_model=schemas.MealPlanSettings)
def get_settings(
    plan_id: int,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> schemas.MealPlanSettings:
    """Get settings for a meal plan."""
    user = auth.get_user(decoded_token, db)

    if not utils.can_view_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this meal plan",
        )

    # Safely parse optional user IDs, handling empty strings gracefully
    return schemas.MealPlanSettings(
        name_A=_get_setting(plan_id, "name_A", DEFAULT_PERSON_A, db),
        name_B=_get_setting(plan_id, "name_B", DEFAULT_PERSON_B, db),
    )


@router.post("/plans/{plan_id}/settings")
def update_settings(
    plan_id: int,
    settings: schemas.MealPlanSettings,
    decoded_token: Dict = Depends(auth.verify_token),
    db: Session = Depends(get_db),
) -> Dict[str, bool]:
    """Update settings for a meal plan."""
    user = auth.get_user(decoded_token, db)

    if not utils.can_edit_plan(user.id, plan_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this meal plan",
        )

    _update_setting(plan_id, "name_A", settings.name_A, db)
    _update_setting(plan_id, "name_B", settings.name_B, db)
    db.commit()
    return {"ok": True}
