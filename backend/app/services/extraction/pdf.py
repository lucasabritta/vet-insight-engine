from .base import DocumentExtractor, ExtractionResult
import fitz  # PyMuPDF


class PDFExtractor(DocumentExtractor):
    def extract(self, file_path: str) -> ExtractionResult:
        doc = fitz.open(file_path)
        text = ""
        meta = {"pages": doc.page_count, "type": "pdf"}
        for page_num, page in enumerate(doc, 1):
            text += f"\n--- Page {page_num} ---\n"
            text += page.get_text()
        doc.close()
        return ExtractionResult(text=text, meta=meta)
