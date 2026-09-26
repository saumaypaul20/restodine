from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid
from app.db.base import Base


class User(Base):
    """User entity with role-based access control."""

    __tablename__ = "users"
    __table_args__ = (
        Index("idx_user_email_restaurant", "email", "restaurant_id", unique=True),
        Index("idx_user_restaurant_id", "restaurant_id"),
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
    email = Column(String(255), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="WAITER")  # OWNER, MANAGER, WAITER, KITCHEN
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
        return f"<User {self.email} ({self.role})>"
