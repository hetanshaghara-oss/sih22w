# Database Schema Documentation

## Core Tables (Phases 1, 2, & 3)

### 1. `users` Table
Stores laboratory personnel with hashed credentials and role scopes.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | PRIMARY KEY | Unique user identifier |
| `name` | VARCHAR(100) | NOT NULL | Full name of laboratory staff |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Login email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hash |
| `role` | VARCHAR(30) | NOT NULL | `admin`, `tester`, or `reviewer` |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Status flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation date |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

---

### 2. `instruments` Table
Stores metadata, manufacturer specs, and OIML metrological parameters for weighing instruments.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | PRIMARY KEY | Internal primary key |
| `instrument_id` | VARCHAR(50) | UNIQUE, NOT NULL, INDEX | Lab tracking ID (e.g. `NAWI-2026-001`) |
| `manufacturer` | VARCHAR(150) | NOT NULL, INDEX | Equipment manufacturer |
| `model` | VARCHAR(100) | NOT NULL | Model identifier |
| `serial_number` | VARCHAR(100) | NOT NULL, INDEX | Unit serial number |
| `instrument_type` | VARCHAR(100) | NOT NULL | Description (e.g. `Analytical Balance`) |
| `instrument_class` | VARCHAR(50) | NOT NULL | Structural category |
| `maximum_capacity` | DOUBLE PRECISION | NOT NULL | Max load point |
| `minimum_capacity` | DOUBLE PRECISION | NOT NULL | Min load point |
| `verification_scale_interval` | DOUBLE PRECISION | NOT NULL | Value $e$ for verification |
| `accuracy_class` | VARCHAR(50) | NOT NULL | OIML Class I, II, III, or IIII |
| `country_of_manufacture` | VARCHAR(100) | NOT NULL | Country of origin |
| `status` | VARCHAR(30) | NOT NULL, INDEX | `Active`, `Inactive`, `Under Testing` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Registration date |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |

---

### 3. `tests` Table (Phase 2 & 3)
Stores test sessions linked to instruments, assigned testers, and reviewers.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | PRIMARY KEY | Test session ID |
| `test_id` | VARCHAR(50) | UNIQUE, NOT NULL, INDEX | Auto-generated ID (e.g. `TEST-2026-0001`) |
| `instrument_id` | INTEGER | FK -> `instruments.id` | Subject instrument |
| `tester_id` | INTEGER | FK -> `users.id` | Assigned tester |
| `reviewer_id` | INTEGER | FK -> `users.id` | Authorizing reviewer |
| `laboratory_name` | VARCHAR(150) | NOT NULL | Testing laboratory |
| `test_location` | VARCHAR(150) | | Chamber / room location |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'Draft' | `Draft`, `In Progress`, `Under Review`, `Completed`, `Failed` |
| `overall_verdict` | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | `PENDING`, `PASS`, `FAIL`, `REVIEW`, `INCOMPLETE` |
| `reviewer_comments` | TEXT | | Approval / rejection rationale |
| `started_at` | TIMESTAMPTZ | | Session start |
| `completed_at` | TIMESTAMPTZ | | Session completion timestamp |

---

### 4. `environmental_conditions` Table
Stores laboratory atmospheric conditions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | PRIMARY KEY | Environment record ID |
| `test_id` | INTEGER | UNIQUE, FK -> `tests.id` | 1-to-1 link to test session |
| `temperature_celsius` | DOUBLE PRECISION | | Ambient temperature (°C) |
| `relative_humidity_percent`| DOUBLE PRECISION | | Relative humidity (%) |
| `atmospheric_pressure_kpa` | DOUBLE PRECISION | | Barometric pressure (kPa) |
| `reference_standards` | TEXT | | Working standards / weight sets |

---

### 5. `test_definitions` Table
Configurable catalog of OIML test types.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | PRIMARY KEY | Definition ID |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | e.g. `OIML_REPEATABILITY`, `OIML_ECCENTRICITY` |
| `name` | VARCHAR(100) | NOT NULL | Human-readable name |
| `clause_reference` | VARCHAR(50) | NOT NULL | OIML R 76 clause (e.g. Clause A.4.4) |
| `required_observations_count`| INT | NOT NULL, DEFAULT 3 | Minimum observation readings required |

---

### 6. `test_instances` Table
Instances of selected test procedures attached to a test session.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | PRIMARY KEY | Instance ID |
| `test_id` | INTEGER | FK -> `tests.id` | Parent test session |
| `definition_id` | INTEGER | FK -> `test_definitions.id` | Attached procedure |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'Pending' | `Pending`, `In Progress`, `Evaluated` |
| `verdict` | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | `PENDING`, `PASS`, `FAIL`, `REVIEW`, `INCOMPLETE` |
| `is_outdated` | BOOLEAN | NOT NULL, DEFAULT FALSE | Flagged True if observations change after evaluation |

---

### 7. `observations` Table
Stores raw metrological readings completely separate from calculated results.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | PRIMARY KEY | Observation ID |
| `instance_id` | INTEGER | FK -> `test_instances.id` | Parent test instance |
| `sequence_order` | INT | NOT NULL, DEFAULT 1 | Chronological reading number |
| `load_point` | DOUBLE PRECISION | NOT NULL | Applied test load $L$ |
| `indicated_value`| DOUBLE PRECISION | NOT NULL | Indicated reading $I$ |
| `extra_load_added`| DOUBLE PRECISION | NOT NULL, DEFAULT 0.0 | $\Delta L$ added to determine turning point |
| `zero_indicated` | DOUBLE PRECISION | NOT NULL, DEFAULT 0.0 | Zero reading before load |
| `position_label` | VARCHAR(50) | | Center, Pos 1, Pos 2... for eccentricity |

---

### 8. `compliance_rules` Table
Configurable OIML R 76 rules database.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | PRIMARY KEY | Rule ID |
| `rule_code` | VARCHAR(50) | UNIQUE, NOT NULL | e.g. `R76_REP_CLASS_I` |
| `test_code` | VARCHAR(50) | NOT NULL | Matching test definition |
| `accuracy_class` | VARCHAR(50) | NOT NULL | Class I, II, III, IIII |
| `version` | VARCHAR(50) | NOT NULL | Standard edition (e.g. `OIML R 76-1:2006`) |
| `criteria_json` | TEXT | NOT NULL | Configured limits (MPE tiers, maximum differences) |

---

### 9. `test_results` Table
Evaluated outputs generated by the compliance engine.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | PRIMARY KEY | Result ID |
| `instance_id` | INTEGER | FK -> `test_instances.id` | Target test instance |
| `rule_version` | VARCHAR(50) | NOT NULL | Tagged standard version evaluated against |
| `calculated_values_json`| TEXT | NOT NULL | Turning points $P$, errors $E$, $E_c$, ranges |
| `allowable_limit_description`| VARCHAR(255)| NOT NULL | Permissible tolerance description |
| `verdict` | VARCHAR(20) | NOT NULL | `PASS`, `FAIL`, `REVIEW`, `INCOMPLETE` |
| `explanation` | TEXT | NOT NULL | Full metrological rationale |
