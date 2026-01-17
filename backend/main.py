import os
import shutil
from datetime import datetime, date
from typing import List, Dict
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

import models
import schemas
from database import SessionLocal, engine, get_db

# Configuration constants
UPLOAD_DIR = "uploads"
DEFAULT_PORTIONS = 4
DEFAULT_PERSON_A = "Person A"
DEFAULT_PERSON_B = "Person B"

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Matplanerare API", description="Recipe planner API")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure with environment variable in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded images
app.mount("/images", StaticFiles(directory=UPLOAD_DIR), name="images")

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


def _seed_placeholder_recipes(db: Session) -> None:
    """Seed placeholder recipes if they don't exist."""
    for recipe in PLACEHOLDER_RECIPES:
        exists = (
            db.query(models.RecipeDB)
            .filter(
                models.RecipeDB.name == recipe["name"],
                models.RecipeDB.is_placeholder,
            )
            .first()
        )

        if not exists:
            # Parse and create tags
            tag_names = [t.strip().lower() for t in recipe["tags"].split(",")]
            tags = []
            for tag_name in tag_names:
                tag = (
                    db.query(models.Tag)
                    .filter(func.lower(models.Tag.name) == tag_name)
                    .first()
                )
                if not tag:
                    tag = models.Tag(name=tag_name)
                    db.add(tag)
                    db.flush()  # Ensure tag is saved before associating
                tags.append(tag)

            db.add(
                models.RecipeDB(
                    name=recipe["name"],
                    default_portions=1,
                    is_placeholder=True,
                    is_test_recipe=False,
                    tags=tags,
                )
            )


def _seed_test_recipes(db: Session) -> None:
    """Seed test recipes if they don't exist."""
    for recipe in TEST_RECIPES:
        exists = (
            db.query(models.RecipeDB)
            .filter(
                models.RecipeDB.name == recipe["name"],
                models.RecipeDB.is_test_recipe,
            )
            .first()
        )
        if not exists:
            # Parse and create tags
            tag_names = [t.strip().lower() for t in recipe["tags"].split(",")]
            tags = []
            for tag_name in tag_names:
                tag = (
                    db.query(models.Tag)
                    .filter(func.lower(models.Tag.name) == tag_name)
                    .first()
                )
                if not tag:
                    tag = models.Tag(name=tag_name)
                    db.add(tag)
                    db.flush()  # Ensure tag is saved before associating
                tags.append(tag)


def _seed_default_settings(db: Session) -> None:
    """Seed default settings if they don't exist."""
    for key, value in [("name_A", DEFAULT_PERSON_A), ("name_B", DEFAULT_PERSON_B)]:
        if not db.query(models.SettingDB).filter(models.SettingDB.key == key).first():
            db.add(models.SettingDB(key=key, value=value))


@app.on_event("startup")
def seed_database() -> None:
    """Initialize database with placeholder recipes, test recipes, and default settings."""
    db = SessionLocal()
    try:
        _seed_placeholder_recipes(db)
        print("✅ Placeholder recipes checked/created.")

        _seed_test_recipes(db)
        print("✅ Test recipes checked/created.")

        _seed_default_settings(db)
        print("✅ Default settings checked/created.")

        db.commit()
    finally:
        db.close()


@app.get("/recipes", response_model=List[schemas.Recipe])
def get_recipes(
    sort_by: str = "vote",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
) -> List[schemas.Recipe]:
    """Get all non-deleted recipes with optional sorting.

    Args:
        sort_by: Sort field ('name', 'vote', 'last_cooked', 'total_meals', or 'created')
        sort_order: Sort direction ('asc' or 'desc')
        db: Database session

    Returns:
        List of recipes
    """
    # Always calculate meal count for all recipes
    meal_count_subquery = (
        db.query(
            models.PlanSlotDB.recipe_id,
            func.count(models.PlanSlotDB.id).label("meal_count"),
        )
        .filter(
            models.PlanSlotDB.meal_type.in_(
                [models.MealType.LUNCH, models.MealType.DINNER]
            )
        )
        .group_by(models.PlanSlotDB.recipe_id)
        .subquery()
    )

    query = (
        db.query(
            models.RecipeDB,
            func.coalesce(meal_count_subquery.c.meal_count, 0).label("meal_count"),
        )
        .outerjoin(
            meal_count_subquery, models.RecipeDB.id == meal_count_subquery.c.recipe_id
        )
        .filter(~models.RecipeDB.is_deleted)
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

    # Secondary sort by name (case-insensitive) for tie-breaking
    query = query.order_by(func.lower(models.RecipeDB.name).asc())

    # Convert results to include meal_count
    results = query.all()
    recipes = []
    for row in results:
        recipe = row[0]
        recipe.meal_count = row[1]
        recipes.append(recipe)

    return recipes


@app.post("/recipes", response_model=schemas.Recipe)
async def create_recipe(
    name: str = Form(...),
    link: str = Form(None),
    portions: int = Form(DEFAULT_PORTIONS),
    tags: str = Form(""),
    notes: str = Form(None),
    image_url: str = Form(None),
    is_test: bool = Form(False),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
) -> schemas.Recipe:
    """Create a new recipe.

    Args:
        name: Recipe name
        link: Optional URL reference
        portions: Default number of portions
        tags: Comma-separated tag names
        notes: Optional notes
        image_url: Optional image URL
        is_test: Whether this is a test recipe
        file: Optional image file upload
        db: Database session

    Returns:
        Created recipe
    """
    filename = None
    if file:
        timestamp = int(datetime.now().timestamp())
        filename = f"{timestamp}_{file.filename}"
        file_location = f"{UPLOAD_DIR}/{filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)

    # Parse and create tags
    tag_objects = []
    if tags:
        tag_names = [t.strip().lower() for t in tags.split(",")]
        for tag_name in tag_names:
            if tag_name:  # Skip empty strings
                tag = (
                    db.query(models.Tag)
                    .filter(func.lower(models.Tag.name) == tag_name)
                    .first()
                )
                if not tag:
                    tag = models.Tag(name=tag_name)
                    db.add(tag)
                    db.flush()
                tag_objects.append(tag)

    db_recipe = models.RecipeDB(
        name=name,
        link=link,
        default_portions=portions,
        notes=notes,
        image_url=image_url,
        is_test_recipe=is_test,
        image_filename=filename,
        tags=tag_objects,
    )

    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


@app.put("/recipes/{recipe_id}", response_model=schemas.Recipe)
async def update_recipe(
    recipe_id: int,
    name: str = Form(...),
    link: str = Form(None),
    portions: int = Form(DEFAULT_PORTIONS),
    tags: str = Form(""),
    notes: str = Form(None),
    image_url: str = Form(None),
    is_test: bool = Form(False),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
) -> schemas.Recipe:
    """Update an existing recipe.

    Args:
        recipe_id: ID of recipe to update
        name: Recipe name
        link: Optional URL reference
        portions: Default number of portions
        tags: Comma-separated tags
        notes: Optional notes
        image_url: Optional image URL
        is_test: Whether this is a test recipe
        file: Optional new image file
        db: Database session

    Returns:
        Updated recipe

    Raises:
        HTTPException: If recipe not found
    """
    db_recipe: models.RecipeDB = (
        db.query(models.RecipeDB).filter(models.RecipeDB.id == recipe_id).first()
    )
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Handle image upload
    if file:
        timestamp = int(datetime.now().timestamp())
        filename = f"{timestamp}_{file.filename}"
        file_location = f"{UPLOAD_DIR}/{filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        db_recipe.image_filename = filename

    # Update recipe fields
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
            if tag_name:  # Skip empty strings
                tag = (
                    db.query(models.Tag)
                    .filter(func.lower(models.Tag.name) == tag_name)
                    .first()
                )
                if not tag:
                    tag = models.Tag(name=tag_name)
                    db.add(tag)
                    db.flush()
                tag_objects.append(tag)

    db_recipe.tags = tag_objects

    db.commit()
    db.refresh(db_recipe)
    return db_recipe


@app.put("/recipes/{recipe_id}/vote")
def vote_recipe(recipe_id: int, db: Session = Depends(get_db)) -> Dict[str, bool]:
    """Increment vote count for a recipe.

    Args:
        recipe_id: ID of recipe to vote for
        db: Database session

    Returns:
        Status dictionary

    Raises:
        HTTPException: If recipe not found
    """
    recipe = db.query(models.RecipeDB).filter(models.RecipeDB.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    recipe.vote_count += 1
    db.commit()
    return {"ok": True}


@app.get("/plan")
def get_plan(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
):
    """Get meal plan slots for a date range.

    Args:
        start_date: Start date (inclusive)
        end_date: End date (inclusive)
        db: Database session

    Returns:
        List of plan slots
    """
    return (
        db.query(models.PlanSlotDB)
        .filter(
            models.PlanSlotDB.plan_date >= start_date,
            models.PlanSlotDB.plan_date <= end_date,
        )
        .all()
    )


def _update_recipe_last_cooked(recipe_id: int, db: Session) -> None:
    """Update a recipe's last_cooked_date based on plan slots.

    Args:
        recipe_id: Recipe ID to update
        db: Database session
    """
    if not recipe_id:
        return

    # Find the most recent date this recipe appears in plan
    max_date = (
        db.query(func.max(models.PlanSlotDB.plan_date))
        .filter(models.PlanSlotDB.recipe_id == recipe_id)
        .scalar()
    )

    recipe = db.query(models.RecipeDB).filter(models.RecipeDB.id == recipe_id).first()
    if recipe:
        recipe.last_cooked_date = max_date
        # Reset votes if recipe is scheduled for future date to encourage trying new recipes
        if max_date and max_date >= date.today():
            recipe.vote_count = 0
        db.add(recipe)


@app.post("/plan")
def update_plan_slot(
    slot: schemas.PlanSlotUpdate,
    db: Session = Depends(get_db),
) -> schemas.PlanSlot:
    """Update or create a meal plan slot.

    Args:
        slot: Plan slot data
        db: Database session

    Returns:
        Updated plan slot
    """
    # Find or create the slot (NOTE: relies on db logic, should have unique constraint in DB)
    db_slot = (
        db.query(models.PlanSlotDB)
        .filter(
            models.PlanSlotDB.plan_date == slot.plan_date,
            models.PlanSlotDB.meal_type == slot.meal_type,
            models.PlanSlotDB.person == slot.person,
        )
        .first()
    )

    if not db_slot:
        db_slot = models.PlanSlotDB(
            plan_date=slot.plan_date,
            meal_type=slot.meal_type,
            person=slot.person,
        )
        db.add(db_slot)

    # Track old and new recipe IDs for updating last_cooked calculations
    old_recipe_id = db_slot.recipe_id
    new_recipe_id = slot.recipe_id

    # Update the slot
    db_slot.recipe_id = new_recipe_id
    db.commit()  # Commit to ensure subsequent queries find updated data

    # Update last_cooked dates for affected recipes
    if new_recipe_id:
        _update_recipe_last_cooked(new_recipe_id, db)

    if old_recipe_id and old_recipe_id != new_recipe_id:
        _update_recipe_last_cooked(old_recipe_id, db)

    db.commit()
    return db_slot


@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)) -> Dict[str, bool]:
    """Soft delete a recipe (mark as deleted).

    Args:
        recipe_id: ID of recipe to delete
        db: Database session

    Returns:
        Status dictionary

    Raises:
        HTTPException: If recipe not found
    """
    recipe = db.query(models.RecipeDB).filter(models.RecipeDB.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    recipe.is_deleted = True
    db.commit()
    return {"ok": True}


# --- SETTINGS ENDPOINTS ---


def _get_setting(key: str, default: str, db: Session) -> str:
    """Helper to get a setting value with default fallback.

    Args:
        key: Setting key
        default: Default value if not found
        db: Database session

    Returns:
        Setting value or default
    """
    setting = db.query(models.SettingDB).filter(models.SettingDB.key == key).first()
    return setting.value if setting else default


@app.get("/settings")
def get_settings(db: Session = Depends(get_db)) -> Dict[str, str]:
    """Get all settings.

    Args:
        db: Database session

    Returns:
        Dictionary of settings
    """
    return {
        "name_A": _get_setting("name_A", DEFAULT_PERSON_A, db),
        "name_B": _get_setting("name_B", DEFAULT_PERSON_B, db),
    }


def _update_setting(key: str, value: str, db: Session) -> models.SettingDB:
    """Helper to update or create a setting.

    Args:
        key: Setting key
        value: New value
        db: Database session

    Returns:
        Updated setting
    """
    setting = db.query(models.SettingDB).filter(models.SettingDB.key == key).first()
    if not setting:
        setting = models.SettingDB(key=key)
        db.add(setting)
    setting.value = value
    return setting


@app.post("/settings")
def update_settings(
    settings: schemas.SettingsUpdate,
    db: Session = Depends(get_db),
) -> Dict[str, bool]:
    """Update settings.

    Args:
        settings: Settings to update
        db: Database session

    Returns:
        Status dictionary
    """
    _update_setting("name_A", settings.name_A, db)
    _update_setting("name_B", settings.name_B, db)
    db.commit()
    return {"ok": True}
