import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "NAWI Compliance & Test Report System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "nawi-oiml-r76-super-secure-production-ready-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    # Default to sqlite:///./nawi.db for immediate local running without requiring external daemon,
    # or set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nawi_db in .env
    DATABASE_URL: str = "sqlite:///./nawi.db"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
