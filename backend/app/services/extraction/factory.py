from .pdf import PDFExtractor
from .docx import DocxExtractor
from .image import ImageExtractor
from .base import DocumentExtractor
from typing import Type

MIME_MAP: dict[str, Type[DocumentExtractor]] = {
    "application/pdf": PDFExtractor,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": DocxExtractor,
    "image/png": ImageExtractor,
    "image/jpeg": ImageExtractor,
    "image/jpg": ImageExtractor,
}


def get_extractor(mime_type: str) -> DocumentExtractor:
    extractor_cls = MIME_MAP.get(mime_type)
    if not extractor_cls:
        raise ValueError(f"Unsupported MIME type: {mime_type}")
    return extractor_cls()
