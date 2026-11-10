from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

class DocumentUploadResponse(BaseModel):
    id: UUID
    patient_id: UUID
    original_filename: str
    mime_type: str
    file_size_bytes: int
    processing_status: str
    verification_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)