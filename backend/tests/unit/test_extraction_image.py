import os
import pytesseract
from app.services.extraction.image import ImageExtractor


def test_image_extraction_sample(monkeypatch):
    sample = os.path.join(os.path.dirname(__file__), "../../data/samples/sample.png")
    monkeypatch.setattr(pytesseract, "image_to_string", lambda img: "Hello PNG OCR")

    extractor = ImageExtractor()
    result = extractor.extract(sample)
    assert result.text.strip() == "Hello PNG OCR"
    assert "size" in result.meta
