"""Pytest configuration for integration tests using py-pglite."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.base import Base
from app.db.session import get_db


@pytest.fixture(scope="function")
def client(pglite_session):
    """FastAPI test client with PGlite database."""
    # pglite_session is the SQLAlchemy session provided by py-pglite
    # Create tables in the test database
    Base.metadata.create_all(bind=pglite_session.bind)

    # We need to override the get_db dependency
    def override_get_db():
        try:
            yield pglite_session
        finally:
            pass  # py-pglite handles cleanup

    app.dependency_overrides[get_db] = override_get_db

    # Create test client
    test_client = TestClient(app)

    yield test_client

    # Clean up
    app.dependency_overrides.clear()
