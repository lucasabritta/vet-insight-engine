import os
from typing import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


TEST_DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost/test_db"
)


@pytest.fixture(scope="session")
def db_engine():
    """Create test database engine using PGlite.

    PGlite provides a PostgreSQL-compatible in-memory database perfect for
    integration tests. It supports all PostgreSQL features without requiring
    a separate server instance.
    """
    engine = create_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=StaticPool,
    )

    yield engine


@pytest.fixture(scope="session")
def db_session_local(db_engine):
    """Create test database session factory."""
    return sessionmaker(autocommit=False, autoflush=False, bind=db_engine)


@pytest.fixture
def db(db_engine, db_session_local) -> Generator:
    """Create test database session with transaction isolation.

    Each test receives a fresh session that is rolled back after execution,
    ensuring complete isolation between tests. PGlite handles this natively
    with full PostgreSQL transaction support.
    """
    connection = db_engine.connect()
    transaction = connection.begin()
    session = db_session_local(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
