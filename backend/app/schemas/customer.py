from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CustomerSessionResponse(BaseModel):
    """Customer session response schema."""
    id: str
    restaurant_id: str
    branch_id: Optional[str] = None
    table_id: str
    session_token: str
    created_at: datetime
    expires_at: datetime
    is_active: bool

    class Config:
        from_attributes = True
