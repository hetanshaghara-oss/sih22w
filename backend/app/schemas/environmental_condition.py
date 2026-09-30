from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class EnvironmentalConditionBase(BaseModel):
    temperature_celsius: Optional[float] = Field(None, ge=-50, le=100, description="Ambient temperature in °C")
    relative_humidity_percent: Optional[float] = Field(None, ge=0, le=100, description="Relative humidity %")
    atmospheric_pressure_kpa: Optional[float] = Field(None, ge=50, le=150, description="Barometric pressure in kPa")
    test_location: Optional[str] = Field(None, max_length=150)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    reference_standards: Optional[str] = None
    remarks: Optional[str] = None


class EnvironmentalConditionCreate(EnvironmentalConditionBase):
    pass


class EnvironmentalConditionUpdate(EnvironmentalConditionBase):
    pass


class EnvironmentalConditionResponse(EnvironmentalConditionBase):
    id: int
    test_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
