from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str = Field(..., min_length=1)


class RegisterRequest(BaseModel):
    """Restaurant registration request schema."""
    restaurant_name: str = Field(..., min_length=1, max_length=255)
    owner_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    address: Optional[str] = None
    description: Optional[str] = None


class UserResponse(BaseModel):
    """User response schema."""
    id: str
    email: str
    name: str
    role: str
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
