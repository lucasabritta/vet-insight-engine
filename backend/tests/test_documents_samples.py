import mimetypes
from pathlib import Path
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.core.config import settings


client = TestClient(app)


def test_upload_samples(tmp_path):
    repo_root = Path(__file__).resolve().parents[2]
    samples_dir = repo_root / "data" / "samples"
    if not samples_dir.exists():
        pytest.skip("No samples directory found")

    files = list(samples_dir.iterdir())
    if not files:
        pytest.skip("No sample files to test")

    settings.upload_dir = str(tmp_path)

    for sample in files:
        content = sample.read_bytes()
        mtype, _ = mimetypes.guess_type(sample.name)
        mtype = mtype or "application/octet-stream"
        with sample.open("rb") as fp:
            resp = client.post("/documents/upload", files={"file": (sample.name, fp, mtype)})
        assert resp.status_code == 200, f"upload failed for {sample.name}: {resp.text}"
        doc_id = resp.json().get("id")
        assert doc_id

        meta = client.get(f"/documents/{doc_id}")
        assert meta.status_code == 200
        meta_json = meta.json()
        assert meta_json["original_filename"] == sample.name

        dl = client.get(f"/documents/{doc_id}/file")
        assert dl.status_code == 200
        assert dl.content == content
