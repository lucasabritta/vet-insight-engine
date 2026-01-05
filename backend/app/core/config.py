"""Application configuration."""
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    app_name: str = "Vet Insight Engine"
    environment: str = "development"
    debug: bool = True
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    database_url: str = "postgresql://user:password@postgres:5432/vet_insight"
    openai_api_key: str = ""
    upload_dir: str = "/app/uploads"
    max_upload_size_mb: int = 50

    class Config:
        """Pydantic config."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
