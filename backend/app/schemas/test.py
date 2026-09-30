from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.test import TestStatus, OverallVerdict
from app.schemas.instrument import InstrumentResponse
from app.schemas.user import UserResponse
from app.schemas.environmental_condition import EnvironmentalConditionResponse
from app.schemas.test_instance import TestInstanceResponse


class TestCreate(BaseModel):
    instrument_id: int
    laboratory_name: str = Field(default="National Metrology Calibration Laboratory", min_length=2, max_length=150)
    test_location: Optional[str] = Field(None, max_length=150)
    remarks: Optional[str] = None


class TestUpdate(BaseModel):
    laboratory_name: Optional[str] = Field(None, min_length=2, max_length=150)
    test_location: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[TestStatus] = None


class TestReviewInput(BaseModel):
    action: str = Field(..., description="'approve' or 'reject'")
    comments: Optional[str] = Field(None, description="Review remarks or rejection reason")


class TestSummaryResponse(BaseModel):
    id: int
    test_id: str
    instrument_id: int
    tester_id: int
    reviewer_id: Optional[int] = None
    laboratory_name: str
    test_location: Optional[str] = None
    status: TestStatus
    overall_verdict: OverallVerdict
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    instrument: Optional[InstrumentResponse] = None
    tester: Optional[UserResponse] = None
    reviewer: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class TestDetailResponse(TestSummaryResponse):
    remarks: Optional[str] = None
    reviewer_comments: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    environmental_condition: Optional[EnvironmentalConditionResponse] = None
    test_instances: List[TestInstanceResponse] = []

    class Config:
        from_attributes = True


class PaginatedTests(BaseModel):
    items: List[TestSummaryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
