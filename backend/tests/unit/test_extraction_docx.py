import os
from app.services.extraction.docx import DocxExtractor


def test_docx_extraction_sample():
    sample = os.path.join(os.path.dirname(__file__), "../../data/samples/sample.docx")
    extractor = DocxExtractor()
    result = extractor.extract(sample)
    assert result.text
    assert result.meta["paragraphs"] > 0
