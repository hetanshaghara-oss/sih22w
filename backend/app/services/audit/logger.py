import json
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_activity(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Any,
    user_id: Optional[int] = None,
    reference_number: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> Optional[AuditLog]:
    """
    Records a high-integrity audit log entry for regulatory compliance and traceability.
    """
    try:
        details_str = json.dumps(details, default=str) if details else None
        audit = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            reference_number=reference_number,
            ip_address=ip_address,
            details_json=details_str
        )
        db.add(audit)
        db.flush()
        return audit
    except Exception as e:
        print(f"Warning: Audit logging failed: {e}")
        return None
