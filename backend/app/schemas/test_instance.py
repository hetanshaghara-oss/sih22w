from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.test_instance import InstanceStatus, InstanceVerdict
from app.schemas.test_definition import TestDefinitionResponse
from app.schemas.observation import ObservationResponse
from app.schemas.test_result import TestResultResponse


class TestInstanceBase(BaseModel):
    definition_id: int


class TestInstanceCreate(TestInstanceBase):
    test_id: int


class TestInstanceResponse(BaseModel):
    id: int
    test_id: int
    definition_id: int
    status: InstanceStatus
    verdict: InstanceVerdict
    is_outdated: bool
    evaluation_summary: Optional[str] = None
    evaluated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    definition: Optional[TestDefinitionResponse] = None
    observations: List[ObservationResponse] = []
    results: List[TestResultResponse] = []

    class Config:
        from_attributes = True
