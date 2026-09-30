from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.instrument import Instrument, InstrumentStatus
from app.models.test import Test, TestStatus, OverallVerdict
from app.models.report import Report
from app.models.audit_log import AuditLog
from app.schemas.dashboard import DashboardData, DashboardSummary, ActivityItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardData)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_instruments = db.query(Instrument).count()
    active_instruments = db.query(Instrument).filter(Instrument.status == InstrumentStatus.ACTIVE).count()
    tests_in_progress = db.query(Test).filter(Test.status == TestStatus.IN_PROGRESS).count()
    tests_pending_review = db.query(Test).filter(Test.status == TestStatus.UNDER_REVIEW).count()
    completed_tests = db.query(Test).filter(Test.status == TestStatus.COMPLETED).count()
    pass_count = db.query(Test).filter(Test.overall_verdict == OverallVerdict.PASS).count()
    fail_count = db.query(Test).filter(Test.overall_verdict == OverallVerdict.FAIL).count()
    reports_generated = db.query(Report).count()

    summary = DashboardSummary(
        total_instruments=total_instruments,
        active_instruments=active_instruments,
        tests_in_progress=tests_in_progress,
        completed_tests=completed_tests,
        tests_pending_review=tests_pending_review,
        pass_count=pass_count,
        fail_count=fail_count,
        reports_generated=reports_generated,
    )

    activities = []


    # Recent tests
    recent_tests = (
        db.query(Test)
        .order_by(desc(Test.updated_at))
        .limit(4)
        .all()
    )
    for t in recent_tests:
        activities.append(
            ActivityItem(
                id=f"test-{t.id}",
                type="test",
                title=f"Test Session {t.test_id} [{t.overall_verdict.value}]",
                description=f"Status: {t.status.value} - Instrument: {t.instrument.instrument_id} ({t.instrument.manufacturer} {t.instrument.model})",
                timestamp=t.updated_at,
                status=t.status.value,
                badge_variant="green" if t.status == TestStatus.COMPLETED else ("yellow" if t.status == TestStatus.UNDER_REVIEW else "blue"),
            )
        )

    # Recent instruments
    recent_instruments = (
        db.query(Instrument)
        .order_by(desc(Instrument.created_at))
        .limit(3)
        .all()
    )
    for inst in recent_instruments:
        activities.append(
            ActivityItem(
                id=f"inst-{inst.id}",
                type="instrument",
                title=f"Instrument Registered: {inst.instrument_id}",
                description=f"{inst.manufacturer} {inst.model} (Max: {inst.maximum_capacity} kg, e={inst.verification_scale_interval} g)",
                timestamp=inst.created_at,
                status=inst.status.value,
                badge_variant="green" if inst.status == InstrumentStatus.ACTIVE else "yellow",
            )
        )

    # Sort combined activity chronologically
    activities.sort(key=lambda a: a.timestamp, reverse=True)

    return DashboardData(summary=summary, recent_activity=activities[:6])


@router.get("/compliance-engine-status")
def get_engine_status(current_user: User = Depends(get_current_user)):
    return {
        "status": "Active (Phase 2 & Phase 3)",
        "message": "Configurable OIML R 76 Compliance Engine is operational.",
        "version": "1.0.0-phase3-configured",
        "supported_rules": "Repeatability (A.4.4), Eccentricity (A.4.7), Weighing Performance (A.4.4.1), Tare (A.4.6)"
    }
