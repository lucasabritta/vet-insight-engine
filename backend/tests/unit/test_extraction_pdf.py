import os
from app.services.extraction.pdf import PDFExtractor




def test_pdf_extraction_clinical_history_1():
    sample = os.path.join(
        os.path.dirname(__file__), "../../data/samples/clinical_history_1.pdf"
    )
    extractor = PDFExtractor()
    result = extractor.extract(sample)
    assert result.text
    assert result.meta["pages"] > 0
def test_pdf_extraction_clinical_history_2():
    sample = os.path.join(
        os.path.dirname(__file__), "../../data/samples/clinical_history_2.pdf"
    )
    extractor = PDFExtractor()
    result = extractor.extract(sample)
    assert result.text
    assert result.meta["pages"] > 0
def test_pdf_extraction_clinical_history_content_1():
    sample = os.path.join(
        os.path.dirname(__file__), "../../data/samples/clinical_history_1.pdf"
    )
    extractor = PDFExtractor()
    result = extractor.extract(sample)
    # Check for actual keywords present in the sample
    assert "parque oeste" in result.text.lower()
    assert "alcorcón" in result.text.lower()
    assert result.meta["pages"] > 0
def test_pdf_extraction_clinical_history_content_2():
    sample = os.path.join(
        os.path.dirname(__file__), "../../data/samples/clinical_history_2.pdf"
    )
    extractor = PDFExtractor()
    result = extractor.extract(sample)
    # Check for actual keywords present in the sample
    assert "costa azahar" in result.text.lower()
    assert "alya" in result.text.lower()
    assert result.meta["pages"] > 0
