import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class TestStatus(str, enum.Enum):
    DRAFT = "Draft"
    IN_PROGRESS = "In Progress"
    UNDER_REVIEW = "Under Review"
    COMPLETED = "Completed"
    FAILED = "Failed"


class OverallVerdict(str, enum.Enum):
    PENDING = "PENDING"
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW = "REVIEW"
    INCOMPLETE = "INCOMPLETE"


class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(String(50), unique=True, index=True, nullable=False)
    instrument_id = Column(Integer, ForeignKey("instruments.id", ondelete="CASCADE"), nullable=False, index=True)
    tester_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    laboratory_name = Column(String(150), nullable=False, default="National Metrology Calibration Laboratory")
    test_location = Column(String(150), nullable=True)
    remarks = Column(Text, nullable=True)
    reviewer_comments = Column(Text, nullable=True)

    status = Column(
        Enum(TestStatus, native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        default=TestStatus.DRAFT,
        nullable=False,
        index=True
    )
    overall_verdict = Column(
        Enum(OverallVerdict, native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        default=OverallVerdict.PENDING,
        nullable=False,
        index=True
    )

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    instrument = relationship("Instrument", backref="tests")
    tester = relationship("User", foreign_keys=[tester_id], backref="conducted_tests")
    reviewer = relationship("User", foreign_keys=[reviewer_id], backref="reviewed_tests")
    environmental_condition = relationship("EnvironmentalCondition", back_populates="test", uselist=False, cascade="all, delete-orphan")
    test_instances = relationship("TestInstance", back_populates="test", cascade="all, delete-orphan", order_by="TestInstance.id")
