"""Document API routes."""

import json
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.veterinary_record import VeterinaryRecordSchema
from app.services import document_service


router = APIRouter()
router_prefix = "/documents"


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    metadata = await document_service.save_upload_file(file, db=db)
    return {"id": metadata["id"], "filename": metadata["original_filename"]}


@router.get("/{doc_id}")
def get_document(doc_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    return document_service.read_metadata(doc_id, db=db)


@router.get("/{doc_id}/file")
def download_document(doc_id: str, db: Session = Depends(get_db)) -> FileResponse:
    file_path = document_service.get_file_path_from_meta(doc_id, db=db)
    meta = document_service.read_metadata(doc_id, db=db)
    return FileResponse(
        path=str(file_path),
        filename=meta.get("original_filename"),
        media_type=meta.get("content_type"),
    )


@router.post("/{doc_id}/extract")
def extract_and_structure_document(doc_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Full pipeline: extract text and structure with LLM.

    Returns raw text and structured veterinary record.
    """
    return document_service.process_document_full_pipeline(doc_id, db=db)


@router.put("/{doc_id}")
def update_document_record(
    doc_id: str,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Update stored structured record for the given document.

    Accepts payload with a 'record' field conforming to VeterinaryRecordSchema.
    Returns updated record JSON.
    """
    if "record" not in payload:
        raise HTTPException(status_code=422, detail="'record' field required")
    record = VeterinaryRecordSchema.model_validate(payload["record"])
    updated = document_service.upsert_structured_record(
        db, doc_id, json.loads(record.model_dump_json())
    )
    return {"id": doc_id, "record": updated}
