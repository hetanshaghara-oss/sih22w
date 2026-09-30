import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_complete_phase2_3_workflow():
    # 1. Login as Tester
    login_resp = client.post("/api/auth/login", json={"email": "tester@nawi-lab.org", "password": "Tester@12345"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get instruments list to select an instrument
    inst_resp = client.get("/api/instruments", headers=headers)
    assert inst_resp.status_code == 200
    instruments = inst_resp.json()["items"]
    assert len(instruments) > 0
    # Pick Class I instrument
    inst_class_1 = [i for i in instruments if i["accuracy_class"] == "Class I"][0]

    # 3. Create New Test
    new_test_payload = {
        "instrument_id": inst_class_1["id"],
        "laboratory_name": "Federal Metrology Testing Center",
        "test_location": "Calibration Lab Chamber 3",
        "remarks": "Initial verification under standard conditions"
    }
    create_test_resp = client.post("/api/tests", json=new_test_payload, headers=headers)
    assert create_test_resp.status_code == 201
    test_data = create_test_resp.json()
    test_id_num = test_data["id"]
    assert test_data["test_id"].startswith("TEST-")
    assert test_data["status"] == "Draft"
    assert test_data["overall_verdict"] == "PENDING"

    # 4. Save Environmental Conditions
    env_payload = {
        "temperature_celsius": 20.4,
        "relative_humidity_percent": 48.5,
        "atmospheric_pressure_kpa": 101.32,
        "test_location": "Chamber 3",
        "reference_standards": "OIML Class E2 Standard Weights Set 01"
    }
    env_resp = client.post(f"/api/tests/{test_id_num}/environment", json=env_payload, headers=headers)
    assert env_resp.status_code == 200
    assert env_resp.json()["temperature_celsius"] == 20.4

    # 5. List test definitions & attach Repeatability test
    defs_resp = client.get("/api/test-definitions", headers=headers)
    assert defs_resp.status_code == 200
    defs = defs_resp.json()
    rep_def = [d for d in defs if d["code"] == "OIML_REPEATABILITY"][0]

    inst_attach_resp = client.post("/api/test-instances", json={"test_id": test_id_num, "definition_id": rep_def["id"]}, headers=headers)
    assert inst_attach_resp.status_code == 201
    rep_instance_id = inst_attach_resp.json()["id"]

    # 6. Enter Raw Observations (Repeatability at 200 g load, e = 0.001 g)
    obs_list = [
        {"load_point": 200.0, "indicated_value": 200.000, "extra_load_added": 0.0004},
        {"load_point": 200.0, "indicated_value": 200.001, "extra_load_added": 0.0005},
        {"load_point": 200.0, "indicated_value": 200.000, "extra_load_added": 0.0003},
    ]
    for obs in obs_list:
        add_obs_resp = client.post(f"/api/test-instances/{rep_instance_id}/observations", json=obs, headers=headers)
        assert add_obs_resp.status_code == 201

    # 7. Evaluate Repeatability test
    eval_resp = client.post(f"/api/test-instances/{rep_instance_id}/evaluate", headers=headers)
    assert eval_resp.status_code == 200
    eval_result = eval_resp.json()
    assert eval_result["verdict"] == "PASS"
    assert "ΔP" in eval_result["explanation"]
    assert eval_result["rule_version"] == "OIML R 76-1:2006"

    # 8. Check test results endpoint
    results_resp = client.get(f"/api/test-instances/{rep_instance_id}/results", headers=headers)
    assert results_resp.status_code == 200
    assert results_resp.json()["verdict"] == "PASS"

    # 9. Test observation modification invalidating evaluation (is_outdated=True)
    obs_to_update = client.get(f"/api/test-instances/{rep_instance_id}", headers=headers).json()["observations"][0]
    update_obs_resp = client.put(f"/api/test-instances/{rep_instance_id}/observations/{obs_to_update['id']}", json={"indicated_value": 200.0005}, headers=headers)
    assert update_obs_resp.status_code == 200
    # Verify instance is now outdated
    rechecked_inst = client.get(f"/api/test-instances/{rep_instance_id}", headers=headers).json()
    assert rechecked_inst["is_outdated"] == True
    assert rechecked_inst["verdict"] == "PENDING"

    # Re-evaluate
    client.post(f"/api/test-instances/{rep_instance_id}/evaluate", headers=headers)

    # 10. Submit for Review
    submit_resp = client.post(f"/api/tests/{test_id_num}/submit-review", headers=headers)
    assert submit_resp.status_code == 200
    assert submit_resp.json()["status"] == "Under Review"

    # 11. Reviewer Workflow
    rev_login = client.post("/api/auth/login", json={"email": "reviewer@nawi-lab.org", "password": "Reviewer@12345"})
    rev_token = rev_login.json()["access_token"]
    rev_headers = {"Authorization": f"Bearer {rev_token}"}

    # Reviewer approves test
    approve_resp = client.post(f"/api/tests/{test_id_num}/review", json={"action": "approve", "comments": "All observations verified per OIML R 76 standards."}, headers=rev_headers)
    assert approve_resp.status_code == 200
    approved_test = approve_resp.json()
    assert approved_test["status"] == "Completed"
    assert approved_test["overall_verdict"] == "PASS"

    # 12. Immutability verification: Editing observation on Completed test must fail
    fail_edit = client.put(f"/api/test-instances/{rep_instance_id}/observations/{obs_to_update['id']}", json={"indicated_value": 200.005}, headers=headers)
    assert fail_edit.status_code == 400

    # 13. Test History listing
    hist_resp = client.get("/api/tests/history", headers=headers)
    assert hist_resp.status_code == 200
    assert hist_resp.json()["total"] >= 1

    print("ALL PHASE 2 + 3 AUTOMATED TESTS PASSED!")

if __name__ == "__main__":
    test_complete_phase2_3_workflow()
