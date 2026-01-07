import os
import shutil
import pytesseract

from app.services.extraction.image import ImageExtractor


def test_image_extraction_uses_ocr_on_sample():
    sample = os.path.join(
        os.path.dirname(__file__), "../../data/samples/clinical_history_1_1.png"
    )
    extractor = ImageExtractor()
    # If tesseract isn't available (CI), fallback to a deterministic fixture
    if not shutil.which("tesseract"):
        fixture = os.path.join(
            os.path.dirname(__file__), "fixtures/clinical_history_1_1.txt"
        )
        _orig = getattr(pytesseract, "image_to_string", None)
        try:
            with open(fixture, "r", encoding="utf-8") as fh:
                txt = fh.read()

            pytesseract.image_to_string = lambda image: txt
            result = extractor.extract(sample)
        finally:
            if _orig is not None:
                pytesseract.image_to_string = _orig
    else:
        result = extractor.extract(sample)
    # Ensure OCR produced some text and metadata was captured
    assert result.text and result.text.strip()
    assert "size" in result.meta


def test_image_extraction_contains_medical_keywords():
    sample = os.path.join(
        os.path.dirname(__file__), "../../data/samples/clinical_history_1_1.png"
    )
    extractor = ImageExtractor()
    if not shutil.which("tesseract"):
        fixture = os.path.join(
            os.path.dirname(__file__), "fixtures/clinical_history_1_1.txt"
        )
        _orig = getattr(pytesseract, "image_to_string", None)
        try:
            with open(fixture, "r", encoding="utf-8") as fh:
                txt = fh.read()

            pytesseract.image_to_string = lambda image: txt
            result = extractor.extract(sample)
        finally:
            if _orig is not None:
                pytesseract.image_to_string = _orig
    else:
        result = extractor.extract(sample)

    text = result.text.lower()
    keywords = [
        "exploracion",
        "historial",
        "parque oeste",
        "alcorcón",
        "peso",
        "abdomen",
        "chip",
        "kivet",
    ]
    assert any(
        k in text for k in keywords
    ), f"OCR text did not contain expected keywords: {text[:200]}"
