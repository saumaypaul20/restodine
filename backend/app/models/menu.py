from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Integer, Float, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid
from app.db.base import Base


class MenuCategory(Base):
    """Menu category entity."""

    __tablename__ = "menu_categories"
    __table_args__ = (
        Index("idx_category_restaurant_id", "restaurant_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    restaurant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self):
        return f"<MenuCategory {self.name}>"


class MenuItem(Base):
    """Menu item entity."""

    __tablename__ = "menu_items"
    __table_args__ = (
        Index("idx_item_restaurant_id", "restaurant_id"),
        Index("idx_item_category_id", "category_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    restaurant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("menu_categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    is_available = Column(Boolean, default=True, index=True)
    is_vegetarian = Column(Boolean, default=False, index=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self):
        return f"<MenuItem {self.name}>"
