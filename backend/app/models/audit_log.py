from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # e.g. CREATE_TEST, UPDATE_OBSERVATION, APPROVE_TEST
    entity_type = Column(String(50), nullable=False)          # e.g. Test, Observation, EnvironmentalCondition
    entity_id = Column(String(50), nullable=False)
    reference_number = Column(String(100), nullable=True, index=True)
    ip_address = Column(String(50), nullable=True)
    details_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


    user = relationship("User")
