from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field


class ComplianceRuleBase(BaseModel):
    rule_code: str = Field(..., min_length=2, max_length=50)
    test_code: str = Field(..., min_length=2, max_length=50)
    accuracy_class: str = Field(..., min_length=2, max_length=50)
    version: str = Field(default="OIML R 76-1:2006")
    parameter_name: str = Field(..., min_length=2, max_length=100)
    formula_type: str = Field(..., min_length=2, max_length=50)
    criteria_json: str = Field(..., description="JSON encoded criteria structure")
    description: Optional[str] = None
    is_active: bool = True


class ComplianceRuleCreate(ComplianceRuleBase):
    pass


class ComplianceRuleUpdate(BaseModel):
    rule_code: Optional[str] = Field(None, min_length=2, max_length=50)
    test_code: Optional[str] = Field(None, min_length=2, max_length=50)
    accuracy_class: Optional[str] = Field(None, min_length=2, max_length=50)
    version: Optional[str] = None
    parameter_name: Optional[str] = Field(None, min_length=2, max_length=100)
    formula_type: Optional[str] = Field(None, min_length=2, max_length=50)
    criteria_json: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ComplianceRuleResponse(ComplianceRuleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

