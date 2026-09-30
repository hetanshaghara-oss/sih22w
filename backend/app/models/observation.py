from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(Integer, ForeignKey("test_instances.id", ondelete="CASCADE"), nullable=False, index=True)

    sequence_order = Column(Integer, default=1, nullable=False)
    load_point = Column(Float, nullable=False)                         # Applied load L (e.g. kg or g)
    indicated_value = Column(Float, nullable=False)                    # Indicated reading I
    extra_load_added = Column(Float, default=0.0, nullable=False)       # Delta L added until turning point
    zero_indicated = Column(Float, default=0.0, nullable=False)        # Zero reading before load
    tare_applied = Column(Float, default=0.0, nullable=False)          # Tare load if tare test
    position_label = Column(String(50), nullable=True)                 # Center, Pos 1, Pos 2... for eccentricity
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    instance = relationship("TestInstance", back_populates="observations")
