"""Integration tests for document extraction and LLM processing pipeline."""
import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def sample_pdf_path():
    """Path to sample PDF file used in tests."""
    return Path(__file__).parent.parent.parent / "data" / "samples" / "clinical_history_1.pdf"


@pytest.fixture
def sample_llm_response():
    """Sample LLM response for structured extraction."""
    return {
        "pet": {
            "name": "Buddy",
            "species": "Dog",
            "breed": "Golden Retriever",
            "age": "5 years",
            "weight": "30 kg",
            "microchip": None,
        },
        "clinic_name": "Happy Paws Clinic",
        "veterinarian": "Dr. Smith",
        "visit_date": "2024-01-15",
        "chief_complaint": "Lameness in right rear leg",
        "clinical_history": "Presented for evaluation of acute lameness",
        "physical_examination": "Pain on palpation of right hip",
        "diagnoses": [
            {
                "condition": "Osteoarthritis",
                "date": None,
                "severity": "moderate",
                "notes": None,
            }
        ],
        "medications": [
            {
                "name": "Carprofen",
                "dosage": "100mg twice daily",
                "route": None,
                "indication": None,
            }
        ],
        "treatment_plan": "Rest and anti-inflammatory therapy",
        "prognosis": "Good with treatment",
        "follow_up": "Recheck in 2 weeks",
        "notes": None,
    }


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


def test_upload_document_integration(client, sample_pdf_path):
    """Test uploading a PDF document."""
    if not sample_pdf_path.exists():
        pytest.skip(f"Sample file not found: {sample_pdf_path}")

    with open(sample_pdf_path, "rb") as f:
        response = client.post(
            "/documents/upload",
            files={"file": (sample_pdf_path.name, f, "application/pdf")},
        )

    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["filename"] == sample_pdf_path.name


def test_extract_text_from_document(client, sample_pdf_path):
    """Test extracting raw text from an uploaded document."""
    if not sample_pdf_path.exists():
        pytest.skip(f"Sample file not found: {sample_pdf_path}")

    # Upload document
    with open(sample_pdf_path, "rb") as f:
        upload_response = client.post(
            "/documents/upload",
            files={"file": (sample_pdf_path.name, f, "application/pdf")},
        )

    doc_id = upload_response.json()["id"]

    # Extract text
    response = client.get(f"/documents/{doc_id}/extract")
    assert response.status_code == 200

    data = response.json()
    assert "text" in data
    assert "extraction_meta" in data
    assert isinstance(data["text"], str)
    assert len(data["text"]) > 0


def test_extract_text_not_found(client):
    """Test extracting from non-existent document."""
    response = client.get("/documents/nonexistent/extract")
    assert response.status_code == 404


def test_extract_structured_document(client, sample_pdf_path, sample_llm_response):
    """Test full extraction pipeline: text extraction + LLM structuring."""
    if not sample_pdf_path.exists():
        pytest.skip(f"Sample file not found: {sample_pdf_path}")

    # Upload document
    with open(sample_pdf_path, "rb") as f:
        upload_response = client.post(
            "/documents/upload",
            files={"file": (sample_pdf_path.name, f, "application/pdf")},
        )

    doc_id = upload_response.json()["id"]

    # Mock the OpenAI API response
    mock_response = MagicMock()
    mock_response.choices[0].message.content = json.dumps(sample_llm_response)

    with patch("openai.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client

        # Extract and structure
        response = client.post(f"/documents/{doc_id}/extract")
        assert response.status_code == 200

        data = response.json()
        assert "id" in data
        assert data["id"] == doc_id
        assert "raw_text" in data
        assert "extraction_meta" in data
        assert "record" in data

        # Verify record structure
        record = data["record"]
        assert record["pet"]["name"] == "Buddy"
        assert record["clinic_name"] == "Happy Paws Clinic"
        assert len(record["diagnoses"]) == 1
        assert len(record["medications"]) == 1


def test_extract_structured_document_invalid_api_key(client, sample_pdf_path):
    """Test extraction fails gracefully with invalid OpenAI API key."""
    if not sample_pdf_path.exists():
        pytest.skip(f"Sample file not found: {sample_pdf_path}")

    # Upload document
    with open(sample_pdf_path, "rb") as f:
        upload_response = client.post(
            "/documents/upload",
            files={"file": (sample_pdf_path.name, f, "application/pdf")},
        )

    doc_id = upload_response.json()["id"]

    # Mock OpenAI API error using LLMExtractionError
    from app.services.llm_service import LLMExtractionError

    with patch(
        "app.services.document_service.extract_structured_record_from_text"
    ) as mock_llm:
        mock_llm.side_effect = LLMExtractionError("OpenAI API error: Invalid API key")

        response = client.post(f"/documents/{doc_id}/extract")
        assert response.status_code == 422


def test_extract_empty_document(client, tmp_path):
    """Test extraction fails gracefully with empty document."""
    # Create an empty PDF
    empty_file = tmp_path / "empty.pdf"
    empty_file.write_bytes(b"%PDF-1.0\n")

    with open(empty_file, "rb") as f:
        upload_response = client.post(
            "/documents/upload",
            files={"file": ("empty.pdf", f, "application/pdf")},
        )

    doc_id = upload_response.json()["id"]

    # Mock empty text result
    with patch(
        "app.services.document_service.extract_text_from_document"
    ) as mock_extract:
        mock_extract.return_value = {"text": "", "extraction_meta": {}}

        response = client.post(f"/documents/{doc_id}/extract")
        assert response.status_code == 422


def test_document_metadata_preserved(client, sample_pdf_path):
    """Test that document metadata is preserved through the pipeline."""
    if not sample_pdf_path.exists():
        pytest.skip(f"Sample file not found: {sample_pdf_path}")

    with open(sample_pdf_path, "rb") as f:
        upload_response = client.post(
            "/documents/upload",
            files={"file": (sample_pdf_path.name, f, "application/pdf")},
        )

    doc_id = upload_response.json()["id"]

    # Get metadata
    meta_response = client.get(f"/documents/{doc_id}")
    assert meta_response.status_code == 200

    meta = meta_response.json()
    assert meta["id"] == doc_id
    assert meta["original_filename"] == sample_pdf_path.name
    assert meta["content_type"] == "application/pdf"
    assert "size" in meta
    assert "created_at" in meta
