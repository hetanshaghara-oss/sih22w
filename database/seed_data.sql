-- ====================================================================
-- Initial Seed Data for NAWI System (PostgreSQL)
-- Password hashes generated with bcrypt for:
--   Admin@12345
--   Tester@12345
--   Reviewer@12345
-- ====================================================================

-- 1. Insert Initial Laboratory Users
INSERT INTO users (name, email, password_hash, role, is_active, created_at, updated_at)
VALUES
    ('Dr. Sarah Jenkins', 'admin@nawi-lab.org', '$2b$12$NlmxQ390U7Z8s0rRzrq8VOPsKk60Z.7w1Lw7uT90a0P9hG4K6O0iq', 'admin', true, NOW(), NOW()),
    ('Marcus Vance', 'tester@nawi-lab.org', '$2b$12$G7pA75uR5k4z20562Vv/Nu61Bw6g170Uq/tP8l8sDqQYcIsqJqmfe', 'tester', true, NOW(), NOW()),
    ('Elena Rostova', 'reviewer@nawi-lab.org', '$2b$12$Ea2qQnJk75W082/Yw9r3QOmj4Yv1l7e8V.oI/eA6UoWkC6vQj4l0O', 'reviewer', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Initial Registered NAWI Instruments
INSERT INTO instruments (
    instrument_id, manufacturer, model, serial_number, instrument_type,
    instrument_class, maximum_capacity, minimum_capacity, verification_scale_interval,
    accuracy_class, country_of_manufacture, status, created_at, updated_at
)
VALUES
    ('NAWI-2026-001', 'Mettler Toledo', 'XPR205', 'MT-8849201', 'Analytical Balance', 'Class I', 220.0, 0.01, 0.001, 'Class I', 'Switzerland', 'Active', NOW(), NOW()),
    ('NAWI-2026-002', 'Sartorius', 'Cubis II MCA225S', 'SAR-991203', 'Semi-Micro Balance', 'Class I', 220.0, 0.005, 0.001, 'Class I', 'Germany', 'Active', NOW(), NOW()),
    ('NAWI-2026-003', 'OHAUS', 'Defender 5000', 'OH-554109', 'Industrial Bench Scale', 'Class III', 60.0, 0.4, 0.02, 'Class III', 'United States', 'Under Testing', NOW(), NOW()),
    ('NAWI-2026-004', 'Kern & Sohn', 'PCB 10000-1', 'KERN-31048', 'Precision Balance', 'Class II', 10000.0, 5.0, 0.1, 'Class II', 'Germany', 'Inactive', NOW(), NOW())
ON CONFLICT (instrument_id) DO NOTHING;
