-- ====================================================================
-- NAWI Compliance & Test Report System (OIML R 76)
-- Migration 001: Core Architecture Schema (Phase 1, 2, & 3)
-- Compatible with PostgreSQL 13+
-- ====================================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'tester', 'reviewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE instrument_status AS ENUM ('Active', 'Inactive', 'Under Testing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE test_status AS ENUM ('Draft', 'In Progress', 'Under Review', 'Completed', 'Failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE overall_verdict AS ENUM ('PENDING', 'PASS', 'FAIL', 'REVIEW', 'INCOMPLETE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'tester',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. Instruments Table
CREATE TABLE IF NOT EXISTS instruments (
    id SERIAL PRIMARY KEY,
    instrument_id VARCHAR(50) UNIQUE NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    instrument_type VARCHAR(100) NOT NULL,
    instrument_class VARCHAR(50) NOT NULL,
    maximum_capacity DOUBLE PRECISION NOT NULL,
    minimum_capacity DOUBLE PRECISION NOT NULL,
    verification_scale_interval DOUBLE PRECISION NOT NULL, -- 'e'
    accuracy_class VARCHAR(50) NOT NULL,
    country_of_manufacture VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_capacity_order CHECK (maximum_capacity > minimum_capacity)
);

CREATE INDEX IF NOT EXISTS idx_instruments_id_code ON instruments(instrument_id);
CREATE INDEX IF NOT EXISTS idx_instruments_manufacturer ON instruments(manufacturer);
CREATE INDEX IF NOT EXISTS idx_instruments_serial ON instruments(serial_number);
CREATE INDEX IF NOT EXISTS idx_instruments_status ON instruments(status);
CREATE INDEX IF NOT EXISTS idx_instruments_type ON instruments(instrument_type);

-- 4. Tests Table (Phase 2 & 3)
CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(50) UNIQUE NOT NULL,
    instrument_id INTEGER REFERENCES instruments(id) ON DELETE CASCADE NOT NULL,
    tester_id INTEGER REFERENCES users(id) NOT NULL,
    reviewer_id INTEGER REFERENCES users(id),
    laboratory_name VARCHAR(150) NOT NULL DEFAULT 'National Metrology Calibration Laboratory',
    test_location VARCHAR(150),
    remarks TEXT,
    reviewer_comments TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    overall_verdict VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tests_id_code ON tests(test_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_tests_verdict ON tests(overall_verdict);
CREATE INDEX IF NOT EXISTS idx_tests_instrument ON tests(instrument_id);

-- 5. Environmental Conditions Table
CREATE TABLE IF NOT EXISTS environmental_conditions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE UNIQUE NOT NULL,
    temperature_celsius DOUBLE PRECISION,
    relative_humidity_percent DOUBLE PRECISION,
    atmospheric_pressure_kpa DOUBLE PRECISION,
    test_location VARCHAR(150),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    reference_standards TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Test Definitions (Catalog)
CREATE TABLE IF NOT EXISTS test_definitions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    clause_reference VARCHAR(50) NOT NULL,
    description TEXT,
    required_observations_count INTEGER NOT NULL DEFAULT 3,
    category VARCHAR(50) NOT NULL DEFAULT 'Metrological Performance',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Test Instances
CREATE TABLE IF NOT EXISTS test_instances (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
    definition_id INTEGER REFERENCES test_definitions(id) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    verdict VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    is_outdated BOOLEAN NOT NULL DEFAULT FALSE,
    evaluation_summary TEXT,
    evaluated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Raw Observations
CREATE TABLE IF NOT EXISTS observations (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER REFERENCES test_instances(id) ON DELETE CASCADE NOT NULL,
    sequence_order INTEGER NOT NULL DEFAULT 1,
    load_point DOUBLE PRECISION NOT NULL,
    indicated_value DOUBLE PRECISION NOT NULL,
    extra_load_added DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    zero_indicated DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    tare_applied DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    position_label VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Configurable Compliance Rules
CREATE TABLE IF NOT EXISTS compliance_rules (
    id SERIAL PRIMARY KEY,
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    test_code VARCHAR(50) NOT NULL,
    accuracy_class VARCHAR(50) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT 'OIML R 76-1:2006',
    parameter_name VARCHAR(100) NOT NULL,
    formula_type VARCHAR(50) NOT NULL,
    criteria_json TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Evaluated Test Results
CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER REFERENCES test_instances(id) ON DELETE CASCADE NOT NULL,
    rule_id INTEGER REFERENCES compliance_rules(id) ON DELETE SET NULL,
    rule_version VARCHAR(50) NOT NULL,
    applicable_rule_code VARCHAR(50),
    calculated_values_json TEXT NOT NULL,
    allowable_limit_description VARCHAR(255) NOT NULL,
    verdict VARCHAR(20) NOT NULL,
    explanation TEXT NOT NULL,
    evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    details_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
