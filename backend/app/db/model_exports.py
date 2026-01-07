"""Re-export Document and StructuredRecord models for convenience."""

from app.db.document import Document
from app.db.structured_record import StructuredRecord

__all__ = ["Document", "StructuredRecord"]
