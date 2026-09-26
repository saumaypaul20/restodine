from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RestaurantResponse(BaseModel):
    """Restaurant response schema."""
    id: str
    name: str
    slug: str
    address: Optional[str] = None
    tax_percent: float
    service_charge_percent: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RestaurantUpdate(BaseModel):
    """Restaurant update schema."""
    name: Optional[str] = None
    address: Optional[str] = None
    tax_percent: Optional[float] = None
    service_charge_percent: Optional[float] = None
    is_active: Optional[bool] = None
