import os
from app.services.extraction.pdf import PDFExtractor


def test_pdf_extraction_clinical_history():
    sample = os.path.join(os.path.dirname(__file__), "../../data/samples/clinical_history_1.pdf")
    extractor = PDFExtractor()
    result = extractor.extract(sample)
    assert result.text
    assert result.meta["pages"] > 0
