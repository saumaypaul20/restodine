from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid
import secrets
from app.db.base import Base


def generate_public_token() -> str:
    """Generate a cryptographically secure random public token for table QR codes."""
    return secrets.token_urlsafe(8)


class Table(Base):
    """Restaurant table entity."""

    __tablename__ = "tables"
    __table_args__ = (
        Index("idx_table_restaurant_id", "restaurant_id"),
        Index("idx_table_public_token", "public_token", unique=True),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    restaurant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    branch_id = Column(
        UUID(as_uuid=True),
        ForeignKey("branches.id", ondelete="SET NULL"),
        nullable=True,
    )
    name = Column(String(100), nullable=False)  # e.g., "Table 04"
    section = Column(String(100), nullable=True)  # e.g., "Floor 1", "Rooftop Terrace"
    public_token = Column(String(50), unique=True, nullable=False, default=generate_public_token, index=True)
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
        return f"<Table {self.name}>"
