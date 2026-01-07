"""Veterinary medical record schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MedicationSchema(BaseModel):
    """Medication information."""

    name: str = Field(..., description="Medication name")
    dosage: Optional[str] = Field(None, description="Dosage and frequency")
    route: Optional[str] = Field(None, description="Route of administration")
    indication: Optional[str] = Field(None, description="Indication for use")


class DiagnosisSchema(BaseModel):
    """Diagnosis information."""

    condition: str = Field(..., description="Diagnosis or condition")
    date: Optional[str] = Field(None, description="Date of diagnosis")
    severity: Optional[str] = Field(None, description="Severity level")
    notes: Optional[str] = Field(None, description="Additional notes")


class PetSchema(BaseModel):
    """Pet information."""

    name: Optional[str] = Field(None, description="Pet name")
    species: Optional[str] = Field(None, description="Species (dog, cat, etc.)")
    breed: Optional[str] = Field(None, description="Breed")
    age: Optional[str] = Field(None, description="Age")
    weight: Optional[str] = Field(None, description="Weight with units")
    microchip: Optional[str] = Field(None, description="Microchip ID")


class VeterinaryRecordSchema(BaseModel):
    """Structured veterinary medical record."""

    pet: PetSchema = Field(..., description="Pet information")
    clinic_name: Optional[str] = Field(
        None, description="Clinic or veterinary practice name"
    )
    veterinarian: Optional[str] = Field(None, description="Veterinarian name")
    visit_date: Optional[str] = Field(None, description="Date of visit")
    chief_complaint: Optional[str] = Field(
        None, description="Chief complaint or reason for visit"
    )
    clinical_history: Optional[str] = Field(
        None, description="Clinical history summary"
    )
    physical_examination: Optional[str] = Field(
        None, description="Physical examination findings"
    )
    diagnoses: list[DiagnosisSchema] = Field(
        default_factory=list, description="List of diagnoses"
    )
    medications: list[MedicationSchema] = Field(
        default_factory=list, description="List of medications"
    )
    treatment_plan: Optional[str] = Field(None, description="Treatment plan")
    prognosis: Optional[str] = Field(None, description="Prognosis")
    follow_up: Optional[str] = Field(None, description="Follow-up recommendations")
    notes: Optional[str] = Field(None, description="Additional clinical notes")
    extraction_date: datetime = Field(
        default_factory=datetime.utcnow, description="When the record was extracted"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "pet": {
                    "name": "Buddy",
                    "species": "Dog",
                    "breed": "Golden Retriever",
                    "age": "5 years",
                    "weight": "30 kg",
                },
                "clinic_name": "Happy Paws Clinic",
                "veterinarian": "Dr. Smith",
                "visit_date": "2024-01-15",
                "chief_complaint": "Lameness in right rear leg",
                "diagnoses": [{"condition": "Osteoarthritis"}],
                "medications": [{"name": "Carprofen", "dosage": "100mg twice daily"}],
            }
        }
    }
