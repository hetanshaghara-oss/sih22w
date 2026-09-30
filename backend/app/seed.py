import json
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.instrument import Instrument, InstrumentStatus
from app.models.test_definition import TestDefinition
from app.models.compliance_rule import ComplianceRule

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed users
        users_data = [
            {
                "name": "Dr. Sarah Jenkins",
                "email": "admin@nawi-lab.org",
                "password": "Admin@12345",
                "role": UserRole.ADMIN,
            },
            {
                "name": "Marcus Vance",
                "email": "tester@nawi-lab.org",
                "password": "Tester@12345",
                "role": UserRole.TESTER,
            },
            {
                "name": "Elena Rostova",
                "email": "reviewer@nawi-lab.org",
                "password": "Reviewer@12345",
                "role": UserRole.REVIEWER,
            }
        ]

        print("Seeding initial laboratory users...")
        for u in users_data:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user = User(
                    name=u["name"],
                    email=u["email"],
                    password_hash=get_password_hash(u["password"]),
                    role=u["role"],
                    is_active=True,
                )
                db.add(user)
                print(f"  + Created user: {u['email']} [{u['role'].value}]")

        # 2. Seed instruments
        instruments_data = [
            {
                "instrument_id": "NAWI-2026-001",
                "manufacturer": "Mettler Toledo",
                "model": "XPR205",
                "serial_number": "MT-8849201",
                "instrument_type": "Analytical Balance",
                "instrument_class": "Class I",
                "maximum_capacity": 220.0,
                "minimum_capacity": 0.01,
                "verification_scale_interval": 0.001,
                "accuracy_class": "Class I",
                "country_of_manufacture": "Switzerland",
                "status": InstrumentStatus.ACTIVE,
            },
            {
                "instrument_id": "NAWI-2026-002",
                "manufacturer": "Sartorius",
                "model": "Cubis II MCA225S",
                "serial_number": "SAR-991203",
                "instrument_type": "Semi-Micro Balance",
                "instrument_class": "Class I",
                "maximum_capacity": 220.0,
                "minimum_capacity": 0.005,
                "verification_scale_interval": 0.001,
                "accuracy_class": "Class I",
                "country_of_manufacture": "Germany",
                "status": InstrumentStatus.ACTIVE,
            },
            {
                "instrument_id": "NAWI-2026-003",
                "manufacturer": "OHAUS",
                "model": "Defender 5000",
                "serial_number": "OH-554109",
                "instrument_type": "Industrial Bench Scale",
                "instrument_class": "Class III",
                "maximum_capacity": 60.0,
                "minimum_capacity": 0.4,
                "verification_scale_interval": 0.02,
                "accuracy_class": "Class III",
                "status": InstrumentStatus.UNDER_TESTING,
            },
            {
                "instrument_id": "NAWI-2026-004",
                "manufacturer": "Kern & Sohn",
                "model": "PCB 10000-1",
                "serial_number": "KERN-31048",
                "instrument_type": "Precision Balance",
                "instrument_class": "Class II",
                "maximum_capacity": 10000.0,
                "minimum_capacity": 5.0,
                "verification_scale_interval": 0.1,
                "accuracy_class": "Class II",
                "status": InstrumentStatus.INACTIVE,
            },
        ]

        print("Seeding sample laboratory instruments...")
        for inst in instruments_data:
            existing_inst = db.query(Instrument).filter(Instrument.instrument_id == inst["instrument_id"]).first()
            if not existing_inst:
                instrument = Instrument(
                    country_of_manufacture=inst.get("country_of_manufacture", "Germany"),
                    **inst
                )
                db.add(instrument)
                print(f"  + Created instrument: {inst['instrument_id']}")

        # 3. Seed OIML Test Definitions (Phase 2 & 3)
        test_definitions_data = [
            {
                "code": "OIML_REPEATABILITY",
                "name": "Repeatability Test",
                "clause_reference": "OIML R 76-1 Clause A.4.4",
                "description": "Verification of agreement between repeated weighing measurements of the same load under identical test conditions.",
                "required_observations_count": 3,
                "category": "Metrological Performance",
            },
            {
                "code": "OIML_ECCENTRICITY",
                "name": "Eccentricity (Corner Load) Test",
                "clause_reference": "OIML R 76-1 Clause A.4.7",
                "description": "Evaluation of weighing performance when the load is placed at eccentric positions across the load receptor surface.",
                "required_observations_count": 4,
                "category": "Metrological Performance",
            },
            {
                "code": "OIML_WEIGHING_PERFORMANCE",
                "name": "Weighing Performance Test",
                "clause_reference": "OIML R 76-1 Clause A.4.4.1",
                "description": "Evaluation of intrinsic errors across increasing and decreasing load test points up to Maximum Capacity.",
                "required_observations_count": 5,
                "category": "Metrological Performance",
            },
            {
                "code": "OIML_TARE",
                "name": "Tare Weighing Performance Test",
                "clause_reference": "OIML R 76-1 Clause A.4.6",
                "description": "Verification of weighing accuracy with various tare loads applied according to OIML R 76 requirements.",
                "required_observations_count": 3,
                "category": "Metrological Performance",
            },
        ]

        print("Seeding OIML R 76 Test Definitions...")
        for tdef in test_definitions_data:
            existing_def = db.query(TestDefinition).filter(TestDefinition.code == tdef["code"]).first()
            if not existing_def:
                definition = TestDefinition(**tdef)
                db.add(definition)
                print(f"  + Created test definition: {tdef['name']} [{tdef['code']}]")

        # 4. Seed Configurable OIML R 76 Compliance Rules
        # Repeatability rules for all classes
        compliance_rules_data = [
            # Repeatability: Max range difference <= 1.0 e
            {
                "rule_code": "R76_REP_CLASS_I",
                "test_code": "OIML_REPEATABILITY",
                "accuracy_class": "Class I",
                "version": "OIML R 76-1:2006",
                "parameter_name": "Maximum Repeatability Range (ΔP)",
                "formula_type": "MAX_DIFFERENCE",
                "criteria_json": json.dumps({"max_difference_e": 1.0}),
                "description": "OIML R 76 Clause A.4.4.1: Max difference shall not exceed absolute MPE (1.0e).",
            },
            {
                "rule_code": "R76_REP_CLASS_II",
                "test_code": "OIML_REPEATABILITY",
                "accuracy_class": "Class II",
                "version": "OIML R 76-1:2006",
                "parameter_name": "Maximum Repeatability Range (ΔP)",
                "formula_type": "MAX_DIFFERENCE",
                "criteria_json": json.dumps({"max_difference_e": 1.0}),
                "description": "OIML R 76 Clause A.4.4.1: Max difference shall not exceed absolute MPE (1.0e).",
            },
            {
                "rule_code": "R76_REP_CLASS_III",
                "test_code": "OIML_REPEATABILITY",
                "accuracy_class": "Class III",
                "version": "OIML R 76-1:2006",
                "parameter_name": "Maximum Repeatability Range (ΔP)",
                "formula_type": "MAX_DIFFERENCE",
                "criteria_json": json.dumps({"max_difference_e": 1.0}),
                "description": "OIML R 76 Clause A.4.4.1: Max difference shall not exceed absolute MPE (1.0e).",
            },
            {
                "rule_code": "R76_REP_CLASS_IIII",
                "test_code": "OIML_REPEATABILITY",
                "accuracy_class": "Class IIII",
                "version": "OIML R 76-1:2006",
                "parameter_name": "Maximum Repeatability Range (ΔP)",
                "formula_type": "MAX_DIFFERENCE",
                "criteria_json": json.dumps({"max_difference_e": 1.0}),
                "description": "OIML R 76 Clause A.4.4.1: Max difference shall not exceed absolute MPE (1.0e).",
            },

            # Eccentricity rules
            {
                "rule_code": "R76_ECC_CLASS_I",
                "test_code": "OIML_ECCENTRICITY",
                "accuracy_class": "Class I",
                "version": "OIML R 76-1:2006",
                "parameter_name": "Maximum Eccentric Error (|E|)",
                "formula_type": "ECCENTRICITY_TOLERANCE",
                "criteria_json": json.dumps({"max_error_e": 1.0}),
                "description": "OIML R 76 Clause A.4.7: Indication error at eccentric positions shall not exceed ±1.0e.",
            },
            {
                "rule_code": "R76_ECC_CLASS_II",
                "test_code": "OIML_ECCENTRICITY",
                "accuracy_class": "Class II",
                "version": "OIML R 76-1:2006",
                "parameter_name": "Maximum Eccentric Error (|E|)",
                "formula_type": "ECCENTRICITY_TOLERANCE",
                "criteria_json": json.dumps({"max_error_e": 1.0}),
                "description": "OIML R 76 Clause A.4.7: Indication error at eccentric positions shall not exceed ±1.0e.",
            },
            {
                "rule_code": "R76_ECC_CLASS_III",
                "test_code": "OIML_ECCENTRICITY",
                "accuracy_class": "Class III",
                "version": "OIML R 76-1:2006",
                "parameter_name": "Maximum Eccentric Error (|E|)",
                "formula_type": "ECCENTRICITY_TOLERANCE",
                "criteria_json": json.dumps({"max_error_e": 1.0}),
                "description": "OIML R 76 Clause A.4.7: Indication error at eccentric positions shall not exceed ±1.0e.",
            },

            # Weighing Performance MPE Tiers (Table 6)
            {
                "rule_code": "R76_PERF_CLASS_I",
                "test_code": "OIML_WEIGHING_PERFORMANCE",
                "accuracy_class": "Class I",
                "version": "OIML R 76-1:2006",
                "parameter_name": "Maximum Permissible Error (MPE)",
                "formula_type": "MPE_TIER",
                "criteria_json": json.dumps({
                    "tiers": [
                        {"max_m_over_e": 50000, "mpe_e": 0.5},
                        {"max_m_over_e": 200000, "mpe_e": 1.0},
                        {"max_m_over_e": None, "mpe_e": 1.5}
                    ]
                }),
                "description": "OIML R 76 Table 6: Class I MPE (0-50,000e: ±0.5e, 50,000-200,000e: ±1.0e, >200,000e: ±1.5e).",
            },
            {
                "rule_code": "R76_PERF_CLASS_II",
                "test_code": "OIML_WEIGHING_PERFORMANCE",
                "accuracy_class": "Class II",
                "version": "OIML R 76-1:2006",
                "parameter_name": "Maximum Permissible Error (MPE)",
                "formula_type": "MPE_TIER",
                "criteria_json": json.dumps({
                    "tiers": [
                        {"max_m_over_e": 5000, "mpe_e": 0.5},
                        {"max_m_over_e": 20000, "mpe_e": 1.0},
                        {"max_m_over_e": None, "mpe_e": 1.5}
                    ]
                }),
                "description": "OIML R 76 Table 6: Class II MPE (0-5,000e: ±0.5e, 5,000-20,000e: ±1.0e, >20,000e: ±1.5e).",
            },
            {
                "rule_code": "R76_PERF_CLASS_III",
                "test_code": "OIML_WEIGHING_PERFORMANCE",
                "accuracy_class": "Class III",
                "version": "OIML R 76-1:2006",
                "parameter_name": "Maximum Permissible Error (MPE)",
                "formula_type": "MPE_TIER",
                "criteria_json": json.dumps({
                    "tiers": [
                        {"max_m_over_e": 500, "mpe_e": 0.5},
                        {"max_m_over_e": 2000, "mpe_e": 1.0},
                        {"max_m_over_e": None, "mpe_e": 1.5}
                    ]
                }),
                "description": "OIML R 76 Table 6: Class III MPE (0-500e: ±0.5e, 500-2,000e: ±1.0e, >2,000e: ±1.5e).",
            },

            # Tare Weighing Performance (Same as Class MPE)
            {
                "rule_code": "R76_TARE_CLASS_I",
                "test_code": "OIML_TARE",
                "accuracy_class": "Class I",
                "version": "OIML R 76-1:2006",
                "parameter_name": "Tare Weighing MPE",
                "formula_type": "MPE_TIER",
                "criteria_json": json.dumps({
                    "tiers": [
                        {"max_m_over_e": 50000, "mpe_e": 0.5},
                        {"max_m_over_e": 200000, "mpe_e": 1.0},
                        {"max_m_over_e": None, "mpe_e": 1.5}
                    ]
                }),
                "description": "OIML R 76 Clause A.4.6: Tare weighing performance shall comply with standard MPE limits.",
            },
            {
                "rule_code": "R76_TARE_CLASS_III",
                "test_code": "OIML_TARE",
                "accuracy_class": "Class III",
                "version": "OIML R 76-1:2006",
                "parameter_name": "Tare Weighing MPE",
                "formula_type": "MPE_TIER",
                "criteria_json": json.dumps({
                    "tiers": [
                        {"max_m_over_e": 500, "mpe_e": 0.5},
                        {"max_m_over_e": 2000, "mpe_e": 1.0},
                        {"max_m_over_e": None, "mpe_e": 1.5}
                    ]
                }),
                "description": "OIML R 76 Clause A.4.6: Tare weighing performance shall comply with standard MPE limits.",
            }
        ]

        print("Seeding Configurable OIML R 76 Compliance Rules...")
        for r in compliance_rules_data:
            existing_rule = db.query(ComplianceRule).filter(ComplianceRule.rule_code == r["rule_code"]).first()
            if not existing_rule:
                rule = ComplianceRule(**r)
                db.add(rule)
                print(f"  + Created compliance rule: {r['rule_code']} ({r['accuracy_class']})")

        db.commit()
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
