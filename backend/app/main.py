from contextlib import asynccontextmanager
import logging
import importlib
import pkgutil

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
import app.api as api_package


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger = logging.getLogger("app")
    logger.info("startup env=%s", settings.environment)
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        logging.getLogger("app").exception("db.init.error msg=%s", str(exc))
    yield
    logger.info("shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description="Veterinary insight document processing engine",
        version="0.1.0",
        lifespan=lifespan,
    )

    # basic logging config
    logging.basicConfig(
        level=logging.DEBUG if settings.debug else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

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
