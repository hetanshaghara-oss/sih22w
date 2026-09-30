from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ObservationBase(BaseModel):
    sequence_order: int = Field(default=1, ge=1)
    load_point: float = Field(..., ge=0, description="Applied test load L")
    indicated_value: float = Field(..., ge=0, description="Reading displayed by instrument I")
    extra_load_added: float = Field(default=0.0, ge=0, description="Delta L added until turning point")
    zero_indicated: float = Field(default=0.0, description="Zero reading before load")
    tare_applied: float = Field(default=0.0, ge=0, description="Tare value")
    position_label: Optional[str] = Field(None, max_length=50, description="e.g. Center, Pos 1, Pos 2")
    notes: Optional[str] = None


class ObservationCreate(ObservationBase):
    pass


class ObservationUpdate(BaseModel):
    sequence_order: Optional[int] = Field(None, ge=1)
    load_point: Optional[float] = Field(None, ge=0)
    indicated_value: Optional[float] = Field(None, ge=0)
    extra_load_added: Optional[float] = Field(None, ge=0)
    zero_indicated: Optional[float] = None
    tare_applied: Optional[float] = Field(None, ge=0)
    position_label: Optional[str] = None
    notes: Optional[str] = None


class ObservationResponse(ObservationBase):
    id: int
    instance_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
