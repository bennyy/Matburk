from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class RecipeDB(Base):
    __tablename__ = "recipes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    link = Column(String, nullable=True)
    image_filename = Column(String, nullable=True)
    image_url = Column(String, nullable=True)  # <--- NY KOLUMN
    is_placeholder = Column(Boolean, default=False) # <--- NY KOLUMN
    default_portions = Column(Integer, default=4)
    tags = Column(String, default="")          # Fanns redan, men bra att dubbelkolla
    notes = Column(String, nullable=True)      # <--- NY KOLUMN
    is_test_recipe = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    last_cooked_date = Column(Date, nullable=True)
    vote_count = Column(Integer, default=0)

class PlanSlotDB(Base):
    __tablename__ = "plan_slots"
    id = Column(Integer, primary_key=True, index=True)
    plan_date = Column(Date, index=True)
    meal_type = Column(String) # "LUNCH", "DINNER"
    person = Column(String)    # "A", "B"
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)

    recipe = relationship("RecipeDB")

class SettingDB(Base):
    __tablename__ = "settings"
    key = Column(String, primary_key=True, index=True) # T.ex. "name_A"
    value = Column(String)                             # T.ex. "Benny"