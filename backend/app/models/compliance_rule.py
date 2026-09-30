from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.core.database import Base


class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, index=True, nullable=False)   # e.g. R76_REP_CLASS_I
    test_code = Column(String(50), index=True, nullable=False)               # e.g. OIML_REPEATABILITY
    accuracy_class = Column(String(50), index=True, nullable=False)          # Class I, Class II, Class III, Class IIII
    version = Column(String(50), default="OIML R 76-1:2006", nullable=False) # Configurable standard edition
    parameter_name = Column(String(100), nullable=False)                     # e.g. Max Range Error
    formula_type = Column(String(50), nullable=False)                        # e.g. MPE_TIER, MAX_DIFFERENCE, ECCENTRICITY_TOLERANCE

    # JSON formatted configuration containing limits or MPE breakdown
    criteria_json = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
