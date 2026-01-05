from fastapi import APIRouter, File, UploadFile
from fastapi.responses import FileResponse

from app.services import document_service


router = APIRouter()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)) -> dict:
    metadata = await document_service.save_upload_file(file)
    return {"id": metadata["id"], "filename": metadata["original_filename"]}


@router.get("/{doc_id}")
def get_document(doc_id: str) -> dict:
    return document_service.read_metadata(doc_id)


@router.get("/{doc_id}/file")
def download_document(doc_id: str):
    file_path = document_service.get_file_path_from_meta(doc_id)
    meta = document_service.read_metadata(doc_id)
    return FileResponse(
        path=str(file_path),
        filename=meta.get("original_filename"),
        media_type=meta.get("content_type"),
    )
