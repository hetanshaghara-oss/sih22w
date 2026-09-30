from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(50), unique=True, index=True, nullable=False)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    certificate_title = Column(
        String(255),
        default="OIML R 76-1 TEST REPORT FOR NON-AUTOMATIC WEIGHING INSTRUMENTS",
        nullable=False
    )
    overall_verdict = Column(String(20), nullable=False)  # PASS, FAIL
    
    issued_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    authorized_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    report_data_json = Column(Text, nullable=False)        # Comprehensive frozen snapshot
    summary_remarks = Column(Text, nullable=True)
    checksum_hash = Column(String(64), nullable=False)     # SHA-256 tamper-evident hash
    file_path = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    test = relationship("Test", backref="reports")
    issued_by = relationship("User", foreign_keys=[issued_by_id])
    authorized_by = relationship("User", foreign_keys=[authorized_by_id])
