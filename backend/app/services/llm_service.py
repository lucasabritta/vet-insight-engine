"""LLM service for structured veterinary data extraction."""

import asyncio
import json
from typing import Optional

import openai
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.veterinary_record import VeterinaryRecordSchema


class LLMExtractionError(Exception):
    """Custom exception for LLM extraction failures."""

    pass


class RetryConfig:
    """Configuration for retry logic."""

    def __init__(
        self, max_retries: int = 3, backoff_factor: float = 1.0, timeout: int = 30
    ):
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.timeout = timeout


async def call_openai_with_retry(
    prompt: str,
    model: str = "gpt-4o-mini",
    retry_config: Optional[RetryConfig] = None,
    temperature: float = 0.2,
) -> str:
    """
    Call OpenAI API with retry logic and error handling.

    Args:
        prompt: The prompt to send to OpenAI.
        model: The model to use (default: gpt-4o-mini).
        retry_config: Retry configuration.
        temperature: Temperature for LLM (lower = more deterministic).

    Returns:
        The LLM response text.

    Raises:
        LLMExtractionError: If extraction fails after retries.
    """
    if retry_config is None:
        retry_config = RetryConfig()

    client = openai.AsyncOpenAI(api_key=settings.openai_api_key)

    for attempt in range(retry_config.max_retries):
        try:
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert veterinary medical record parser. Extract structured data from veterinary documents with high accuracy.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=temperature,
                    response_format={"type": "json_object"},
                ),
                timeout=retry_config.timeout,
            )
            return response.choices[0].message.content

        except asyncio.TimeoutError:
            if attempt < retry_config.max_retries - 1:
                wait_time = retry_config.backoff_factor * (2**attempt)
                await asyncio.sleep(wait_time)
                continue
            raise LLMExtractionError(
                f"OpenAI request timed out after {retry_config.max_retries} retries"
            )

        except openai.APIError as e:
            if attempt < retry_config.max_retries - 1:
                wait_time = retry_config.backoff_factor * (2**attempt)
                await asyncio.sleep(wait_time)
                continue
            raise LLMExtractionError(f"OpenAI API error: {str(e)}")

    raise LLMExtractionError(
        f"Failed to extract data after {retry_config.max_retries} attempts"
    )


def extract_structured_record(raw_text: str) -> VeterinaryRecordSchema:
    """
    Extract structured veterinary record from raw text using LLM.

    Args:
        raw_text: Raw extracted text from document.

    Returns:
        VeterinaryRecordSchema: Structured veterinary record.

    Raises:
        LLMExtractionError: If LLM extraction fails.
        ValidationError: If extracted data doesn't conform to schema.
    """
    prompt = f"""Extract structured veterinary medical record data from the following text.
Return a valid JSON object matching this structure:
{{
  "pet": {{"name": "string", "species": "string", "breed": "string", "age": "string", "weight": "string", "microchip": "string"}},
  "clinic_name": "string",
  "veterinarian": "string",
  "visit_date": "string",
  "chief_complaint": "string",
  "clinical_history": "string",
  "physical_examination": "string",
  "diagnoses": [{{"condition": "string", "date": "string", "severity": "string", "notes": "string"}}],
  "medications": [{{"name": "string", "dosage": "string", "route": "string", "indication": "string"}}],
  "treatment_plan": "string",
  "prognosis": "string",
  "follow_up": "string",
  "notes": "string"
}}

Ensure all fields are accurate and properly categorized. Use null for missing information. Include all diagnoses and medications found.

Text to extract:
{raw_text}"""

    try:
        response_text = asyncio.run(call_openai_with_retry(prompt))
        extracted_data = json.loads(response_text)
        record = VeterinaryRecordSchema(**extracted_data)
        return record

    except json.JSONDecodeError as e:
        raise LLMExtractionError(f"Failed to parse LLM response as JSON: {str(e)}")

    except ValidationError as e:
        raise LLMExtractionError(f"Extracted data validation failed: {str(e)}")


async def extract_structured_record_async(raw_text: str) -> VeterinaryRecordSchema:
    """
    Async version of extract_structured_record.

    Args:
        raw_text: Raw extracted text from document.

    Returns:
        VeterinaryRecordSchema: Structured veterinary record.

    Raises:
        LLMExtractionError: If LLM extraction fails.
        ValidationError: If extracted data doesn't conform to schema.
    """
    prompt = f"""Extract structured veterinary medical record data from the following text.
Return a valid JSON object matching this structure:
{{
  "pet": {{"name": "string", "species": "string", "breed": "string", "age": "string", "weight": "string", "microchip": "string"}},
  "clinic_name": "string",
  "veterinarian": "string",
  "visit_date": "string",
  "chief_complaint": "string",
  "clinical_history": "string",
  "physical_examination": "string",
  "diagnoses": [{{"condition": "string", "date": "string", "severity": "string", "notes": "string"}}],
  "medications": [{{"name": "string", "dosage": "string", "route": "string", "indication": "string"}}],
  "treatment_plan": "string",
  "prognosis": "string",
  "follow_up": "string",
  "notes": "string"
}}

Ensure all fields are accurate and properly categorized. Use null for missing information. Include all diagnoses and medications found.

Text to extract:
{raw_text}"""

    try:
        response_text = await call_openai_with_retry(prompt)
        extracted_data = json.loads(response_text)
        record = VeterinaryRecordSchema(**extracted_data)
        return record

    except json.JSONDecodeError as e:
        raise LLMExtractionError(f"Failed to parse LLM response as JSON: {str(e)}")

    except ValidationError as e:
        raise LLMExtractionError(f"Extracted data validation failed: {str(e)}")
