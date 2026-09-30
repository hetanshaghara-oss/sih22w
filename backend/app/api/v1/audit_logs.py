from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.schemas.audit_log import PaginatedAuditLogs, AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Trail"])


@router.get("", response_model=PaginatedAuditLogs)
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by action, reference number, or details"),
    action: Optional[str] = Query(None, description="Filter by action name"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    user_id: Optional[int] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
):
    query = db.query(AuditLog).options(joinedload(AuditLog.user))

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AuditLog.action.ilike(s),
                AuditLog.reference_number.ilike(s),
                AuditLog.entity_type.ilike(s),
                AuditLog.details_json.ilike(s),
            )
        )

    if action:
        query = query.filter(AuditLog.action == action)

    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    if date_from:
        query = query.filter(AuditLog.created_at >= date_from)

    if date_to:
        query = query.filter(AuditLog.created_at <= date_to)

    total = query.count()
    items = (
        query.order_by(desc(AuditLog.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/actions/list", response_model=List[str])
def list_distinct_actions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    results = db.query(AuditLog.action).distinct().all()
    return [r[0] for r in results if r[0]]
