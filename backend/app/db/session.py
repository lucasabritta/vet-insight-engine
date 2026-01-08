import logging
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine, autoflush=False, autocommit=False, class_=Session
)


def get_db() -> Iterator[Session]:
    logging.getLogger("app.db").debug("session.open")
    db = SessionLocal()
    try:
        yield db
    finally:
        logging.getLogger("app.db").debug("session.close")
        db.close()
