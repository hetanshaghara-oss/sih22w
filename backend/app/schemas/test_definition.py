from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TestDefinitionBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    clause_reference: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None
    required_observations_count: int = Field(default=3, ge=1)
    category: str = Field(default="Metrological Performance")
    is_active: bool = True


class TestDefinitionCreate(TestDefinitionBase):
    pass


class TestDefinitionResponse(TestDefinitionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
