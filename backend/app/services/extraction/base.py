from abc import ABC, abstractmethod
from typing import Any, Dict


class ExtractionResult:
    def __init__(self, text: str, meta: Dict[str, Any]) -> None:
        self.text = text
        self.meta = meta


class DocumentExtractor(ABC):
    @abstractmethod
    def extract(self, file_path: str) -> ExtractionResult:
        """Extract text and metadata from a file."""
        pass
