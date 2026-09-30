import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from app.core.database import Base


class InstrumentStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    UNDER_TESTING = "Under Testing"


class InstrumentAccuracyClass(str, enum.Enum):
    CLASS_I = "Class I"
    CLASS_II = "Class II"
    CLASS_III = "Class III"
    CLASS_IIII = "Class IIII"


class Instrument(Base):
    __tablename__ = "instruments"

    id = Column(Integer, primary_key=True, index=True)
    instrument_id = Column(String(50), unique=True, index=True, nullable=False)
    manufacturer = Column(String(150), nullable=False, index=True)
    model = Column(String(100), nullable=False)
    serial_number = Column(String(100), nullable=False, index=True)
    instrument_type = Column(String(100), nullable=False)
    instrument_class = Column(String(50), nullable=False)
    maximum_capacity = Column(Float, nullable=False)
    minimum_capacity = Column(Float, nullable=False)
    verification_scale_interval = Column(Float, nullable=False)  # 'e'
    accuracy_class = Column(String(50), nullable=False)
    country_of_manufacture = Column(String(100), nullable=False)
    status = Column(
        Enum(InstrumentStatus, native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        default=InstrumentStatus.ACTIVE,
        nullable=False,
        index=True
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
