from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from fastapi import HTTPException, UploadFile

from app.core.config import settings


def _ensure_upload_dir() -> Path:
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_upload_file(file: UploadFile) -> Dict[str, Any]:
    """Save an uploaded file to disk and return metadata.

    Raises HTTPException on validation or write errors.
    """
    upload_dir = _ensure_upload_dir()
    doc_id = uuid.uuid4().hex
    filename = f"{doc_id}_{file.filename}"
    file_path = upload_dir / filename

    # validate content type
    if file.content_type and file.content_type not in settings.allowed_mimetypes:
        raise HTTPException(status_code=415, detail="Unsupported media type")

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    try:
        total = 0
        with file_path.open("wb") as f:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_bytes:
                    f.close()
                    try:
                        file_path.unlink(missing_ok=True)
                    except Exception:
                        pass
                    raise HTTPException(status_code=413, detail="File too large")
                f.write(chunk)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    metadata = {
        "id": doc_id,
        "original_filename": file.filename,
        "stored_filename": filename,
        "content_type": file.content_type,
        "size": file_path.stat().st_size,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "path": str(file_path),
    }

    meta_path = upload_dir / f"{doc_id}.json"
    meta_path.write_text(json.dumps(metadata))

    return metadata


def read_metadata(doc_id: str) -> Dict[str, Any]:
    upload_dir = Path(settings.upload_dir)
    meta_path = upload_dir / f"{doc_id}.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        return json.loads(meta_path.read_text())
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read metadata")


def get_file_path_from_meta(doc_id: str) -> Path:
    meta = read_metadata(doc_id)
    path = Path(meta.get("path"))
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return path
