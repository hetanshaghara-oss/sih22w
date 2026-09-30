"""
Verification suite for Step 4 (OIML R-76 Compliance Checking)
and Step 5 (Automatic Standardized Test Report Generation)
"""

import os
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User, UserRole
from app.models.instrument import Instrument, InstrumentAccuracyClass, InstrumentStatus
from app.models.test import Test, TestStatus, OverallVerdict
from app.models.test_definition import TestDefinition

from app.models.test_instance import TestInstance, InstanceStatus, InstanceVerdict
from app.models.observation import Observation
from app.models.environmental_condition import EnvironmentalCondition
from app.models.compliance_rule import ComplianceRule
from app.models.report import Report
from app.services.compliance.checker import OIMLComplianceChecker
from app.services.reports.generator import ReportGenerator

# Setup test DB
TEST_DB_URL = "sqlite:///./test_phase4_5.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


client = TestClient(app)


def test_full_compliance_and_report_pipeline():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    try:
        _run_compliance_and_report_test()
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
        if os.path.exists("test_phase4_5.db"):
            try:
                os.remove("test_phase4_5.db")
            except Exception:
                pass


def _run_compliance_and_report_test():
    db = TestingSessionLocal()


    # 1. Seed Users
    admin_user = User(
        name="Chief Metrologist",
        email="admin_p45@nawi.com",
        password_hash=get_password_hash("password123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    tester_user = User(
        name="Lab Tester One",
        email="tester_p45@nawi.com",
        password_hash=get_password_hash("password123"),
        role=UserRole.TESTER,
        is_active=True,
    )
    db.add_all([admin_user, tester_user])
    db.commit()

    admin_token = create_access_token(subject=str(admin_user.id), role="admin")
    tester_token = create_access_token(subject=str(tester_user.id), role="tester")




    # 2. Seed Instrument (Class III, Max=15000g, e=5g)
    inst = Instrument(
        instrument_id="INST-P45-001",
        manufacturer="Mettler Toledo",
        model="Precision Pro 15k",
        serial_number="SN-P45-9988",
        instrument_type="Electronic Non-Automatic Weighing Instrument",
        instrument_class="Non-Automatic",
        accuracy_class=InstrumentAccuracyClass.CLASS_III.value,
        maximum_capacity=15000.0,
        minimum_capacity=100.0,
        verification_scale_interval=5.0,
        country_of_manufacture="Switzerland",
        status=InstrumentStatus.ACTIVE,
    )
    db.add(inst)
    db.commit()


    # 3. Seed Compliance Rules
    ecc_rule = ComplianceRule(
        rule_code="RULE_ECC_III_TEST",
        test_code="OIML_ECCENTRICITY",
        accuracy_class="Class III",
        version="OIML R 76-1:2006",
        parameter_name="Max Error at 1/3 Max",
        formula_type="eccentricity_single_load",
        criteria_json=json.dumps({"max_error_e": 1.0}),
        description="Eccentricity test permissible error",
        is_active=True,
    )
    rep_rule = ComplianceRule(
        rule_code="RULE_REP_III_TEST",
        test_code="OIML_REPEATABILITY",
        accuracy_class="Class III",
        version="OIML R 76-1:2006",
        parameter_name="Repeatability difference",
        formula_type="repeatability_span",
        criteria_json=json.dumps({"max_difference_e": 1.0}),
        description="Repeatability maximum difference",
        is_active=True,
    )
    db.add_all([ecc_rule, rep_rule])
    db.commit()

    # 4. Seed Test Definitions
    ecc_def = TestDefinition(
        code="OIML_ECCENTRICITY",
        name="Eccentricity Test",
        clause_reference="Clause A.4.7",
        description="Eccentricity test",
        required_observations_count=3,
        category="Metrological Performance",
        is_active=True,
    )
    rep_def = TestDefinition(
        code="OIML_REPEATABILITY",
        name="Repeatability Test",
        clause_reference="Clause A.4.4",
        description="Repeatability test",
        required_observations_count=3,
        category="Metrological Performance",
        is_active=True,
    )
    db.add_all([ecc_def, rep_def])
    db.commit()



    # 5. Create Test Session
    test = Test(
        test_id="TEST-2026-9001",
        instrument_id=inst.id,
        tester_id=tester_user.id,
        status=TestStatus.IN_PROGRESS,
        overall_verdict=OverallVerdict.PENDING,
        laboratory_name="National Standards Metrology Lab",
    )
    db.add(test)
    db.commit()

    env = EnvironmentalCondition(
        test_id=test.id,
        temperature_celsius=21.5,
        relative_humidity_percent=48.0,
        atmospheric_pressure_kpa=101.3,
        test_location="Laboratory Chamber A",
        reference_standards="OIML Class F1 Weights Set #900",
    )
    db.add(env)
    db.commit()

    # 6. Add Test Instances & Observations (Pass scenario)
    inst_ecc = TestInstance(
        test_id=test.id,
        definition_id=ecc_def.id,
        status=InstanceStatus.IN_PROGRESS,
        verdict=InstanceVerdict.PENDING,
    )
    db.add(inst_ecc)
    db.commit()

    # Eccentricity load: 5000g. e=5g. 5000g = 1000e -> MPE is 1.0e = 5.0g
    obs1 = Observation(instance_id=inst_ecc.id, sequence_order=1, load_point=5000.0, indicated_value=5000.0, extra_load_added=2.5, position_label="Center")
    obs2 = Observation(instance_id=inst_ecc.id, sequence_order=2, load_point=5000.0, indicated_value=5001.0, extra_load_added=2.5, position_label="Front-Left")
    obs3 = Observation(instance_id=inst_ecc.id, sequence_order=3, load_point=5000.0, indicated_value=5000.0, extra_load_added=2.5, position_label="Back-Right")
    db.add_all([obs1, obs2, obs3])
    db.commit()

    # Evaluate instance
    eval_resp = client.post(
        f"/api/test-instances/{inst_ecc.id}/evaluate",
        headers={"Authorization": f"Bearer {tester_token}"}
    )
    assert eval_resp.status_code == 200, eval_resp.text
    assert eval_resp.json()["verdict"] == "PASS"

    # Mark test completed
    test.status = TestStatus.COMPLETED
    test.overall_verdict = OverallVerdict.PASS
    db.commit()


    # 7. Verify OIML Compliance Checker directly
    compliance = OIMLComplianceChecker.check_test_compliance(test)
    assert compliance["overall_status"] == "PASS"
    assert compliance["total_procedures"] == 1
    assert compliance["passed_procedures"] == 1
    assert compliance["failed_procedures"] == 0
    assert len(compliance["procedures"]) == 1
    assert compliance["procedures"][0]["verdict"] == "PASS"

    # 8. Test Live Report Preview Endpoint
    preview_resp = client.get(
        f"/api/reports/preview-by-test/{test.id}",
        headers={"Authorization": f"Bearer {tester_token}"}
    )
    assert preview_resp.status_code == 200
    pdata = preview_resp.json()
    assert pdata["overall_verdict"] == "PASS"
    assert len(pdata["checksum"]) == 64
    assert pdata["data"]["metadata"]["test_id_str"] == "TEST-2026-9001"

    # 9. Test Live Report Preview PDF Stream
    pdf_prev_resp = client.get(
        f"/api/reports/preview-pdf-by-test/{test.id}",
        headers={"Authorization": f"Bearer {tester_token}"}
    )
    assert pdf_prev_resp.status_code == 200
    assert pdf_prev_resp.content.startswith(b"%PDF")

    # 10. Generate and Store Official Report
    rep_create_resp = client.post(
        "/api/reports",
        json={
            "test_id": test.id,
            "summary_remarks": "Annual legal metrology recalibration verification. Met all criteria."
        },
        headers={"Authorization": f"Bearer {tester_token}"}
    )
    assert rep_create_resp.status_code == 201, rep_create_resp.text
    created_report = rep_create_resp.json()
    assert created_report["report_number"].startswith("REP-2026-")
    assert created_report["overall_verdict"] == "PASS"
    assert len(created_report["checksum_hash"]) == 64
    report_id = created_report["id"]

    # 11. Test List Reports
    list_resp = client.get(
        "/api/reports",
        headers={"Authorization": f"Bearer {tester_token}"}
    )
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1
    assert list_resp.json()["items"][0]["report_number"] == created_report["report_number"]

    # 12. Test Get Report Details
    detail_resp = client.get(
        f"/api/reports/{report_id}",
        headers={"Authorization": f"Bearer {tester_token}"}
    )
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["summary_remarks"] == "Annual legal metrology recalibration verification. Met all criteria."
    report_json = json.loads(detail["report_data_json"])
    assert report_json["instrument"]["manufacturer"] == "Mettler Toledo"

    # 13. Test Download Official PDF
    pdf_dl_resp = client.get(
        f"/api/reports/{report_id}/pdf",
        headers={"Authorization": f"Bearer {tester_token}"}
    )
    assert pdf_dl_resp.status_code == 200
    assert pdf_dl_resp.headers["content-type"] == "application/pdf"
    assert pdf_dl_resp.content.startswith(b"%PDF")
    assert len(pdf_dl_resp.content) > 1000

    # 14. Test Compliance Rule Admin Update & Delete Endpoints
    rule_update_resp = client.put(
        f"/api/compliance-rules/{ecc_rule.id}",
        json={"description": "Updated rule description for OIML standard verification"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert rule_update_resp.status_code == 200
    assert rule_update_resp.json()["description"] == "Updated rule description for OIML standard verification"

    # Test Non-admin cannot edit rules
    non_admin_update = client.put(
        f"/api/compliance-rules/{ecc_rule.id}",
        json={"description": "Hacked"},
        headers={"Authorization": f"Bearer {tester_token}"}
    )
    assert non_admin_update.status_code == 403

    # 15. Dashboard count verification
    dash_resp = client.get(
        "/api/dashboard",
        headers={"Authorization": f"Bearer {tester_token}"}
    )
    assert dash_resp.status_code == 200
    assert dash_resp.json()["summary"]["reports_generated"] >= 1

    db.close()
