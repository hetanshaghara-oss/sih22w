from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.compliance_rule import ComplianceRule
from app.schemas.compliance_rule import ComplianceRuleCreate, ComplianceRuleUpdate, ComplianceRuleResponse

router = APIRouter(prefix="/compliance-rules", tags=["Compliance Rules"])


@router.get("", response_model=List[ComplianceRuleResponse])
def list_compliance_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(ComplianceRule).order_by(ComplianceRule.id).all()


@router.get("/{rule_id}", response_model=ComplianceRuleResponse)
def get_compliance_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compliance rule not found")
    return rule


@router.post("", response_model=ComplianceRuleResponse, status_code=status.HTTP_201_CREATED)
def create_compliance_rule(
    rule_in: ComplianceRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    existing = db.query(ComplianceRule).filter(ComplianceRule.rule_code == rule_in.rule_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Compliance rule code '{rule_in.rule_code}' already exists."
        )

    rule = ComplianceRule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=ComplianceRuleResponse)
def update_compliance_rule(
    rule_id: int,
    rule_in: ComplianceRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    rule = db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compliance rule not found")

    update_data = rule_in.model_dump(exclude_unset=True)
    if "rule_code" in update_data and update_data["rule_code"] != rule.rule_code:
        conflict = db.query(ComplianceRule).filter(
            ComplianceRule.rule_code == update_data["rule_code"],
            ComplianceRule.id != rule_id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Compliance rule code '{update_data['rule_code']}' already exists."
            )

    for field, val in update_data.items():
        setattr(rule, field, val)

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_200_OK)
def delete_compliance_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    rule = db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compliance rule not found")

    db.delete(rule)
    db.commit()
    return {"message": f"Rule {rule.rule_code} deleted successfully"}

