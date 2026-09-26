from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MenuCategoryResponse(BaseModel):
    """Menu category response schema."""
    id: str
    restaurant_id: str
    name: str
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MenuCategoryCreate(BaseModel):
    """Menu category creation schema."""
    name: str = Field(..., min_length=1, max_length=255)
    sort_order: int = 0


class MenuItemResponse(BaseModel):
    """Menu item response schema."""
    id: str
    restaurant_id: str
    category_id: str
    name: str
    description: Optional[str] = None
    price: float
    is_available: bool
    is_vegetarian: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MenuItemCreate(BaseModel):
    """Menu item creation schema."""
    category_id: str
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    is_vegetarian: bool = False
    sort_order: int = 0


class MenuItemUpdate(BaseModel):
    """Menu item update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None
    is_vegetarian: Optional[bool] = None
    sort_order: Optional[int] = None
