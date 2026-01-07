import os
from app.services.extraction.docx import DocxExtractor

def test_docx_extraction_sample():
    sample = os.path.join(os.path.dirname(__file__), "../../data/samples/clinical_history_1.docx")
    extractor = DocxExtractor()
    result = extractor.extract(sample)
    assert result.text
    assert result.meta["paragraphs"] > 0

def test_docx_extraction_medical_keywords():
    sample = os.path.join(os.path.dirname(__file__), "../../data/samples/clinical_history_1.docx")
    extractor = DocxExtractor()
    result = extractor.extract(sample)
    assert "historial" in result.text.lower()
    assert "parque oeste" in result.text.lower()
    assert "giardiasis" in result.text.lower() or "copro" in result.text.lower()
    assert result.meta["paragraphs"] > 0
