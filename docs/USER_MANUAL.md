# NAWI Testing & OIML R-76 Compliance System — Operator User Manual

Welcome to the **NAWI Test Report Application**. This manual guides laboratory testers, technical reviewers, and calibration auditors through the standard operating procedures.

---

## 1. The Core Testing Workflow

The metrological testing pipeline follows a strict, logical progression:

```
[1. Instrument] ➔ [2. Test Session] ➔ [3. Observations] ➔ [4. Calculate] ➔ [5. Compliance] ➔ [6. Review] ➔ [7. Report]
```

---

## 2. Authentication & Roles

Log in at `/login` using your laboratory credentials:
- **Administrator**: `admin@nawi-lab.org` (System settings, user management, audit logs)
- **Tester (Lab Operator)**: `tester@nawi-lab.org` (Instrument registration, test observation entry, calculations)
- **Reviewer (Approver)**: `reviewer@nawi-lab.org` (Test evaluation audit, approval / rejection)
- **Viewer (Auditor)**: `viewer@nawi-lab.org` (Read-only record inspection)

---

## 3. Step-by-Step Operating Procedures

### Step 1: Instrument Registration
1. In the sidebar, click **Instruments ➔ Add Instrument** (`/instruments/new`).
2. Enter the identification data:
   - **Instrument Code**: Unique internal asset tag (e.g. `INST-2026-001`).
   - **Manufacturer & Model**: e.g. `Mettler Toledo - MS204TS`.
   - **Serial Number**: e.g. `B839201948`.
   - **Accuracy Class**: Select `Class I`, `Class II`, `Class III`, or `Class IIII`.
   - **Max & Min Capacity**: In grams or kilograms ($Max$, $Min$).
   - **Verification Interval ($e$)**: e.g. `0.001 g`.
3. Click **Register Instrument**.

### Step 2: Initiating a New Test Session
1. Click **Testing ➔ New Test** (`/testing/new`).
2. Select your registered instrument from the dropdown list. Notice that technical specifications auto-populate.
3. Enter the **Laboratory Name**, **Test Location**, and initial remarks.
4. Click **Start Test Run**. The system generates an incremental identifier `TEST-YYYY-XXXX`.

### Step 3: Entering Environmental Conditions
1. In the **Environmental Conditions** tab:
   - Record Temperature ($^\circ\text{C}$), Relative Humidity ($\%$), and Pressure ($\text{kPa}$).
   - Specify Reference Mass Standards used (e.g. `OIML Class E2 Set #44`).
2. Click **Save Environmental Conditions**.

### Step 4: Adding Test Procedures & Observations
1. In the **Test Procedures** tab, attach the applicable procedures:
   - Repeatability Test (Clause A.4.4)
   - Eccentricity Corner Load Test (Clause A.4.7)
   - Weighing Performance Test (Clause A.4.4.3 & Table 6)
   - Tare Test (Clause A.4.6)
2. In the **Observations** tab, select a procedure and record observations:
   - Nominal Load Point ($L$)
   - Indicated Reading ($I$)
   - Extra Load to Turning Point ($\Delta L$)
3. Raw data is auto-saved immediately.

### Step 5: Automatic Calculation & Compliance Checking
1. Click **Evaluate Procedure**.
2. The compliance engine calculates:
   - Turning point: $P = I + 0.5e - \Delta L$
   - Intrinsic error: $E = P - L$
   - Corrected error: $E_c = E - E_0$
   - Allowable MPE tolerance limit
3. If all points satisfy OIML limits, the procedure displays a green **PASS** badge. If any point exceeds limits, a red **FAIL** badge is shown.
4. Click **Submit Test for Review**.

### Step 6: Review & Approval Workflow
1. A Reviewer or Administrator opens the test session.
2. Under the **Review & Endorse** tab, inspect all calculation breakdowns.
3. Select **Approve** or **Reject**, enter formal remarks, and click **Submit Decision**.
4. When approved, the test status transitions to `Completed` and is permanently locked.

### Step 7: Generating Official Calibration Certificates
1. In the **Report & Certificate** tab (or via `/reports`), click **Generate Official Report**.
2. A formal tamper-evident certificate is issued with a unique `REP-YYYY-XXXX` reference and SHA-256 digital checksum.
3. Click **Download Official PDF** or **Print Certificate** for customer delivery or calibration seals.
