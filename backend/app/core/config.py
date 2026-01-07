"""Application configuration."""

from pathlib import Path
from typing import List

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with test-aware database URL."""

    # Load .env when present, but ignore extra environment variables
    model_config = ConfigDict(
        env_file=".env" if Path(".env").exists() else None,
        extra="ignore",
    )

    app_name: str = "Vet Insight Engine"
    environment: str = "development"
    debug: bool = True
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Default for Docker Compose
    _default_db_url: str = "postgresql://user:password@postgres:5432/vet_insight"

    @property
    def database_url(self) -> str:
        import sys
        import os

        # Check for explicit DATABASE_URL environment variable first (for CI/production)
        if os.environ.get("DATABASE_URL"):
            return os.environ["DATABASE_URL"]

        # Use PGlite for pytest runs (in-memory, no external DB)
        is_pytest = any("pytest" in arg for arg in sys.argv)
        if is_pytest:
            # PGlite default connection string
            return "postgresql://postgres:postgres@localhost/test_db"
        # Fallback to previous logic for non-test runs
        if os.environ.get("PYTEST_RUNNING_IN_DOCKER") == "1":
            return "postgresql://user:password@postgres:5432/vet_insight"
        return self._default_db_url

    openai_api_key: str = ""
    # LLM diagnostics and behavior
    llm_debug_logs: bool = True
    llm_fallback_on_error: bool = False
    upload_dir: str = "/app/uploads"
    max_upload_size_mb: int = 50
    allowed_mimetypes: list[str] = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "text/plain",
        "application/octet-stream",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ]


settings = Settings()
