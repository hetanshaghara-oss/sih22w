from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class TestResultResponse(BaseModel):
    id: int
    instance_id: int
    rule_id: Optional[int] = None
    rule_version: str
    applicable_rule_code: Optional[str] = None
    calculated_values_json: str
    allowable_limit_description: str
    verdict: str
    explanation: str
    evaluated_at: datetime

    class Config:
        from_attributes = True
