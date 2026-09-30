import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User, UserRole

client = TestClient(app)

@pytest.fixture(scope="module")
def admin_token():
    db = next(get_db())
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    return create_access_token(subject=admin.id, role=admin.role.value)

@pytest.fixture(scope="module")
def viewer_token():
    db = next(get_db())
    viewer = db.query(User).filter(User.role == UserRole.VIEWER).first()
    return create_access_token(subject=viewer.id, role=viewer.role.value)

@pytest.fixture(scope="module")
def tester_token():
    db = next(get_db())
    tester = db.query(User).filter(User.role == UserRole.TESTER).first()
    return create_access_token(subject=tester.id, role=tester.role.value)


def test_unauthenticated_requests_blocked():
    """Verify endpoints reject unauthenticated requests."""
    res = client.get("/api/instruments")
    assert res.status_code == 401

    res = client.get("/api/tests")
    assert res.status_code == 401

    res = client.get("/api/reports")
    assert res.status_code == 401

    res = client.get("/api/users")
    assert res.status_code == 401

    res = client.get("/api/audit-logs")
    assert res.status_code == 401


def test_malformed_and_fake_tokens_blocked():
    """Verify invalid JWT tokens are rejected."""
    bad_headers = {"Authorization": "Bearer not_a_valid_jwt_token"}
    res = client.get("/api/instruments", headers=bad_headers)
    assert res.status_code == 401

    fake_headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_signature"}
    res = client.get("/api/instruments", headers=fake_headers)
    assert res.status_code == 401


def test_rbac_privilege_escalation_prevented(viewer_token):
    """Verify Viewer role cannot perform mutations or access admin portals."""
    headers = {"Authorization": f"Bearer {viewer_token}"}

    # 1. Viewer cannot create instrument
    res = client.post(
        "/api/instruments",
        json={
            "instrument_id": "VIEWER-ILLEGAL-01",
            "manufacturer": "Bad",
            "model": "Bad",
            "serial_number": "123",
            "instrument_type": "Balance",
            "instrument_class": "Class II",
            "maximum_capacity": 100,
            "minimum_capacity": 1,
            "verification_scale_interval": 0.1,
            "accuracy_class": "Class II",
            "country_of_manufacture": "Bad",
            "status": "Active"
        },
        headers=headers
    )
    assert res.status_code == 403

    # 2. Viewer cannot create test
    res = client.post(
        "/api/tests",
        json={"instrument_id": 1, "laboratory_name": "Illegal"},
        headers=headers
    )
    assert res.status_code == 403

    # 3. Viewer cannot access user management
    res = client.get("/api/users", headers=headers)
    assert res.status_code == 403

    # 4. Viewer cannot access audit logs
    res = client.get("/api/audit-logs", headers=headers)
    assert res.status_code == 403

    # 5. Viewer cannot access system backup
    res = client.get("/api/system/backup", headers=headers)
    assert res.status_code == 403


def test_input_validation_and_duplicate_protection(tester_token):
    headers = {"Authorization": f"Bearer {tester_token}"}
    unique_code = f"DUP-{uuid.uuid4().hex[:6].upper()}"

    payload = {
        "instrument_id": unique_code,
        "manufacturer": "Sartorius",
        "model": "Secura 225D",
        "serial_number": f"SN-{unique_code}",
        "instrument_type": "Analytical Balance",
        "instrument_class": "Class I",
        "maximum_capacity": 220.0,
        "minimum_capacity": 0.001,
        "verification_scale_interval": 0.001,
        "accuracy_class": "Class I",
        "country_of_manufacture": "Germany",
        "status": "Active"
    }

    # 1. Create first time -> 201
    res1 = client.post("/api/instruments", json=payload, headers=headers)
    assert res1.status_code == 201
    created_id = res1.json()["id"]

    # 2. Attempt duplicate instrument_id -> 400
    res2 = client.post("/api/instruments", json=payload, headers=headers)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()

    # 3. Negative capacity / invalid values validation
    invalid_payload = dict(payload)
    invalid_payload["instrument_id"] = f"NEG-{uuid.uuid4().hex[:6]}"
    invalid_payload["maximum_capacity"] = -50.0  # Invalid negative
    res_neg = client.post("/api/instruments", json=invalid_payload, headers=headers)
    assert res_neg.status_code in (400, 422)

    # Clean up
    client.delete(f"/api/instruments/{created_id}", headers=headers)


def test_nonexistent_resource_errors(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Non-existent instrument
    res = client.get("/api/instruments/99999999", headers=headers)
    assert res.status_code == 404

    # Non-existent test
    res = client.get("/api/tests/99999999", headers=headers)
    assert res.status_code == 404

    # Non-existent report
    res = client.get("/api/reports/99999999", headers=headers)
    assert res.status_code == 404
