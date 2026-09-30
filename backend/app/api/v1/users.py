from typing import List, Optional
import math
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse, PaginatedUsers
from app.services.audit.logger import log_activity

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("", response_model=PaginatedUsers)
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    query = db.query(User)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(User.name.ilike(s), User.email.ilike(s)))

    if role:
        query = query.filter(User.role == role)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.order_by(User.id.asc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedUsers(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = User(
        name=user_in.name.strip(),
        email=user_in.email.lower().strip(),
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=user_in.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_activity(
        db=db,
        action="CREATE_USER",
        entity_type="User",
        entity_id=user.id,
        reference_number=user.email,
        user_id=current_user.id,
        details={"name": user.name, "email": user.email, "role": user.role.value},
        ip_address=request.client.host if request.client else None,
    )
    db.commit()

    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_dict = user_in.model_dump(exclude_unset=True)

    if "email" in update_dict and update_dict["email"]:
        new_email = update_dict["email"].lower().strip()
        if new_email != user.email:
            existing = db.query(User).filter(User.email == new_email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A user with this email address already exists.",
                )
            user.email = new_email

    if "name" in update_dict and update_dict["name"]:
        user.name = update_dict["name"].strip()

    if "role" in update_dict and update_dict["role"]:
        user.role = update_dict["role"]

    if "is_active" in update_dict and update_dict["is_active"] is not None:
        # Prevent admin deactivating own account
        if user.id == current_user.id and not update_dict["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators cannot deactivate their own account.",
            )
        user.is_active = update_dict["is_active"]

    if "password" in update_dict and update_dict["password"]:
        user.password_hash = get_password_hash(update_dict["password"])

    db.commit()
    db.refresh(user)

    log_activity(
        db=db,
        action="UPDATE_USER",
        entity_type="User",
        entity_id=user.id,
        reference_number=user.email,
        user_id=current_user.id,
        details={"updated_fields": list(update_dict.keys()), "role": user.role.value, "is_active": user.is_active},
        ip_address=request.client.host if request.client else None,
    )
    db.commit()

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot delete their own account.",
        )

    user_email = user.email
    db.delete(user)
    db.commit()

    log_activity(
        db=db,
        action="DELETE_USER",
        entity_type="User",
        entity_id=user_id,
        reference_number=user_email,
        user_id=current_user.id,
        details={"deleted_email": user_email},
        ip_address=request.client.host if request.client else None,
    )
    db.commit()

    return None
