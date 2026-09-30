from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(Integer, ForeignKey("test_instances.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(Integer, ForeignKey("compliance_rules.id", ondelete="SET NULL"), nullable=True)

    rule_version = Column(String(50), nullable=False)                         # Tagged rule edition
    applicable_rule_code = Column(String(50), nullable=True)                  # Code of the applied rule
    calculated_values_json = Column(Text, nullable=False)                     # JSON of calculated values (P, E, Ec...)
    allowable_limit_description = Column(String(255), nullable=False)          # Human-readable limit text
    verdict = Column(String(20), nullable=False)                              # PASS, FAIL, REVIEW, INCOMPLETE
    explanation = Column(Text, nullable=False)                                # Detailed compliance reason

    evaluated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    instance = relationship("TestInstance", back_populates="results")
    rule = relationship("ComplianceRule")
