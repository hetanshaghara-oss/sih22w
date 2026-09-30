import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.test import Test, TestStatus
from app.models.test_instance import TestInstance, InstanceStatus, InstanceVerdict
from app.models.test_definition import TestDefinition
from app.models.observation import Observation
from app.models.test_result import TestResult
from app.models.audit_log import AuditLog
from app.schemas.test_instance import TestInstanceCreate, TestInstanceResponse
from app.schemas.observation import ObservationCreate, ObservationUpdate, ObservationResponse
from app.schemas.test_result import TestResultResponse
from app.services.compliance.engine import ComplianceEngine

router = APIRouter(prefix="/test-instances", tags=["Test Instances & Observations"])


def check_test_editable(test: Test):
    if test.status in (TestStatus.COMPLETED, TestStatus.FAILED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Test session is {test.status.value} and locked against modifications."
        )
    if test.status == TestStatus.UNDER_REVIEW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test is currently Under Review. Recall or reject to modify observations."
        )


@router.post("", response_model=TestInstanceResponse, status_code=status.HTTP_201_CREATED)
def add_test_instance(
    inst_in: TestInstanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    test = db.query(Test).filter(Test.id == inst_in.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test session not found.")
    check_test_editable(test)

    test_def = db.query(TestDefinition).filter(TestDefinition.id == inst_in.definition_id).first()
    if not test_def:
        raise HTTPException(status_code=404, detail="Test definition not found.")

    # Check if definition already attached to this test
    existing = db.query(TestInstance).filter(
        TestInstance.test_id == test.id,
        TestInstance.definition_id == test_def.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Test procedure '{test_def.name}' is already attached to this test session."
        )

    instance = TestInstance(
        test_id=test.id,
        definition_id=test_def.id,
        status=InstanceStatus.PENDING,
        verdict=InstanceVerdict.PENDING,
    )
    db.add(instance)

    if test.status == TestStatus.DRAFT:
        test.status = TestStatus.IN_PROGRESS

    db.commit()
    db.refresh(instance)
    return instance


@router.get("/{id}", response_model=TestInstanceResponse)
def get_test_instance(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    instance = db.query(TestInstance).filter(TestInstance.id == id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Test instance not found.")
    return instance


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test_instance(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    instance = db.query(TestInstance).filter(TestInstance.id == id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Test instance not found.")
    check_test_editable(instance.test)

    test = instance.test
    db.delete(instance)
    db.commit()
    ComplianceEngine.recalculate_test_overall_verdict(db, test)
    return None


# ---------------- Observation Operations ----------------

@router.post("/{id}/observations", response_model=ObservationResponse, status_code=status.HTTP_201_CREATED)
def add_observation(
    id: int,
    obs_in: ObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    instance = db.query(TestInstance).filter(TestInstance.id == id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Test instance not found.")
    check_test_editable(instance.test)

    # Next sequence order
    current_count = db.query(Observation).filter(Observation.instance_id == id).count()
    seq = obs_in.sequence_order if obs_in.sequence_order > current_count else current_count + 1

    obs = Observation(
        instance_id=instance.id,
        sequence_order=seq,
        load_point=obs_in.load_point,
        indicated_value=obs_in.indicated_value,
        extra_load_added=obs_in.extra_load_added,
        zero_indicated=obs_in.zero_indicated,
        tare_applied=obs_in.tare_applied,
        position_label=obs_in.position_label,
        notes=obs_in.notes,
    )
    db.add(obs)

    # If instance was already evaluated, mark results outdated
    if instance.status == InstanceStatus.EVALUATED:
        instance.is_outdated = True
        instance.verdict = InstanceVerdict.PENDING

    if instance.test.status == TestStatus.DRAFT:
        instance.test.status = TestStatus.IN_PROGRESS

    db.commit()
    db.refresh(obs)
    return obs


@router.put("/{id}/observations/{obs_id}", response_model=ObservationResponse)
def update_observation(
    id: int,
    obs_id: int,
    obs_in: ObservationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    instance = db.query(TestInstance).filter(TestInstance.id == id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Test instance not found.")
    check_test_editable(instance.test)

    obs = db.query(Observation).filter(Observation.id == obs_id, Observation.instance_id == id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation record not found.")

    update_data = obs_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(obs, field, val)

    # Invalidate previous evaluation if data changed
    instance.is_outdated = True
    instance.verdict = InstanceVerdict.PENDING

    # Record audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_OBSERVATION",
        entity_type="Observation",
        entity_id=str(obs.id),
        details_json=json.dumps({"instance_id": instance.id, "changes": update_data}),
    )
    db.add(audit)

    db.commit()
    db.refresh(obs)
    return obs


@router.delete("/{id}/observations/{obs_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_observation(
    id: int,
    obs_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    instance = db.query(TestInstance).filter(TestInstance.id == id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Test instance not found.")
    check_test_editable(instance.test)

    obs = db.query(Observation).filter(Observation.id == obs_id, Observation.instance_id == id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation record not found.")

    db.delete(obs)
    instance.is_outdated = True
    instance.verdict = InstanceVerdict.PENDING

    db.commit()
    return None


# ---------------- Compliance Evaluation ----------------

@router.post("/{id}/evaluate", response_model=TestResultResponse)
def evaluate_instance(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    instance = db.query(TestInstance).filter(TestInstance.id == id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Test instance not found.")
    check_test_editable(instance.test)

    result = ComplianceEngine.evaluate_test_instance(db, instance)

    # Record evaluation audit
    audit = AuditLog(
        user_id=current_user.id,
        action="EVALUATE_TEST_INSTANCE",
        entity_type="TestInstance",
        entity_id=str(instance.id),
        details_json=json.dumps({
            "definition": instance.definition.code,
            "verdict": result.verdict,
            "rule_version": result.rule_version
        }),
    )
    db.add(audit)
    db.commit()

    return result


@router.get("/{id}/results", response_model=Optional[TestResultResponse])
def get_instance_results(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.query(TestResult).filter(TestResult.instance_id == id).first()
    if not result:
        return None
    return result
