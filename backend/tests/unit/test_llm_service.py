"""Unit tests for LLM extraction service."""

import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.schemas.veterinary_record import VeterinaryRecordSchema
from app.services.llm_service import (
    LLMExtractionError,
    RetryConfig,
    call_openai_with_retry,
    extract_structured_record,
)


@pytest.fixture
def sample_extracted_data():
    """Sample LLM extracted data."""
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


def test_extract_structured_record_success(sample_extracted_data):
    """Test successful extraction of structured record."""
    response_text = json.dumps(sample_extracted_data)

    mock_response = MagicMock()
    mock_response.choices[0].message.content = response_text

    with patch("openai.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client

        record = extract_structured_record("Sample raw text")
        assert isinstance(record, VeterinaryRecordSchema)
        assert record.pet.name == "Buddy"
        assert record.clinic_name == "Happy Paws Clinic"
        assert len(record.diagnoses) == 1
        assert len(record.medications) == 1


def test_extract_structured_record_invalid_json():
    """Test extraction fails with invalid JSON response."""

    mock_response = MagicMock()
    mock_response.choices[0].message.content = "{ invalid json"

    with patch("openai.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client

        with pytest.raises(LLMExtractionError) as exc_info:
            extract_structured_record("Sample raw text")

        assert "json" in str(exc_info.value).lower()


def test_extract_structured_record_validation_error(sample_extracted_data):
    """Test extraction fails when data doesn't match schema."""
    invalid_data = {**sample_extracted_data, "pet": None}  # pet is required
    response_text = json.dumps(invalid_data)

    mock_response = MagicMock()
    mock_response.choices[0].message.content = response_text

    with patch("openai.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client

        with pytest.raises(LLMExtractionError) as exc_info:
            extract_structured_record("Sample raw text")

        assert "validation" in str(exc_info.value).lower()


def test_call_openai_with_retry_success_sync(sample_extracted_data):
    """Test successful OpenAI API call with retry using asyncio.run."""
    response_text = json.dumps(sample_extracted_data)

    mock_response = MagicMock()
    mock_response.choices[0].message.content = response_text

    with patch("openai.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client

        result = asyncio.run(call_openai_with_retry("Test prompt"))
        assert result == response_text


def test_call_openai_with_retry_timeout_recovery_sync(sample_extracted_data):
    """Test OpenAI API call recovers after asyncio timeout using asyncio.run."""
    response_text = json.dumps(sample_extracted_data)
    mock_response = MagicMock()
    mock_response.choices[0].message.content = response_text

    with patch("openai.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        # First call times out, second succeeds
        mock_client.chat.completions.create.side_effect = [
            asyncio.TimeoutError("Request timed out"),
            mock_response,
        ]
        mock_openai.return_value = mock_client

        result = asyncio.run(
            call_openai_with_retry(
                "Test prompt",
                retry_config=RetryConfig(max_retries=2, backoff_factor=0.01),
            )
        )
        assert result == response_text


def test_call_openai_with_retry_max_retries_exceeded_sync():
    """Test OpenAI API raises error after max retries using asyncio.run."""

    with patch("openai.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_client.chat.completions.create.side_effect = asyncio.TimeoutError(
            "Request timed out"
        )
        mock_openai.return_value = mock_client

        with pytest.raises(LLMExtractionError) as exc_info:
            asyncio.run(
                call_openai_with_retry(
                    "Test prompt",
                    retry_config=RetryConfig(max_retries=2, backoff_factor=0.01),
                )
            )

        assert "timed out" in str(exc_info.value).lower()


def test_veterinary_record_schema_validation():
    """Test VeterinaryRecordSchema validates correctly."""
    valid_data = {
        "pet": {"name": "Buddy", "species": "Dog"},
        "clinic_name": "Happy Paws",
        "diagnoses": [],
        "medications": [],
    }

    record = VeterinaryRecordSchema(**valid_data)
    assert record.pet.name == "Buddy"
    assert record.pet.species == "Dog"
    assert len(record.diagnoses) == 0


def test_veterinary_record_schema_missing_required():
    """Test VeterinaryRecordSchema requires pet field."""
    invalid_data = {
        "clinic_name": "Happy Paws",
    }

    with pytest.raises(Exception):  # ValidationError
        VeterinaryRecordSchema(**invalid_data)
