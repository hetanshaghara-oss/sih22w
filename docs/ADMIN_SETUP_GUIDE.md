# NAWI System — Administrator Setup & Governance Guide

This guide provides instructions for Laboratory Quality Managers, IT Administrators, and Lead Metrologists responsible for governing the NAWI Testing System.

---

## 1. Administrative Privileges & Portals

Only users with the `admin` role can access administrative portals:
1. **User & Access Control (`/admin/users`)**: Provision, modify, or deactivate laboratory staff accounts.
2. **OIML Compliance Rules (`/admin/rules`)**: Configure, edit, or update MPE tolerance limits.
3. **Audit Trail & System Security (`/admin/audit-logs`)**: Inspect regulatory events and initiate database backups.
4. **General Settings (`/admin/settings`)**: Organization identity, laboratory accreditation numbers, default standards.

---

## 2. Managing Laboratory Staff Accounts

### 2.1 Creating Accounts
1. Navigate to **Admin ➔ Users** (`/admin/users`).
2. Click **Add New User**.
3. Enter Name, Email, Password, and Role:
   - `tester`: Can create instruments and test runs.
   - `reviewer`: Can approve or reject test submissions.
   - `viewer`: Read-only external auditor access.
   - `admin`: Full configuration authority.
4. Click **Create Account**.

### 2.2 Resetting Passwords & Deactivating Accounts
1. Click the **Edit** icon next to any user.
2. To reset password: enter a new password in the optional password field.
3. To deactivate an account: toggle the Account Status dropdown from **Active** to **Inactive**. Inactive users cannot log in.
4. Note: Administrators cannot delete their own active accounts.

---

## 3. Configuring OIML R-76 Compliance Rules

The compliance engine relies on database-driven rules rather than hardcoded tolerances.

### 3.1 Inspecting Active Rules
1. Navigate to **Admin ➔ OIML Rules** (`/admin/rules`).
2. Filter by test procedure (`Weighing Performance`, `Repeatability`, `Eccentricity`) and Accuracy Class (`Class I`, `Class II`, `Class III`, `Class IIII`).

### 3.2 Modifying Rules for Updated Legal Standards
When national metrology regulations or OIML recommendations change:
1. Open the rule details modal.
2. Update the MPE criteria JSON (e.g. modifying step limits or changing verification tolerance from initial verification to in-service verification $2 \times \text{MPE}$).
3. Save the rule. The system creates an automatic audit log entry with reference to the rule code and author ID.

---

## 4. Regulatory Audit Log Inspection

Every metrologically significant event is recorded in the immutable audit log:
- Timestamp (UTC)
- Operator identity (Name, Email, Role)
- Event Action (`CREATE_INSTRUMENT`, `CREATE_TEST`, `REVIEW_APPROVE`, `GENERATE_REPORT`, etc.)
- Entity Type & Reference Number (`TEST-2026-0001`, `REP-2026-0001`)
- Event Metadata (Raw JSON parameters)

To inspect an event:
1. Navigate to **Admin ➔ Audit Trail** (`/admin/audit-logs`).
2. Use the search bar or action dropdown to find target events.
3. Click **Inspect** to view the full raw event JSON.

---

## 5. Routine Backup Schedule

To adhere to ISO/IEC 17025 accreditation standards:
1. Configure a daily cron / scheduled task executing:
   ```bash
   python scripts/backup_db.py --output-dir /secure_backup_volume/nawi_backups
   ```
2. Verify backup SHA-256 checksums periodically.
3. Store backups on secondary physical or cloud storage isolated from the live server.
