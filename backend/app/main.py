"""FastAPI application initialization."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
import importlib
import pkgutil
import app.api as api_package


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    print(f"Application starting in {settings.environment} mode")
    yield
    print("Application shutting down")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        description="Veterinary insight document processing engine",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Auto-discover and include routers from the `app.api` package.
    for finder, name, ispkg in pkgutil.iter_modules(api_package.__path__):
        module = importlib.import_module(f"{api_package.__name__}.{name}")
        router = getattr(module, "router", None)
        if not router:
            continue
        prefix = getattr(module, "router_prefix", None)
        if prefix:
            app.include_router(router, prefix=prefix)
        else:
            app.include_router(router)

    return app


app = create_app()
