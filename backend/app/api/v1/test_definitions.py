from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.test_definition import TestDefinition
from app.schemas.test_definition import TestDefinitionCreate, TestDefinitionResponse

router = APIRouter(prefix="/test-definitions", tags=["Test Definitions"])


@router.get("", response_model=List[TestDefinitionResponse])
def list_test_definitions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(TestDefinition).filter(TestDefinition.is_active == True).order_by(TestDefinition.id).all()


@router.post("", response_model=TestDefinitionResponse, status_code=status.HTTP_201_CREATED)
def create_test_definition(
    def_in: TestDefinitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    existing = db.query(TestDefinition).filter(TestDefinition.code == def_in.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Test definition code '{def_in.code}' already exists."
        )

    test_def = TestDefinition(**def_in.model_dump())
    db.add(test_def)
    db.commit()
    db.refresh(test_def)
    return test_def
