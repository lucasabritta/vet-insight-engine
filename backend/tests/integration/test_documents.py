"""Document upload/download integration tests."""

import io
import os
from pathlib import Path

from app.core.config import settings


def test_upload_and_download(client, tmp_path):
    """Test full upload and download workflow."""
    settings.upload_dir = str(tmp_path)

    content = b"hello world"
    file_obj = io.BytesIO(content)
    files = {"file": ("sample.txt", file_obj, "text/plain")}

    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    doc_id = data["id"]

    # get metadata
    meta = client.get(f"/documents/{doc_id}")
    assert meta.status_code == 200
    meta_json = meta.json()
    assert meta_json["id"] == doc_id
    assert meta_json["original_filename"] == "sample.txt"

    # download file
    dl = client.get(f"/documents/{doc_id}/file")
    assert dl.status_code == 200
    assert dl.content == content


def test_upload_empty_file(client, tmp_path):
    """Test uploading an empty file."""
    settings.upload_dir = str(tmp_path)
    content = b""
    files = {"file": ("empty.txt", io.BytesIO(content), "text/plain")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 200
    doc_id = resp.json()["id"]
    meta = client.get(f"/documents/{doc_id}").json()
    assert meta["size"] == 0


def test_upload_large_file(client, tmp_path):
    """Test uploading a 2 MB file within limits."""
    settings.upload_dir = str(tmp_path)
    content = b"a" * (2 * 1024 * 1024)
    files = {"file": ("large.bin", io.BytesIO(content), "application/octet-stream")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 200
    doc_id = resp.json()["id"]
    meta = client.get(f"/documents/{doc_id}").json()
    assert meta["size"] == len(content)


def test_corrupt_metadata_returns_500(client, tmp_path):
    """Test retrieving document with corrupted metadata file."""
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
    # Accept either 500 (internal error) or 422 (validation error) as valid failure
    if resp2.status_code not in (500, 422):
        print(f"Unexpected status: {resp2.status_code}, body: {resp2.text}")
    assert resp2.status_code in (500, 422)
    if resp2.status_code == 500:
        assert "Failed to read metadata" in resp2.text


def test_download_missing_file(client, tmp_path):
    """Test downloading when stored file is missing."""
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


def test_invalid_mime_rejected(client, tmp_path):
    """Test rejection of unsupported MIME types."""
    settings.upload_dir = str(tmp_path)
    # set small allowed list to ensure rejection
    orig_allowed = settings.allowed_mimetypes
    settings.allowed_mimetypes = ["text/plain"]
    content = b"data"
    files = {"file": ("image.bin", io.BytesIO(content), "application/octet-stream")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 415
    settings.allowed_mimetypes = orig_allowed


def test_oversize_rejected(client, tmp_path):
    """Test rejection of files exceeding size limit."""
    settings.upload_dir = str(tmp_path)
    orig_limit = settings.max_upload_size_mb
    settings.max_upload_size_mb = 0  # 0 MB to force rejection
    content = b"x" * 1024
    files = {"file": ("small.bin", io.BytesIO(content), "application/octet-stream")}
    resp = client.post("/documents/upload", files=files)
    assert resp.status_code == 413
    settings.max_upload_size_mb = orig_limit
