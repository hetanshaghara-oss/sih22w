from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse
from app.schemas.test import TestSummaryResponse


class ReportCreate(BaseModel):
    test_id: int
    summary_remarks: Optional[str] = None


class ReportSummaryResponse(BaseModel):
    id: int
    report_number: str
    test_id: int
    certificate_title: str
    overall_verdict: str
    issued_by_id: int
    authorized_by_id: Optional[int] = None
    checksum_hash: str
    created_at: datetime

    issued_by: Optional[UserResponse] = None
    authorized_by: Optional[UserResponse] = None
    test: Optional[TestSummaryResponse] = None

    class Config:
        from_attributes = True


class ReportDetailResponse(ReportSummaryResponse):
    report_data_json: str
    summary_remarks: Optional[str] = None
    file_path: Optional[str] = None

    class Config:
        from_attributes = True


class PaginatedReports(BaseModel):
    items: List[ReportSummaryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
