import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_invalid():
    response = client.post("/api/auth/login", json={"email": "wrong@example.com", "password": "wrong"})
    assert response.status_code == 401

def test_login_success():
    response = client.post("/api/auth/login", json={"email": "admin@nawi-lab.org", "password": "Admin@12345"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "admin"
    assert data["email"] == "admin@nawi-lab.org"

def test_dashboard():
    # Login first
    login_resp = client.post("/api/auth/login", json={"email": "admin@nawi-lab.org", "password": "Admin@12345"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dash_resp = client.get("/api/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert "summary" in dash_data
    assert dash_data["summary"]["total_instruments"] >= 4
    assert dash_data["summary"]["tests_in_progress"] >= 0
    assert dash_data["summary"]["completed_tests"] >= 0
    assert len(dash_data["recent_activity"]) >= 1


def test_instrument_crud():
    login_resp = client.post("/api/auth/login", json={"email": "tester@nawi-lab.org", "password": "Tester@12345"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List instruments
    list_resp = client.get("/api/instruments", headers=headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 4

    # 2. Add instrument
    new_inst = {
        "instrument_id": "TEST-INST-001",
        "manufacturer": "A&D Engineering",
        "model": "GX-8202A",
        "serial_number": "AD-10294",
        "instrument_type": "Precision Balance",
        "instrument_class": "Class II",
        "maximum_capacity": 8200.0,
        "minimum_capacity": 0.5,
        "verification_scale_interval": 0.01,
        "accuracy_class": "Class II",
        "country_of_manufacture": "Japan",
        "status": "Active"
    }
    create_resp = client.post("/api/instruments", json=new_inst, headers=headers)
    assert create_resp.status_code == 201
    created_id = create_resp.json()["id"]

    # 3. Duplicate check
    dup_resp = client.post("/api/instruments", json=new_inst, headers=headers)
    assert dup_resp.status_code == 400

    # 4. Capacity bounds validation: max <= min should fail
    bad_inst = {**new_inst, "instrument_id": "TEST-BAD-001", "maximum_capacity": 1.0, "minimum_capacity": 2.0}
    bad_resp = client.post("/api/instruments", json=bad_inst, headers=headers)
    assert bad_resp.status_code == 422

    # 5. Get instrument by ID
    get_resp = client.get(f"/api/instruments/{created_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["instrument_id"] == "TEST-INST-001"

    # 6. Update instrument
    update_resp = client.put(f"/api/instruments/{created_id}", json={"model": "GX-8202A-Updated"}, headers=headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["model"] == "GX-8202A-Updated"

    # 7. Delete instrument
    del_resp = client.delete(f"/api/instruments/{created_id}", headers=headers)
    assert del_resp.status_code == 204

    # 8. Confirm deleted
    not_found = client.get(f"/api/instruments/{created_id}", headers=headers)
    assert not_found.status_code == 404

if __name__ == "__main__":
    test_health()
    test_login_invalid()
    test_login_success()
    test_dashboard()
    test_instrument_crud()
    print("ALL BACKEND TESTS PASSED!")
