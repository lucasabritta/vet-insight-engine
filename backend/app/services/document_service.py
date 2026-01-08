from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
import mimetypes
import zipfile
from typing import Any
import logging

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.model_exports import Document, StructuredRecord
from app.services.extraction.factory import get_extractor
from app.services.llm_service import extract_structured_record, LLMExtractionError

logger = logging.getLogger("app.services.documents")


def _ensure_upload_dir() -> Path:
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_upload_file(
    file: UploadFile, db: Session | None = None
) -> dict[str, Any]:
    """Save uploaded file and return metadata."""
    upload_dir = _ensure_upload_dir()
    doc_id = uuid.uuid4().hex
    filename = f"{doc_id}_{file.filename}"
    file_path = upload_dir / filename

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

    content_type = _infer_content_type(file_path, file.filename, file.content_type)

    metadata = {
        "id": doc_id,
        "original_filename": file.filename,
        "stored_filename": filename,
        "content_type": content_type,
        "size": file_path.stat().st_size,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "path": str(file_path),
    }

    meta_path = upload_dir / f"{doc_id}.json"
    meta_path.write_text(json.dumps(metadata))

    # Persist metadata in DB when session provided
    if db is not None:
        persist_document_metadata(db, metadata)

    logger.info(
        "upload.persisted id=%s filename=%s size=%s type=%s",
        doc_id,
        file.filename,
        metadata["size"],
        content_type,
    )

    return metadata


def _infer_content_type(
    file_path: Path, original_filename: str, uploaded_type: str | None
) -> str:
    """Infer a stable MIME type."""
    if uploaded_type and uploaded_type != "application/octet-stream":
        if uploaded_type in settings.allowed_mimetypes:
            return uploaded_type

    ext = Path(original_filename or "").suffix.lower()
    ext_map: dict[str, str] = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".doc": "application/msword",
        ".txt": "text/plain",
    }
    if ext in ext_map:
        return ext_map[ext]

    guessed, _ = mimetypes.guess_type(original_filename or "")
    if guessed and guessed in settings.allowed_mimetypes:
        return guessed

    try:
        with file_path.open("rb") as f:
            head = f.read(8)
        if head.startswith(b"%PDF-"):
            return "application/pdf"
        if head.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        if head.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
        if head.startswith(b"PK\x03\x04"):
            try:
                with zipfile.ZipFile(file_path) as zf:
                    if any(n.startswith("word/") for n in zf.namelist()):
                        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            except zipfile.BadZipFile:
                pass
    except Exception:
        pass

    return "application/octet-stream"


def _metadata_from_model(doc) -> dict[str, Any]:
    return {
        "id": doc.id,
        "original_filename": doc.original_filename,
        "stored_filename": doc.stored_filename,
        "content_type": doc.content_type,
        "size": doc.size,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "path": doc.path,
    }


def read_metadata(doc_id: str, db: Session | None = None) -> dict[str, Any]:
    upload_dir = Path(settings.upload_dir)
    meta_path = upload_dir / f"{doc_id}.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        data = json.loads(meta_path.read_text())
        logger.debug("metadata.read id=%s", doc_id)
        return data
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read metadata")


def get_file_path_from_meta(doc_id: str, db: Session | None = None) -> Path:
    meta = read_metadata(doc_id, db=db)
    path = Path(meta.get("path"))
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    logger.debug("file.path id=%s path=%s", doc_id, str(path))
    return path


def extract_text_from_document(
    doc_id: str, db: Session | None = None
) -> dict[str, Any]:
    """Extract raw text using appropriate extractor."""
    meta = read_metadata(doc_id, db=db)
    file_path = get_file_path_from_meta(doc_id, db=db)
    content_type = meta.get("content_type")

    try:
        logger.info("extract.text.start id=%s type=%s", doc_id, content_type)
        extractor = get_extractor(content_type)
        result = extractor.extract(str(file_path))
        logger.info("extract.text.success id=%s chars=%s", doc_id, len(result.text or ""))
        return {
            "text": result.text,
            "extraction_meta": result.meta,
        }
    except ValueError as e:
        raise HTTPException(status_code=415, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


def _to_jsonable(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _to_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_jsonable(v) for v in obj]
    if isinstance(obj, tuple):
        return tuple(_to_jsonable(v) for v in obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


def extract_structured_record_from_text(
    raw_text: str,
    db: Session | None = None,
    doc_id: str | None = None,
) -> dict[str, Any]:
    """Extract and structure record from raw text using LLM."""
    try:
        logger.info("extract.record.start doc_id=%s", doc_id)
        record = extract_structured_record(raw_text)
        result = {"record": _to_jsonable(record.model_dump())}
        if db is not None and doc_id:
            upsert_structured_record(db, doc_id, result["record"])
        logger.info("extract.record.success doc_id=%s", doc_id)
        return result
    except LLMExtractionError as e:
        raise HTTPException(
            status_code=422,
            detail=f"LLM extraction failed: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


def process_document_full_pipeline(
    doc_id: str, db: Session | None = None
) -> dict[str, Any]:
    """Run full pipeline: extract text then structure with LLM."""
    extraction_result = extract_text_from_document(doc_id, db=db)
    raw_text = extraction_result["text"]

    if not raw_text or not raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail="No text could be extracted from document",
        )

    try:
        structured_result = extract_structured_record_from_text(
            raw_text, db=db, doc_id=doc_id
        )
    except HTTPException as e:
        raise e
    except LLMExtractionError as e:
        raise HTTPException(
            status_code=422,
            detail=f"LLM extraction failed: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    return {
        "id": doc_id,
        "raw_text": raw_text,
        "extraction_meta": extraction_result["extraction_meta"],
        "record": structured_result["record"],
    }


def persist_document_metadata(db: Session, metadata: dict[str, Any]) -> None:
    """Persist uploaded document metadata."""
    existing = db.get(Document, metadata["id"])
    if existing:
        existing.original_filename = metadata.get(
            "original_filename", existing.original_filename
        )
        existing.stored_filename = metadata.get(
            "stored_filename", existing.stored_filename
        )
        existing.content_type = metadata.get("content_type", existing.content_type)
        existing.size = int(metadata.get("size", existing.size or 0))
        existing.path = metadata.get("path", existing.path)
    else:
        doc = Document(
            id=metadata["id"],
            original_filename=metadata["original_filename"],
            stored_filename=metadata["stored_filename"],
            content_type=metadata.get("content_type"),
            size=int(metadata.get("size", 0)),
            path=metadata["path"],
        )
        db.add(doc)
    db.commit()
    logger.debug("metadata.persisted id=%s", metadata["id"])


def upsert_structured_record(
    db: Session, doc_id: str, record: dict[str, Any]
) -> dict[str, Any]:
    """Create or update structured record for a document."""
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    # Load existing or create
    payload = _to_jsonable(record)
    if doc.record:
        doc.record.record_json = payload
    else:
        doc.record = StructuredRecord(document_id=doc_id, record_json=payload)
    db.commit()
    db.refresh(doc)
    logger.debug("record.upserted doc_id=%s", doc_id)
    return doc.record.record_json
