import io
import json
import os
from pathlib import Path
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.core.config import settings


client = TestClient(app)


def test_upload_empty_file(tmp_path):
    settings.upload_dir = str(tmp_path)
    content = b""
    files = {"file": ("empty.txt", io.BytesIO(content), "text/plain")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 200
    doc_id = resp.json()["id"]
    meta = client.get(f"/documents/{doc_id}").json()
    assert meta["size"] == 0


def test_upload_large_file(tmp_path):
    settings.upload_dir = str(tmp_path)
    # 2 MB
    content = b"a" * (2 * 1024 * 1024)
    # use allowed mime for binary
    files = {"file": ("large.bin", io.BytesIO(content), "application/octet-stream")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 200
    doc_id = resp.json()["id"]
    meta = client.get(f"/documents/{doc_id}").json()
    assert meta["size"] == len(content)


def test_missing_file_field():
    resp = client.post("/documents/upload", data={})
    assert resp.status_code == 422


def test_corrupt_metadata_returns_500(tmp_path):
    settings.upload_dir = str(tmp_path)
    content = b"good"
    files = {"file": ("doc.txt", io.BytesIO(content), "text/plain")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 200
    doc_id = resp.json()["id"]

    meta_path = Path(settings.upload_dir) / f"{doc_id}.json"
    meta_path.write_text("not-a-json")

    # metadata read should fail
    resp2 = client.get(f"/documents/{doc_id}")
    assert resp2.status_code == 500


def test_download_missing_file(tmp_path):
    settings.upload_dir = str(tmp_path)
    content = b"hello"
    files = {"file": ("toremove.txt", io.BytesIO(content), "text/plain")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 200
    doc_id = resp.json()["id"]

    # remove the stored file
    meta = client.get(f"/documents/{doc_id}").json()
    file_path = Path(meta["path"])
    if file_path.exists():
        os.remove(file_path)

    dl = client.get(f"/documents/{doc_id}/file")
    assert dl.status_code == 404


def test_invalid_mime_rejected(tmp_path):
    settings.upload_dir = str(tmp_path)
    # set small allowed list to ensure rejection
    orig_allowed = settings.allowed_mimetypes
    settings.allowed_mimetypes = ["text/plain"]
    content = b"data"
    files = {"file": ("image.bin", io.BytesIO(content), "application/octet-stream")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 415
    settings.allowed_mimetypes = orig_allowed


def test_oversize_rejected(tmp_path):
    settings.upload_dir = str(tmp_path)
    orig_limit = settings.max_upload_size_mb
    settings.max_upload_size_mb = 0  # 0 MB to force rejection
    content = b"x" * 1024
    files = {"file": ("small.bin", io.BytesIO(content), "application/octet-stream")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 413
    settings.max_upload_size_mb = orig_limit
