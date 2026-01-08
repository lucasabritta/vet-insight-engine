import logging
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
    logging.getLogger("app.api.documents").info(
        "upload.start filename=%s content_type=%s", file.filename, file.content_type
    )
    metadata = await document_service.save_upload_file(file, db=db)
    logging.getLogger("app.api.documents").info(
        "upload.saved id=%s size=%s", metadata["id"], metadata.get("size")
    )
    return {"id": metadata["id"], "filename": metadata["original_filename"]}


@router.get("/{doc_id}/file")
def download_document(doc_id: str, db: Session = Depends(get_db)) -> FileResponse:
    logging.getLogger("app.api.documents").debug("download.start id=%s", doc_id)
    file_path = document_service.get_file_path_from_meta(doc_id, db=db)
    meta = document_service.read_metadata(doc_id, db=db)
    headers = {"Content-Disposition": "inline"}
    return FileResponse(
        path=str(file_path),
        media_type=meta.get("content_type"),
        headers=headers,
    )


@router.post("/{doc_id}/extract")
def extract_and_structure_document(
    doc_id: str, db: Session = Depends(get_db)
) -> dict[str, Any]:
    logging.getLogger("app.api.documents").info("extract.start id=%s", doc_id)
    return document_service.process_document_full_pipeline(doc_id, db=db)


@router.put("/{doc_id}")
def update_document_record(
    doc_id: str,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    logging.getLogger("app.api.documents").info("record.update.start id=%s", doc_id)
    if "record" not in payload:
        raise HTTPException(status_code=422, detail="'record' field required")
    record = VeterinaryRecordSchema.model_validate(payload["record"])
    updated = document_service.upsert_structured_record(
        db, doc_id, json.loads(record.model_dump_json())
    )
    logging.getLogger("app.api.documents").info("record.update.success id=%s", doc_id)
    return {"id": doc_id, "record": updated}
