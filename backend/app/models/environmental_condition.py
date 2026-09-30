from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class EnvironmentalCondition(Base):
    __tablename__ = "environmental_conditions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    temperature_celsius = Column(Float, nullable=True)
    relative_humidity_percent = Column(Float, nullable=True)
    atmospheric_pressure_kpa = Column(Float, nullable=True)
    test_location = Column(String(150), nullable=True)

    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)

    reference_standards = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    test = relationship("Test", back_populates="environmental_condition")
