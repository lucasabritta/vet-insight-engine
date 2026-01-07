from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from fastapi import HTTPException, UploadFile

from app.core.config import settings
from app.services.extraction.factory import get_extractor
from app.services.llm_service import (
    extract_structured_record,
    LLMExtractionError,
)


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


def extract_text_from_document(doc_id: str) -> Dict[str, Any]:
    """Extract raw text from document using appropriate extractor.

    Returns dict with 'text' and 'extraction_meta' keys.
    Raises HTTPException on extraction errors.
    """
    meta = read_metadata(doc_id)
    file_path = get_file_path_from_meta(doc_id)
    content_type = meta.get("content_type")

    try:
        extractor = get_extractor(content_type)
        result = extractor.extract(str(file_path))
        return {
            "text": result.text,
            "extraction_meta": result.meta,
        }
    except ValueError as e:
        raise HTTPException(status_code=415, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


def extract_structured_record_from_text(
    raw_text: str,
) -> Dict[str, Any]:
    """Extract and structure veterinary record from raw text using LLM.

    Returns dict with 'record' key containing VeterinaryRecordSchema data.
    Raises HTTPException on LLM errors.
    """
    try:
        record = extract_structured_record(raw_text)
        return {
            "record": record.model_dump(),
        }
    except LLMExtractionError as e:
        raise HTTPException(
            status_code=422,
            detail=f"LLM extraction failed: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


def process_document_full_pipeline(doc_id: str) -> Dict[str, Any]:
    """Full pipeline: extract text → structure with LLM.

    Returns dict with both raw text and structured record.
    """
    extraction_result = extract_text_from_document(doc_id)
    raw_text = extraction_result["text"]

    if not raw_text or not raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail="No text could be extracted from document",
        )

    try:
        structured_result = extract_structured_record_from_text(raw_text)
    except HTTPException as e:
        # Preserve upstream HTTP errors (e.g., 422 from LLM failures)
        raise e
    except LLMExtractionError as e:
        # Handle direct LLM errors if raised by mocks or underlying calls
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
