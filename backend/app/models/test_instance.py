import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class InstanceStatus(str, enum.Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    EVALUATED = "Evaluated"


class InstanceVerdict(str, enum.Enum):
    PENDING = "PENDING"
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW = "REVIEW"
    INCOMPLETE = "INCOMPLETE"


class TestInstance(Base):
    __tablename__ = "test_instances"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False, index=True)
    definition_id = Column(Integer, ForeignKey("test_definitions.id"), nullable=False, index=True)

    status = Column(
        Enum(InstanceStatus, native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        default=InstanceStatus.PENDING,
        nullable=False
    )
    verdict = Column(
        Enum(InstanceVerdict, native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        default=InstanceVerdict.PENDING,
        nullable=False
    )

    is_outdated = Column(Boolean, default=False, nullable=False)
    evaluation_summary = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    test = relationship("Test", back_populates="test_instances")
    definition = relationship("TestDefinition")
    observations = relationship("Observation", back_populates="instance", cascade="all, delete-orphan", order_by="Observation.sequence_order")
    results = relationship("TestResult", back_populates="instance", cascade="all, delete-orphan")
