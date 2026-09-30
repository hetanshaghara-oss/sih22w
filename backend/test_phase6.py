import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, get_db
from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.models.instrument import Instrument
from app.models.test import Test, TestStatus, OverallVerdict
from app.models.audit_log import AuditLog

client = TestClient(app)

@pytest.fixture(scope="module")
def admin_token():
    # Admin login or direct token
    db = next(get_db())
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if not admin:
        from app.core.security import get_password_hash
        admin = User(
            name="Admin Tester",
            email="admin_test@nawi.org",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    return create_access_token(subject=admin.id, role=admin.role.value)


@pytest.fixture(scope="module")
def tester_token():
    db = next(get_db())
    tester = db.query(User).filter(User.role == UserRole.TESTER).first()
    if not tester:
        from app.core.security import get_password_hash
        tester = User(
            name="Lab Tester",
            email="tester_test@nawi.org",
            password_hash=get_password_hash("tester123"),
            role=UserRole.TESTER,
            is_active=True
        )
        db.add(tester)
        db.commit()
        db.refresh(tester)
    return create_access_token(subject=tester.id, role=tester.role.value)


@pytest.fixture(scope="module")
def viewer_token():
    db = next(get_db())
    viewer = db.query(User).filter(User.role == UserRole.VIEWER).first()
    if not viewer:
        from app.core.security import get_password_hash
        viewer = User(
            name="Auditor Viewer",
            email="viewer_test@nawi.org",
            password_hash=get_password_hash("viewer123"),
            role=UserRole.VIEWER,
            is_active=True
        )
        db.add(viewer)
        db.commit()
        db.refresh(viewer)
    return create_access_token(subject=viewer.id, role=viewer.role.value)


def test_user_crud_and_rbac(admin_token, viewer_token):
    # 1. Admin can list users
    res = client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 1

    # 2. Admin creates a new user
    import uuid
    rand_email = f"user_{uuid.uuid4().hex[:6]}@nawi.org"
    res = client.post(
        "/api/users",
        json={
            "name": "Quality Inspector",
            "email": rand_email,
            "password": "Password123!",
            "role": "viewer",
            "is_active": True
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 201
    new_user = res.json()
    assert new_user["email"] == rand_email
    assert new_user["role"] == "viewer"
    user_id = new_user["id"]

    # 3. Admin updates user
    res = client.put(
        f"/api/users/{user_id}",
        json={"name": "Senior Quality Inspector", "role": "reviewer"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    assert res.json()["name"] == "Senior Quality Inspector"
    assert res.json()["role"] == "reviewer"

    # 4. Viewer cannot create users (RBAC check)
    res = client.post(
        "/api/users",
        json={"name": "Hacker", "email": "hacker@evil.com", "password": "pass", "role": "admin"},
        headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert res.status_code == 403

    # 5. Admin can delete user
    res = client.delete(f"/api/users/{user_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 204


def test_instrument_deletion_protection(admin_token, tester_token):
    import uuid
    code = f"PROT-{uuid.uuid4().hex[:6].upper()}"
    # 1. Create instrument
    res = client.post(
        "/api/instruments",
        json={
            "instrument_id": code,
            "manufacturer": "Protection Test Mfg",
            "model": "Prot-500",
            "serial_number": f"SN-{code}",
            "instrument_type": "Electronic Balance",
            "instrument_class": "Class II",
            "maximum_capacity": 500.0,
            "minimum_capacity": 0.5,
            "verification_scale_interval": 0.01,
            "accuracy_class": "Class II",
            "country_of_manufacture": "Switzerland",
            "status": "Active"
        },
        headers={"Authorization": f"Bearer {tester_token}"}
    )
    assert res.status_code == 201
    inst = res.json()
    inst_id = inst["id"]

    # 2. Create test linked to instrument
    res = client.post(
        "/api/tests",
        json={
            "instrument_id": inst_id,
            "laboratory_name": "Zurich Metrology Lab",
            "remarks": "Accidental deletion test"
        },
        headers={"Authorization": f"Bearer {tester_token}"}
    )
    assert res.status_code == 201
    test_data = res.json()
    test_id = test_data["id"]

    # 3. Attempting to delete the instrument should FAIL (400 Bad Request) due to linked test
    res = client.delete(f"/api/instruments/{inst_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 400
    assert "associated test record" in res.json()["detail"].lower()

    # 4. Delete the test draft first
    res = client.delete(f"/api/tests/{test_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 204

    # 5. Now delete the instrument should SUCCEED
    res = client.delete(f"/api/instruments/{inst_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 204


def test_viewer_role_boundaries(viewer_token):
    # Viewer cannot create an instrument (403)
    res = client.post(
        "/api/instruments",
        json={
            "instrument_id": "VIEWER-FAIL",
            "manufacturer": "Test",
            "model": "Test",
            "serial_number": "123",
            "instrument_type": "Test",
            "instrument_class": "Class III",
            "maximum_capacity": 100,
            "minimum_capacity": 1,
            "verification_scale_interval": 0.1,
            "accuracy_class": "Class III",
            "country_of_manufacture": "Test",
            "status": "Active"
        },
        headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert res.status_code == 403

    # Viewer CAN view instruments (200)
    res = client.get("/api/instruments", headers={"Authorization": f"Bearer {viewer_token}"})
    assert res.status_code == 200

    # Viewer CAN view test history (200)
    res = client.get("/api/tests/history", headers={"Authorization": f"Bearer {viewer_token}"})
    assert res.status_code == 200


def test_system_info_and_backup(admin_token, viewer_token):
    # 1. System Info endpoint
    res = client.get("/api/system/info", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    info = res.json()
    assert "database_size_bytes" in info
    assert "total_users" in info
    assert "total_instruments" in info
    assert info["total_audit_logs"] >= 1

    # 2. Database backup endpoint
    res = client.get("/api/system/backup", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/octet-stream"
    assert len(res.content) > 0

    # 3. Viewer cannot download database backup (403)
    res = client.get("/api/system/backup", headers={"Authorization": f"Bearer {viewer_token}"})
    assert res.status_code == 403


def test_audit_logs_and_dashboard_metrics(admin_token):
    # 1. Audit logs list
    res = client.get("/api/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    logs = res.json()
    assert "items" in logs
    assert logs["total"] >= 1

    # 2. Audit logs actions list
    res = client.get("/api/audit-logs/actions/list", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    actions = res.json()
    assert isinstance(actions, list)

    # 3. Dashboard metrics
    res = client.get("/api/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    dash = res.json()
    summary = dash["summary"]
    assert "total_instruments" in summary
    assert "tests_pending_review" in summary
    assert "pass_count" in summary
    assert "fail_count" in summary
    assert "reports_generated" in summary
