"""Pydantic schemas for API request/response validation."""

from typing import Optional, List
from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel


# Enums (must match models.py)
class Person(str, Enum):
    """Enum for person identifiers."""

    A = "A"
    B = "B"


class Permission(str, Enum):
    """Enum for access permissions."""

    OWNER = "owner"
    EDIT = "edit"
    VIEW = "view"


class Tag(BaseModel):
    """Tag schema."""

    id: int
    name: str

    class Config:
        from_attributes = True


class MealType(BaseModel):
    """Meal type schema."""

    id: int
    name: str
    is_standard: bool

    class Config:
        from_attributes = True


class User(BaseModel):
    """User schema."""

    id: int
    email: str
    created_at: datetime

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
    meal_type_id: int
    extra_id: Optional[str] = None
    person: Person
    recipe_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlanSlotUpdate(BaseModel):
    """Schema for updating meal plan slots."""

    plan_date: date
    meal_type_id: int
    extra_id: Optional[str] = None
    person: Person
    recipe_id: Optional[int] = None


class MealPlan(BaseModel):
    """Meal plan schema."""

    id: int
    name: str
    created_by_user: User
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MealPlanWithAccess(MealPlan):
    """Meal plan with user's permission level."""

    permission: Permission


class MealPlanShare(BaseModel):
    """Shareable code schema."""

    id: int
    share_code: str
    permission: Permission
    is_one_time: bool
    consumed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MealPlanSettings(BaseModel):
    """Schema for meal plan settings."""

    name_A: str
    name_B: str


class UserInPlan(BaseModel):
    """Schema representing a user who has access to a meal plan."""

    id: int
    email: str
    permission: Permission

    class Config:
        from_attributes = True
