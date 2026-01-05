from .base import DocumentExtractor, ExtractionResult
from typing import Any
import pytesseract
from PIL import Image

class ImageExtractor(DocumentExtractor):
    def extract(self, file_path: str) -> ExtractionResult:
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        meta = {"type": "image", "mode": image.mode, "size": image.size}
        return ExtractionResult(text=text, meta=meta)
