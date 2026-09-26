import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str
    SYNC_DATABASE_URL: str  # For Alembic migrations

    # Redis
    REDIS_URL: str

    # JWT
    JWT_SECRET: str
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
    ]

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True

    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def get_jwt_secret(self) -> str:
        """Ensure JWT_SECRET is set, fail in production if missing."""
        if not self.JWT_SECRET:
            if self.is_production():
                raise ValueError(
                    "JWT_SECRET must be set in production. Startup failed."
                )
            return "dev-insecure-key-change-in-production"
        return self.JWT_SECRET


# Global settings instance
settings = Settings()
