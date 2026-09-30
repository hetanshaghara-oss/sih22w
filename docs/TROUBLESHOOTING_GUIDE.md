# NAWI Test Report Application — Troubleshooting & Diagnostics Guide

This document assists operators, lab managers, and system administrators in diagnosing and resolving common issues.

---

## 1. Common Operational & System Issues

### 1.1 "An attempt was made to access a socket in a way forbidden by its access permissions" (WinError 10013)
- **Cause**: Port `8000` is currently reserved by Windows Hyper-V, WSL, or another running process.
- **Resolution**:
  1. Check what is occupying port 8000:
     ```powershell
     netstat -ano | findstr :8000
     ```
  2. Alternatively, launch Uvicorn on an alternate port:
     ```powershell
     .\venv\Scripts\python.exe -m uvicorn app.main:app --port 8080 --reload
     ```
  3. Update `VITE_API_URL` or Vite proxy in `frontend/vite.config.ts`.

### 1.2 "Rule not configured" / Procedure marked as REVIEW instead of PASS/FAIL
- **Cause**: The instrument accuracy class (e.g. `Class I`) does not have an active rule matching the test code in the `compliance_rules` table.
- **Resolution**:
  1. Log in as an Administrator (`admin@nawi-lab.org`).
  2. Navigate to **Admin ➔ OIML Rules** (`/admin/rules`).
  3. Ensure a rule exists matching the test procedure and instrument accuracy class.
  4. Alternatively, run the database seeder:
     ```bash
     python scripts/seed_database.py
     ```

### 1.3 Cannot Delete Instrument: "Cannot delete instrument because it has associated test record(s)"
- **Cause**: Metrological records protection policy prevents deleting instruments that have historical test sessions linked to them.
- **Resolution**:
  - In accordance with legal metrology standards, instruments with historical tests cannot be deleted. Instead, change the instrument status from `Active` to `Inactive` or `Archived` in the instrument details modal.

### 1.4 Test Instance Status Shows "INCOMPLETE"
- **Cause**: The number of entered observations does not meet the minimum required count defined in `test_definitions` (e.g. Weighing Performance requires at least 5 points; Repeatability requires at least 3 points).
- **Resolution**:
  1. Open the test workspace and navigate to the **Observations** tab.
  2. Add the required number of observation rows.
  3. Re-click **Evaluate Procedure**.

### 1.5 PDF Certificate Fails to Download or Shows Error
- **Cause**: Missing directory permissions or `storage/reports` folder does not exist.
- **Resolution**:
  1. Ensure the directory `backend/storage/reports/` exists and has write permissions.
  2. Verify ReportLab is installed:
     ```bash
     .\venv\Scripts\pip.exe show reportlab
     ```

### 1.6 Frontend Displays "Could not connect to backend server"
- **Cause**: FastAPI server is not currently running, or CORS headers are misconfigured.
- **Resolution**:
  1. Verify backend health endpoint in browser:
     ```
     http://127.0.0.1:8000/docs
     ```
  2. Verify `CORS_ORIGINS` in `backend/app/core/config.py` includes your frontend port (e.g. `http://localhost:5173`).

---

## 2. Diagnostics Commands Quick Reference

| Task | Command |
| :--- | :--- |
| Run all backend tests | `pytest test_backend.py test_phase2_3.py test_phase4_5.py test_phase6.py test_oiml_validation.py test_phase7_security_edge.py test_phase7_e2e.py -v` |
| Verify frontend build | `npm run build` in `frontend/` |
| Take database snapshot | `python scripts/backup_db.py` in `backend/` |
| Reseed standard data | `python scripts/seed_database.py` in `backend/` |
| Check SQLite integrity | `python -c "import sqlite3; conn = sqlite3.connect('nawi.db'); print(conn.execute('PRAGMA integrity_check').fetchall()); conn.close()"` |
