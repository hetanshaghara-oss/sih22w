import os
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
def tester_token():
    db = next(get_db())
    tester = db.query(User).filter(User.role == UserRole.TESTER).first()
    return create_access_token(subject=tester.id, role=tester.role.value)

@pytest.fixture(scope="module")
def reviewer_token():
    db = next(get_db())
    reviewer = db.query(User).filter(User.role == UserRole.REVIEWER).first()
    return create_access_token(subject=reviewer.id, role=reviewer.role.value)


def test_complete_end_to_end_acceptance_workflow(tester_token, reviewer_token, admin_token):
    """
    Final Acceptance Scenario:
    Login -> Register NAWI -> Enter Specifications -> Enter Test Observations ->
    Calculate Results -> OIML R-76 Compliance Check -> Review -> Approve ->
    Generate PDF Report -> Save to Test History
    """
    tester_headers = {"Authorization": f"Bearer {tester_token}"}
    reviewer_headers = {"Authorization": f"Bearer {reviewer_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # STEP 1: Register NAWI & Specifications
    inst_code = f"E2E-{uuid.uuid4().hex[:6].upper()}"
    inst_payload = {
        "instrument_id": inst_code,
        "manufacturer": "Kern & Sohn GmbH",
        "model": "EG 2200-2NM",
        "serial_number": f"SN-{inst_code}",
        "instrument_type": "Precision Weighing Scale",
        "instrument_class": "Class II",
        "maximum_capacity": 2200.0,
        "minimum_capacity": 0.5,
        "verification_scale_interval": 0.01,
        "accuracy_class": "Class II",
        "country_of_manufacture": "Germany",
        "status": "Active"
    }
    res_inst = client.post("/api/instruments", json=inst_payload, headers=tester_headers)
    assert res_inst.status_code == 201
    instrument = res_inst.json()
    instrument_id = instrument["id"]

    # STEP 2: Create Test Session
    test_payload = {
        "instrument_id": instrument_id,
        "laboratory_name": "National Metrology Institute (NMI) Calibration Lab",
        "test_location": "Baden-Wurttemberg Facility, Room 302",
        "remarks": "OIML R-76 Full Type Evaluation Run"
    }
    res_test = client.post("/api/tests", json=test_payload, headers=tester_headers)
    assert res_test.status_code == 201
    test_session = res_test.json()
    test_id = test_session["id"]
    test_id_code = test_session["test_id"]

    # STEP 3: Record Environmental Conditions
    env_payload = {
        "temperature_celsius": 20.4,
        "relative_humidity_percent": 48.5,
        "atmospheric_pressure_kpa": 101.32,
        "test_location": "Baden-Wurttemberg Facility, Room 302",
        "reference_standards": "OIML Class E2 Stainless Steel Mass Standards (Kit #E2-992)"
    }
    res_env = client.post(f"/api/tests/{test_id}/environment", json=env_payload, headers=tester_headers)
    assert res_env.status_code == 200

    # STEP 4: Attach Test Definitions (Repeatability & Weighing Performance)
    res_defs = client.get("/api/test-definitions", headers=tester_headers)
    assert res_defs.status_code == 200
    definitions = res_defs.json()
    rep_def = next(d for d in definitions if d["code"] == "OIML_REPEATABILITY")
    weigh_def = next(d for d in definitions if d["code"] == "OIML_WEIGHING_PERFORMANCE")

    # Attach Repeatability
    res_rep = client.post(
        "/api/test-instances",
        json={"test_id": test_id, "definition_id": rep_def["id"]},
        headers=tester_headers
    )
    assert res_rep.status_code == 201
    rep_instance = res_rep.json()

    # Attach Weighing Performance
    res_wp = client.post(
        "/api/test-instances",
        json={"test_id": test_id, "definition_id": weigh_def["id"]},
        headers=tester_headers
    )
    assert res_wp.status_code == 201
    wp_instance = res_wp.json()

    # STEP 5: Enter Observations
    # 5a. Repeatability observations (3 runs with e = 0.01g)
    for i in range(3):
        res_obs = client.post(
            f"/api/test-instances/{rep_instance['id']}/observations",
            json={
                "load_point": 1000.0,
                "indicated_value": 1000.00,
                "extra_load_added": 0.005,
                "reading_order": i + 1,
            },
            headers=tester_headers
        )
        assert res_obs.status_code == 201

    # 5b. Weighing Performance observations (Zero + 4 loads within Class II tolerances = 5 points)
    wp_data = [
        {"load": 0.0, "ind": 0.00, "extra": 0.005},
        {"load": 100.0, "ind": 100.00, "extra": 0.005},
        {"load": 500.0, "ind": 500.00, "extra": 0.005},
        {"load": 1000.0, "ind": 1000.00, "extra": 0.005},
        {"load": 2000.0, "ind": 2000.00, "extra": 0.005},
    ]
    for idx, pt in enumerate(wp_data):
        res_obs = client.post(
            f"/api/test-instances/{wp_instance['id']}/observations",
            json={
                "load_point": pt["load"],
                "indicated_value": pt["ind"],
                "extra_load_added": pt["extra"],
                "reading_order": idx + 1,
            },
            headers=tester_headers
        )
        assert res_obs.status_code == 201

    # STEP 6: Execute Calculations & OIML R-76 Compliance Evaluation
    res_eval_rep = client.post(f"/api/test-instances/{rep_instance['id']}/evaluate", headers=tester_headers)
    assert res_eval_rep.status_code == 200
    assert res_eval_rep.json()["verdict"] == "PASS"

    res_eval_wp = client.post(f"/api/test-instances/{wp_instance['id']}/evaluate", headers=tester_headers)
    assert res_eval_wp.status_code == 200
    assert res_eval_wp.json()["verdict"] == "PASS"

    # STEP 7: Submit Test for Review
    res_submit = client.post(f"/api/tests/{test_id}/submit-review", headers=tester_headers)
    assert res_submit.status_code == 200
    assert res_submit.json()["status"] == "Under Review"

    # STEP 8: Review & Approve by Reviewer
    review_payload = {
        "action": "approve",
        "comments": "Metrological calculations validated against OIML R-76-1 Table 6. Instrument approved for legal trade."
    }
    res_review = client.post(f"/api/tests/{test_id}/review", json=review_payload, headers=reviewer_headers)
    assert res_review.status_code == 200
    assert res_review.json()["status"] == "Completed"

    # STEP 9: Generate Standardized Test Report (PDF)
    res_report = client.post(
        "/api/reports",
        json={"test_id": test_id, "remarks": "Official Certificate of Verification"},
        headers=tester_headers
    )
    assert res_report.status_code == 201
    report = res_report.json()
    assert report["overall_verdict"] == "PASS"
    assert "REP-" in report["report_number"]
    assert report["file_path"].endswith(".pdf")

    # Download PDF binary
    res_pdf = client.get(f"/api/reports/{report['id']}/pdf", headers=tester_headers)
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert res_pdf.content.startswith(b"%PDF")

    # STEP 10: Verify In Test History
    res_history = client.get(f"/api/tests/history?search={test_id_code}", headers=tester_headers)
    assert res_history.status_code == 200
    hist = res_history.json()
    assert hist["total"] == 1
    assert hist["items"][0]["test_id"] == test_id_code
    assert hist["items"][0]["status"] == "Completed"
    assert hist["items"][0]["overall_verdict"] == "PASS"

    # STEP 11: Verify Complete Audit Trail
    res_audit = client.get(f"/api/audit-logs?search={test_id_code}", headers=admin_headers)
    assert res_audit.status_code == 200
    logs = res_audit.json()["items"]
    actions = [l["action"] for l in logs]
    assert "CREATE_TEST" in actions
    assert "SUBMIT_FOR_REVIEW" in actions
    assert "REVIEW_APPROVE" in actions
