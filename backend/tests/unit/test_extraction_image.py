import os
from app.services.extraction.image import ImageExtractor

def test_image_extraction_sample():
    sample = os.path.join(os.path.dirname(__file__), '../../data/samples/sample.png')
    extractor = ImageExtractor()
    result = extractor.extract(sample)
    assert result.text.strip() != ''
    assert 'size' in result.meta
