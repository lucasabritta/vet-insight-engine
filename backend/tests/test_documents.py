import io
import json
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings


client = TestClient(app)


def test_upload_and_download(tmp_path):
    # use a temporary upload dir for isolation
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


def test_get_missing_document():
    resp = client.get("/documents/nonexistentid")
    assert resp.status_code == 404
