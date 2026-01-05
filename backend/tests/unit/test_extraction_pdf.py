import os
from app.services.extraction.pdf import PDFExtractor


def test_pdf_extraction_sample():
    sample = os.path.join(os.path.dirname(__file__), "../../data/samples/sample.pdf")
    extractor = PDFExtractor()
    result = extractor.extract(sample)
    assert result.text
    assert result.meta["pages"] > 0
