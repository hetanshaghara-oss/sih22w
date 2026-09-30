from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.core.database import Base


class TestDefinition(Base):
    __tablename__ = "test_definitions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. OIML_REPEATABILITY
    name = Column(String(100), nullable=False)                         # e.g. Repeatability Test
    clause_reference = Column(String(50), nullable=False)              # e.g. OIML R 76-1 Clause A.4.4
    description = Column(Text, nullable=True)
    required_observations_count = Column(Integer, default=3, nullable=False)
    category = Column(String(50), default="Metrological Performance", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
