"""Application configuration."""
from pathlib import Path
from typing import List

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    model_config = ConfigDict(env_file=".env" if Path(".env").exists() else None)

    app_name: str = "Vet Insight Engine"
    environment: str = "development"
    debug: bool = True
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    database_url: str = "postgresql://user:password@postgres:5432/vet_insight"
    openai_api_key: str = ""
    upload_dir: str = "/app/uploads"
    max_upload_size_mb: int = 50


settings = Settings()
