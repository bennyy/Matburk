"""Pydantic schemas for API request/response validation."""

from typing import Optional, List
from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel


# Enums (must match models.py)
class MealType(str, Enum):
    """Enum for meal types."""

    LUNCH = "LUNCH"
    DINNER = "DINNER"


class Person(str, Enum):
    """Enum for person identifiers."""

    A = "A"
    B = "B"


class Tag(BaseModel):
    """Tag schema."""

    id: int
    name: str

    class Config:
        from_attributes = True


class RecipeBase(BaseModel):
    """Base recipe schema with common fields."""

    name: str
    link: Optional[str] = None
    image_url: Optional[str] = None
    is_placeholder: bool = False
    default_portions: int = 4
    notes: Optional[str] = None
    is_test_recipe: bool = False


class RecipeCreate(RecipeBase):
    """Schema for creating a new recipe."""

    tags: List[str] = []  # Tag names for input


class Recipe(BaseModel):
    """Complete recipe schema for responses."""

    id: int
    name: str
    link: Optional[str] = None
    image_url: Optional[str] = None
    is_placeholder: bool = False
    default_portions: int = 4
    notes: Optional[str] = None
    is_test_recipe: bool = False
    image_filename: Optional[str] = None
    last_cooked_date: Optional[date] = None
    vote_count: int
    meal_count: int = 0  # Number of times recipe appears in planner
    tags: List[Tag] = []  # Full Tag objects for response
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlanSlot(BaseModel):
    """Complete plan slot schema for responses."""

    id: int
    plan_date: date
    meal_type: MealType
    person: Person
    recipe_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlanSlotUpdate(BaseModel):
    """Schema for updating meal plan slots."""

    plan_date: date
    meal_type: MealType
    person: Person
    recipe_id: Optional[int] = None


class SettingsUpdate(BaseModel):
    """Schema for updating application settings."""

    name_A: str
    name_B: str
