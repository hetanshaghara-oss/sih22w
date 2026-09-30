from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.instrument import InstrumentResponse


class DashboardSummary(BaseModel):
    total_instruments: int
    active_instruments: int
    tests_in_progress: int = 0
    completed_tests: int = 0
    tests_pending_review: int = 0
    pass_count: int = 0
    fail_count: int = 0
    reports_generated: int = 0



class ActivityItem(BaseModel):
    id: str
    type: str  # "instrument", "test", "report"
    title: str
    description: str
    timestamp: datetime
    status: Optional[str] = None
    badge_variant: Optional[str] = "blue"


class DashboardData(BaseModel):
    summary: DashboardSummary
    recent_activity: List[ActivityItem]
