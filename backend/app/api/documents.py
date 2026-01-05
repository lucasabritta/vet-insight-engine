from datetime import datetime
import json
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from app.core.config import settings

router = APIRouter()


def _ensure_upload_dir() -> Path:
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)) -> dict:
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
                    # remove partial file
                    f.close()
                    try:
                        file_path.unlink(missing_ok=True)
                    except Exception:
                        pass
                    raise HTTPException(status_code=413, detail="File too large")
                f.write(chunk)
    except HTTPException:
        # re-raise known HTTP errors
        raise
    except Exception as exc:
        import traceback

        detail = f"{exc} - {traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=detail)

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

    return {"id": doc_id, "filename": file.filename}


@router.get("/{doc_id}")
def get_document(doc_id: str) -> dict:
    upload_dir = Path(settings.upload_dir)
    meta_path = upload_dir / f"{doc_id}.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        data = json.loads(meta_path.read_text())
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read metadata")
    return data


@router.get("/{doc_id}/file")
def download_document(doc_id: str):
    upload_dir = Path(settings.upload_dir)
    meta_path = upload_dir / f"{doc_id}.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Document not found")
    data = json.loads(meta_path.read_text())
    file_path = Path(data.get("path"))
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=str(file_path), filename=data.get("original_filename"), media_type=data.get("content_type"))
