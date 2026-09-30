from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, model_validator
from app.models.instrument import InstrumentStatus


class InstrumentBase(BaseModel):
    instrument_id: str = Field(..., min_length=2, max_length=50, description="Unique Instrument Identifier")
    manufacturer: str = Field(..., min_length=1, max_length=150)
    model: str = Field(..., min_length=1, max_length=100)
    serial_number: str = Field(..., min_length=1, max_length=100)
    instrument_type: str = Field(..., min_length=1, max_length=100)
    instrument_class: str = Field(..., min_length=1, max_length=50)
    maximum_capacity: float = Field(..., gt=0, description="Maximum capacity in weighing units (e.g. kg, g)")
    minimum_capacity: float = Field(..., ge=0, description="Minimum capacity in weighing units")
    verification_scale_interval: float = Field(..., gt=0, description="Verification scale interval 'e'")
    accuracy_class: str = Field(..., min_length=1, max_length=50)
    country_of_manufacture: str = Field(..., min_length=1, max_length=100)
    status: InstrumentStatus = InstrumentStatus.ACTIVE

    @model_validator(mode="after")
    def validate_capacity_bounds(self) -> "InstrumentBase":
        if self.maximum_capacity <= self.minimum_capacity:
            raise ValueError("Maximum capacity must be strictly greater than minimum capacity.")
        return self


class InstrumentCreate(InstrumentBase):
    pass


class InstrumentUpdate(BaseModel):
    instrument_id: Optional[str] = Field(None, min_length=2, max_length=50)
    manufacturer: Optional[str] = Field(None, min_length=1, max_length=150)
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    serial_number: Optional[str] = Field(None, min_length=1, max_length=100)
    instrument_type: Optional[str] = Field(None, min_length=1, max_length=100)
    instrument_class: Optional[str] = Field(None, min_length=1, max_length=50)
    maximum_capacity: Optional[float] = Field(None, gt=0)
    minimum_capacity: Optional[float] = Field(None, ge=0)
    verification_scale_interval: Optional[float] = Field(None, gt=0)
    accuracy_class: Optional[str] = Field(None, min_length=1, max_length=50)
    country_of_manufacture: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[InstrumentStatus] = None

    @model_validator(mode="after")
    def validate_capacity_bounds(self) -> "InstrumentUpdate":
        if self.maximum_capacity is not None and self.minimum_capacity is not None:
            if self.maximum_capacity <= self.minimum_capacity:
                raise ValueError("Maximum capacity must be strictly greater than minimum capacity.")
        return self


class InstrumentResponse(InstrumentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedInstruments(BaseModel):
    items: List[InstrumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
