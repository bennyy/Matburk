from typing import Optional
from pydantic import BaseModel
from datetime import date

class RecipeBase(BaseModel):
    name: str
    link: Optional[str] = None
    image_url: Optional[str] = None  # <--- NYTT FÄLT
    is_placeholder: bool = False # <--- NYTT
    default_portions: int = 4
    tags: str = ""
    notes: Optional[str] = None  # <--- NYTT FÄLT
    is_test_recipe: bool = False

class RecipeCreate(RecipeBase):
    pass

class Recipe(RecipeBase):
    id: int
    image_filename: Optional[str] = None
    last_cooked_date: Optional[date] = None
    vote_count: int

    class Config:
        from_attributes = True

class PlanSlotUpdate(BaseModel):
    plan_date: date
    meal_type: str
    person: str
    recipe_id: Optional[int]

class SettingsUpdate(BaseModel):
    name_A: str
    name_B: str