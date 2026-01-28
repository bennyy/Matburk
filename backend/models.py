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


class MealTypeModel(Base):
    """Meal type (standard or extra) available for meal planning."""

    __tablename__ = "meal_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    is_standard: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    plan_slots: Mapped[List["PlanSlotDB"]] = relationship("PlanSlotDB", back_populates="meal_type")


# Enums
class Person(str, Enum):
    """Enum for person identifiers."""

    A = "A"
    B = "B"


class Permission(str, Enum):
    """Enum for access permissions."""

    OWNER = "owner"
    EDIT = "edit"
    VIEW = "view"


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
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    """Recipe tag for categorization."""

    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)

    # Relationship
    recipes: Mapped[List["RecipeDB"]] = relationship("RecipeDB", secondary=recipe_tags, back_populates="tags")


class User(Base):
    """User account model linked to Firebase Auth."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    firebase_uid: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)

    # Audit columns
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    meal_plans: Mapped[List["MealPlan"]] = relationship(
        "MealPlan",
        back_populates="created_by_user",
        foreign_keys="MealPlan.created_by_user_id",
    )
    meal_plan_accesses: Mapped[List["UserMealPlanAccess"]] = relationship("UserMealPlanAccess", back_populates="user")
    shared_codes: Mapped[List["MealPlanShare"]] = relationship("MealPlanShare", back_populates="created_by_user")


class MealPlan(Base):
    """Meal plan (receptbok) that belongs to a user."""

    __tablename__ = "meal_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Audit columns
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    created_by_user: Mapped[User] = relationship("User", back_populates="meal_plans", foreign_keys=[created_by_user_id])
    user_accesses: Mapped[List["UserMealPlanAccess"]] = relationship(
        "UserMealPlanAccess", back_populates="meal_plan", cascade="all, delete-orphan"
    )
    share_codes: Mapped[List["MealPlanShare"]] = relationship(
        "MealPlanShare", back_populates="meal_plan", cascade="all, delete-orphan"
    )
    recipes: Mapped[List["RecipeDB"]] = relationship("RecipeDB", back_populates="meal_plan")
    plan_slots: Mapped[List["PlanSlotDB"]] = relationship(
        "PlanSlotDB", back_populates="meal_plan", cascade="all, delete-orphan"
    )
    settings: Mapped[List["MealPlanSetting"]] = relationship(
        "MealPlanSetting", back_populates="meal_plan", cascade="all, delete-orphan"
    )


class UserMealPlanAccess(Base):
    """User access to a meal plan (with permission level)."""

    __tablename__ = "user_meal_plan_access"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    meal_plan_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("meal_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    permission: Mapped[Permission] = mapped_column(SQLEnum(Permission), nullable=False, default=Permission.VIEW)

    # Audit columns
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Unique constraint to prevent duplicate access
    __table_args__ = (UniqueConstraint("user_id", "meal_plan_id", name="uq_user_plan"),)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="meal_plan_accesses")
    meal_plan: Mapped[MealPlan] = relationship("MealPlan", back_populates="user_accesses")


class MealPlanShare(Base):
    """Shareable code or invite link for joining a meal plan.

    Supports one-time invites via `is_one_time` and `consumed_at`.
    """

    __tablename__ = "meal_plan_shares"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meal_plan_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("meal_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    share_code: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    permission: Mapped[Permission] = mapped_column(SQLEnum(Permission), nullable=False, default=Permission.VIEW)
    is_one_time: Mapped[bool] = mapped_column(Boolean, default=False)
    consumed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Audit columns
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    meal_plan: Mapped[MealPlan] = relationship("MealPlan", back_populates="share_codes")
    created_by_user: Mapped[Optional[User]] = relationship("User", back_populates="shared_codes")


class RecipeDB(Base):
    """Recipe database model."""

    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meal_plan_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("meal_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
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
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    meal_plan: Mapped[MealPlan] = relationship("MealPlan", back_populates="recipes")
    tags: Mapped[List["Tag"]] = relationship("Tag", secondary=recipe_tags, back_populates="recipes")


class PlanSlotDB(Base):
    """Meal plan slot database model."""

    __tablename__ = "plan_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meal_plan_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("meal_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    meal_type_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("meal_types.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    extra_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    person: Mapped[Person] = mapped_column(SQLEnum(Person), nullable=False)
    recipe_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True
    )

    # Audit columns
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Unique constraint to prevent duplicate meal slots (per plan)
    __table_args__ = (
        UniqueConstraint(
            "meal_plan_id",
            "plan_date",
            "meal_type_id",
            "extra_id",
            "person",
            name="uq_plan_slot_per_plan",
        ),
    )

    # Relationships
    meal_plan: Mapped[MealPlan] = relationship("MealPlan", back_populates="plan_slots")
    meal_type: Mapped["MealTypeModel"] = relationship("MealTypeModel", back_populates="plan_slots")
    recipe: Mapped[Optional["RecipeDB"]] = relationship("RecipeDB")


class MealPlanSetting(Base):
    """Meal plan settings database model."""

    __tablename__ = "meal_plan_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meal_plan_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("meal_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    key: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[str] = mapped_column(String, nullable=False)

    # Unique constraint per meal plan
    __table_args__ = (UniqueConstraint("meal_plan_id", "key", name="uq_meal_plan_setting"),)

    # Relationships
    meal_plan: Mapped[MealPlan] = relationship("MealPlan", back_populates="settings")
