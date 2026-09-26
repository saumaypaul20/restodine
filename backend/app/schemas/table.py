from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TableResponse(BaseModel):
    """Table response schema."""
    id: str
    restaurant_id: str
    branch_id: Optional[str] = None
    name: str
    section: Optional[str] = None
    public_token: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TableCreate(BaseModel):
    """Table creation schema."""
    name: str = Field(..., min_length=1, max_length=100)
    section: Optional[str] = None
    branch_id: Optional[str] = None


class TableUpdate(BaseModel):
    """Table update schema."""
    name: Optional[str] = None
    section: Optional[str] = None
    is_active: Optional[bool] = None
