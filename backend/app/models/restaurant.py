from sqlalchemy import Column, String, Float, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid
from app.db.base import Base


class Restaurant(Base):
    """Restaurant entity."""

    __tablename__ = "restaurants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    address = Column(String(500), nullable=True)
    tax_percent = Column(Float, default=5.0)  # e.g., 5% GST
    service_charge_percent = Column(Float, default=5.0)
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
        return f"<Restaurant {self.name} ({self.slug})>"
