"""SQLAlchemy ORM models for Matplanerare database."""

from datetime import datetime, date
from enum import Enum
from typing import List, Optional
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Table,
    Enum as SQLEnum,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from database import Base


# Enums
class MealType(str, Enum):
    """Enum for meal types."""

    LUNCH = "LUNCH"
    DINNER = "DINNER"


class Person(str, Enum):
    """Enum for person identifiers."""

    A = "A"
    B = "B"


# Association table for recipe-tag many-to-many relationship
recipe_tags = Table(
    "recipe_tags",
    Base.metadata,
    Column(
        "recipe_id",
        Integer,
        ForeignKey("recipes.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    ),
)


class Tag(Base):
    """Recipe tag for categorization."""

    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)

    # Relationship
    recipes: Mapped[List["RecipeDB"]] = relationship(
        "RecipeDB", secondary=recipe_tags, back_populates="tags"
    )


class RecipeDB(Base):
    """Recipe database model."""

    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    link: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    image_filename: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_placeholder: Mapped[bool] = mapped_column(Boolean, default=False)
    default_portions: Mapped[int] = mapped_column(Integer, default=4)
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_test_recipe: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    last_cooked_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    vote_count: Mapped[int] = mapped_column(Integer, default=0)

    # Audit columns
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    tags: Mapped[List["Tag"]] = relationship(
        "Tag", secondary=recipe_tags, back_populates="recipes"
    )


class PlanSlotDB(Base):
    """Meal plan slot database model."""

    __tablename__ = "plan_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    plan_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    meal_type: Mapped[MealType] = mapped_column(SQLEnum(MealType), nullable=False)
    person: Mapped[Person] = mapped_column(SQLEnum(Person), nullable=False)
    recipe_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=True
    )

    # Audit columns
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Unique constraint to prevent duplicate meal slots
    __table_args__ = (
        UniqueConstraint("plan_date", "meal_type", "person", name="uq_plan_slot"),
    )

    recipe: Mapped[RecipeDB] = relationship("RecipeDB")


class SettingDB(Base):
    """Application settings database model."""

    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    value: Mapped[str] = mapped_column(String, nullable=False)
