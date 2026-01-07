"""Integration tests for database persistence of documents and records."""

import io
import os

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings


client = TestClient(app)


@pytest.mark.integration
def test_upload_and_update_record(tmp_path):
    settings.upload_dir = str(tmp_path)

    content = b"db test"
    files = {"file": ("db.txt", io.BytesIO(content), "text/plain")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 200
    doc_id = resp.json()["id"]

    # Update structured record via PUT
    payload = {
        "record": {
            "pet": {"name": "Rex"},
            "clinic_name": "Clinic A",
            "diagnoses": [],
            "medications": [],
        }
    }
    upd = client.put(f"/documents/{doc_id}", json=payload)
    assert upd.status_code == 200
    body = upd.json()
    assert body["id"] == doc_id
    assert body["record"]["pet"]["name"] == "Rex"
