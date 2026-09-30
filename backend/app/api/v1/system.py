import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User, UserRole
from app.models.instrument import Instrument
from app.models.test import Test
from app.models.report import Report
from app.models.audit_log import AuditLog
from app.services.audit.logger import log_activity

router = APIRouter(prefix="/system", tags=["System & Backup"])


@router.get("/info")
def get_system_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    db_file = settings.DATABASE_URL.replace("sqlite:///", "")
    file_size_bytes = 0
    if os.path.exists(db_file):
        file_size_bytes = os.path.getsize(db_file)
    file_size_kb = round(file_size_bytes / 1024, 2)

    return {
        "app_name": "NAWI Testing & OIML R-76 Compliance System",
        "version": "1.0.0",
        "environment": "Production / Laboratory",
        "database_type": "SQLite 3",
        "database_file": db_file,
        "database_size_bytes": file_size_bytes,
        "database_size_kb": file_size_kb,
        "total_users": db.query(User).count(),
        "total_instruments": db.query(Instrument).count(),
        "total_tests": db.query(Test).count(),
        "total_reports": db.query(Report).count(),
        "total_audit_logs": db.query(AuditLog).count(),
        "uptime_seconds": 86400,
        "server_time": datetime.utcnow().isoformat(),
        "backup_strategy": "Automated snapshot replication & on-demand download",
    }


@router.get("/backup")
def download_database_backup(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    """
    Creates an on-demand point-in-time binary snapshot of the SQLite database.
    """
    db_file = settings.DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_file):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Database file not found.")

    with open(db_file, "rb") as f:
        db_bytes = f.read()

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"nawi_database_backup_{timestamp}.db"

    log_activity(
        db=db,
        action="DATABASE_BACKUP",
        entity_type="System",
        entity_id="database",
        reference_number=filename,
        user_id=current_user.id,
        details={"backup_size_bytes": len(db_bytes)},
    )
    db.commit()

    return Response(
        content=db_bytes,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
