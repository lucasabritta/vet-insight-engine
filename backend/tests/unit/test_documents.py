"""Document endpoint unit tests (validation, error handling)."""

from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_missing_file_field():
    """Test POST /documents/upload without file field."""
    resp = client.post("/documents/upload", data={})
    assert resp.status_code == 422
