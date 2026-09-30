import math
import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.instrument import Instrument
from app.models.test import Test, TestStatus, OverallVerdict
from app.models.environmental_condition import EnvironmentalCondition
from app.models.test_instance import TestInstance, InstanceVerdict
from app.models.audit_log import AuditLog
from app.schemas.test import (
    TestCreate,
    TestUpdate,
    TestReviewInput,
    TestSummaryResponse,
    TestDetailResponse,
    PaginatedTests,
)
from app.schemas.environmental_condition import (
    EnvironmentalConditionCreate,
    EnvironmentalConditionUpdate,
    EnvironmentalConditionResponse,
)
from app.services.compliance.engine import ComplianceEngine
from app.services.audit.logger import log_activity

router = APIRouter(prefix="/tests", tags=["Tests Management"])


def generate_unique_test_id(db: Session) -> str:
    """Generates an incremental unique Test ID: TEST-YYYY-XXXX"""
    year = datetime.now().year
    prefix = f"TEST-{year}-"
    last_test = (
        db.query(Test)
        .filter(Test.test_id.like(f"{prefix}%"))
        .order_by(desc(Test.id))
        .first()
    )
    if not last_test:
        seq = 1
    else:
        try:
            seq = int(last_test.test_id.replace(prefix, "")) + 1
        except Exception:
            seq = db.query(Test).count() + 1
    return f"{prefix}{seq:04d}"


@router.post("", response_model=TestDetailResponse, status_code=status.HTTP_201_CREATED)
def create_test(
    test_in: TestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.TESTER])),
):
    instrument = db.query(Instrument).filter(Instrument.id == test_in.instrument_id).first()
    if not instrument:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced instrument does not exist."
        )

    test_id = generate_unique_test_id(db)

    test = Test(
        test_id=test_id,
        instrument_id=instrument.id,
        tester_id=current_user.id,
        laboratory_name=test_in.laboratory_name.strip(),
        test_location=test_in.test_location.strip() if test_in.test_location else None,
        remarks=test_in.remarks,
        status=TestStatus.DRAFT,
        overall_verdict=OverallVerdict.PENDING,
        started_at=datetime.now(timezone.utc),
    )
    db.add(test)
    db.flush()

    # Create empty default environmental conditions entry
    env = EnvironmentalCondition(test_id=test.id, test_location=test.test_location)
    db.add(env)

    # Standardized Audit log
    log_activity(
        db,
        action="CREATE_TEST",
        entity_type="test",
        entity_id=test.id,
        user_id=current_user.id,
        reference_number=test.test_id,
        details={
            "test_id": test_id,
            "instrument_id": instrument.id,
            "instrument_code": instrument.instrument_id,
            "laboratory": test.laboratory_name,
        }
    )

    db.commit()
    db.refresh(test)
    return test


@router.get("", response_model=PaginatedTests)
def list_tests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None, description="Search by Test ID, lab name, or instrument"),
    status: Optional[str] = Query(None, description="Filter by test status"),
    verdict: Optional[str] = Query(None, description="Filter by overall verdict"),
    instrument_id: Optional[int] = Query(None),
    manufacturer: Optional[str] = Query(None),
    serial_number: Optional[str] = Query(None),
    tester_id: Optional[int] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
):
    query = db.query(Test).join(Instrument)

    if search:
        s_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Test.test_id.ilike(s_fmt),
                Test.laboratory_name.ilike(s_fmt),
                Instrument.instrument_id.ilike(s_fmt),
                Instrument.model.ilike(s_fmt),
                Instrument.manufacturer.ilike(s_fmt),
                Instrument.serial_number.ilike(s_fmt),
            )
        )

    if status:
        query = query.filter(Test.status == status)

    if verdict:
        query = query.filter(Test.overall_verdict == verdict)

    if instrument_id:
        query = query.filter(Test.instrument_id == instrument_id)

    if isinstance(manufacturer, str) and manufacturer.strip():
        query = query.filter(Instrument.manufacturer.ilike(f"%{manufacturer.strip()}%"))

    if isinstance(serial_number, str) and serial_number.strip():
        query = query.filter(Instrument.serial_number.ilike(f"%{serial_number.strip()}%"))

    if isinstance(tester_id, int):
        query = query.filter(Test.tester_id == tester_id)

    if isinstance(date_from, datetime):
        query = query.filter(Test.created_at >= date_from)

    if isinstance(date_to, datetime):
        query = query.filter(Test.created_at <= date_to)

    total = query.count()

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    sort_col = getattr(Test, sort_by, Test.created_at)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedTests(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/history", response_model=PaginatedTests)
def test_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    verdict: Optional[str] = Query(None),
    instrument_id: Optional[int] = Query(None),
    manufacturer: Optional[str] = Query(None),
    serial_number: Optional[str] = Query(None),
    tester_id: Optional[int] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    """Specialized historical audit endpoint for tests."""
    return list_tests(
        db=db,
        current_user=current_user,
        search=search,
        status=status,
        verdict=verdict,
        instrument_id=instrument_id,
        manufacturer=manufacturer,
        serial_number=serial_number,
        tester_id=tester_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
        sort_by="updated_at",
        sort_order="desc",
    )


@router.get("/{id}", response_model=TestDetailResponse)
def get_test(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    test = db.query(Test).filter(Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test record not found.")
    return test


@router.put("/{id}", response_model=TestDetailResponse)
def update_test(
    id: int,
    test_in: TestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    test = db.query(Test).filter(Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test record not found.")

    if test.status in (TestStatus.COMPLETED, TestStatus.FAILED):
        raise HTTPException(
            status_code=400,
            detail=f"This test session has been finalized as {test.status.value} and cannot be modified."
        )

    update_data = test_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(test, field, val)

    db.commit()
    db.refresh(test)
    return test


# ---------------- Environmental Conditions ----------------

@router.post("/{id}/environment", response_model=EnvironmentalConditionResponse)
def set_environmental_conditions(
    id: int,
    env_in: EnvironmentalConditionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    test = db.query(Test).filter(Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test record not found.")

    if test.status in (TestStatus.COMPLETED, TestStatus.FAILED):
        raise HTTPException(status_code=400, detail="Test is finalized and locked.")

    env = db.query(EnvironmentalCondition).filter(EnvironmentalCondition.test_id == id).first()
    if not env:
        env = EnvironmentalCondition(test_id=id, **env_in.model_dump())
        db.add(env)
    else:
        for field, val in env_in.model_dump(exclude_unset=True).items():
            setattr(env, field, val)

    if test.status == TestStatus.DRAFT:
        test.status = TestStatus.IN_PROGRESS

    db.commit()
    db.refresh(env)
    return env


@router.get("/{id}/environment", response_model=Optional[EnvironmentalConditionResponse])
def get_environmental_conditions(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    env = db.query(EnvironmentalCondition).filter(EnvironmentalCondition.test_id == id).first()
    return env


# ---------------- Reviewer Workflow ----------------

@router.post("/{id}/submit-review", response_model=TestDetailResponse)
def submit_for_review(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.TESTER])),
):
    test = db.query(Test).filter(Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test record not found.")

    if not test.test_instances or len(test.test_instances) == 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot submit test for review without any test procedures attached."
        )

    # Check if all instances have been evaluated
    unevaluated = [i for i in test.test_instances if i.is_outdated or i.verdict == InstanceVerdict.PENDING]
    if unevaluated:
        raise HTTPException(
            status_code=400,
            detail=f"{len(unevaluated)} test procedure(s) are unevaluated or have outdated observations. Please evaluate all procedures before submitting."
        )

    test.status = TestStatus.UNDER_REVIEW
    ComplianceEngine.recalculate_test_overall_verdict(db, test)

    # Audit
    log_activity(
        db,
        action="SUBMIT_FOR_REVIEW",
        entity_type="test",
        entity_id=test.id,
        user_id=current_user.id,
        reference_number=test.test_id,
        details={"test_id": test.test_id, "verdict": test.overall_verdict.value}
    )

    db.commit()
    db.refresh(test)
    return test


@router.post("/{id}/review", response_model=TestDetailResponse)
def review_test(
    id: int,
    review_in: TestReviewInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.REVIEWER, UserRole.ADMIN])),
):
    test = db.query(Test).filter(Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test record not found.")

    if test.status != TestStatus.UNDER_REVIEW:
        raise HTTPException(
            status_code=400,
            detail=f"Test is currently in '{test.status.value}' state. Only tests 'Under Review' can be reviewed."
        )

    action = review_in.action.lower().strip()
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'.")

    test.reviewer_id = current_user.id
    test.reviewer_comments = review_in.comments
    test.reviewed_at = datetime.now(timezone.utc)

    if action == "approve":
        test.status = TestStatus.COMPLETED
        test.completed_at = datetime.now(timezone.utc)
    else:
        test.status = TestStatus.FAILED

    # Audit
    log_activity(
        db,
        action=f"REVIEW_{action.upper()}",
        entity_type="test",
        entity_id=test.id,
        user_id=current_user.id,
        reference_number=test.test_id,
        details={
            "test_id": test.test_id,
            "action": action,
            "comments": review_in.comments,
            "overall_verdict": test.overall_verdict.value
        }
    )

    db.commit()
    db.refresh(test)
    return test


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    test = db.query(Test).filter(Test.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test record not found.")

    # Accidental deletion protection: Completed or Under Review tests are protected
    if test.status in (TestStatus.COMPLETED, TestStatus.UNDER_REVIEW):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete test '{test.test_id}' in '{test.status.value}' state. Metrological records under review or completed are legally protected."
        )

    test_id_ref = test.test_id
    status_val = test.status.value

    db.delete(test)
    db.commit()

    log_activity(
        db,
        action="DELETE_TEST",
        entity_type="test",
        entity_id=id,
        user_id=current_user.id,
        reference_number=test_id_ref,
        details={"status": status_val}
    )
    db.commit()

    return None
