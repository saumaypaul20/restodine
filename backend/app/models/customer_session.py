from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone, timedelta
import uuid
import secrets
from app.db.base import Base


def generate_session_token() -> str:
    """Generate a cryptographically secure random session token."""
    return secrets.token_urlsafe(32)


class CustomerSession(Base):
    """Customer temporary session for table ordering."""

    __tablename__ = "customer_sessions"
    __table_args__ = (
        Index("idx_session_restaurant_id", "restaurant_id"),
        Index("idx_session_table_id", "table_id"),
        Index("idx_session_token", "session_token", unique=True),
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
    table_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tables.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_token = Column(String(100), unique=True, nullable=False, default=generate_session_token, index=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    expires_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(hours=6),
        nullable=False,
        index=True,
    )
    is_active = Column(Boolean, default=True, index=True)

    def __repr__(self):
        return f"<CustomerSession {self.session_token}>"
