# API Specification & Endpoints (Phases 1, 2, & 3)

## Base URL
`/api`

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/login`
- Authenticates credentials and returns JWT Bearer token with user role.

### `GET /api/auth/me`
- Returns current logged-in user profile.

---

## 2. Instruments (`/api/instruments`)

- `GET /api/instruments`: Paginated list of registered instruments with search, filter, and sorting.
- `GET /api/instruments/{id}`: Detailed view of instrument.
- `POST /api/instruments`: Register new instrument ($Max > Min$ validation, uniqueness check).
- `PUT /api/instruments/{id}`: Update instrument specifications.
- `DELETE /api/instruments/{id}`: Delete instrument record.

---

## 3. Test Sessions (`/api/tests`)

### `POST /api/tests`
- Initializes a new test session. Auto-generates unique `TEST-YYYY-XXXX` ID.
- **Request Body**:
  ```json
  {
    "instrument_id": 1,
    "laboratory_name": "Federal Metrology Center",
    "test_location": "Calibration Chamber 3",
    "remarks": "Initial verification"
  }
  ```

### `GET /api/tests`
- Query parameters: `search`, `status` (`Draft`, `In Progress`, `Under Review`, `Completed`, `Failed`), `verdict` (`PASS`, `FAIL`, `REVIEW`, `INCOMPLETE`, `PENDING`), `page`, `page_size`.

### `GET /api/tests/history`
- Specialized history audit query with search, status filters, and pagination.

### `GET /api/tests/{id}`
- Returns full test session tree including instrument, tester, reviewer, environmental conditions, and attached test instances with observations and results.

### `PUT /api/tests/{id}`
- Updates metadata (blocked if test is `Completed` or `Failed`).

### `POST /api/tests/{id}/environment`
- Saves or updates atmospheric conditions ($T^\circ\text{C}$, relative humidity %, barometric pressure kPa, reference standards).

### `POST /api/tests/{id}/submit-review`
- Validates that all attached test procedures have been evaluated and transitions session from `In Progress` to `Under Review`.

### `POST /api/tests/{id}/review`
- **Roles**: `Reviewer`, `Admin`
- Endorses test (`action: "approve"` -> `Completed`) or rejects (`action: "reject"` -> `Failed`) with authorization comments. Permanently locks test against further edits.

---

## 4. Test Definitions (`/api/test-definitions`)

- `GET /api/test-definitions`: Lists active OIML test types (`OIML_REPEATABILITY`, `OIML_ECCENTRICITY`, `OIML_WEIGHING_PERFORMANCE`, `OIML_TARE`).
- `POST /api/test-definitions`: Admin endpoint to configure new test definitions.

---

## 5. Test Instances & Raw Observations (`/api/test-instances`)

### `POST /api/test-instances`
- Attaches an OIML test procedure to a test session.

### `POST /api/test-instances/{id}/observations`
- Records raw observation reading:
  ```json
  {
    "load_point": 200.0,
    "indicated_value": 200.001,
    "extra_load_added": 0.0004,
    "zero_indicated": 0.0,
    "position_label": "Center"
  }
  ```

### `PUT /api/test-instances/{id}/observations/{obs_id}`
- Updates raw observation and automatically invalidates previous compliance evaluations (`is_outdated = true`).

### `DELETE /api/test-instances/{id}/observations/{obs_id}`
- Deletes observation reading.

### `POST /api/test-instances/{id}/evaluate`
- Runs the **OIML R 76 Compliance Calculation Engine**:
  - Calculates turning points $P = I + 0.5e - \Delta L$
  - Computes intrinsic errors $E = P - L$ and corrected errors $E_c = E - E_0$
  - Fetches applicable configurable rule matching `(test_code, accuracy_class)`
  - *If rule not configured*: returns `REVIEW` with explanation `"Rule not configured"`. Never assumes PASS.
  - *If observations insufficient*: returns `INCOMPLETE`.
  - Otherwise returns `PASS` or `FAIL` with allowable tolerance limit description and mathematical explanation.

### `GET /api/test-instances/{id}/results`
- Retrieves evaluated compliance result.

---

## 6. Configurable Compliance Rules (`/api/compliance-rules`)

- `GET /api/compliance-rules`: Inspects configured OIML R 76 rules.
- `POST /api/compliance-rules`: Admin endpoint to add or update rules and version tags without touching source code.
