"""
Production Database Seeder Script

Initializes the database with standard OIML R-76-1:2006 test definitions,
legal compliance rules across all 4 accuracy classes (Class I, II, III, IIII),
and default role accounts for immediate deployment.
"""

import json
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.test_definition import TestDefinition
from app.models.compliance_rule import ComplianceRule

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("=== Seeding Production Database ===")

    # 1. Seed Default Users
    users_data = [
        {"name": "Laboratory Director", "email": "admin@nawi-lab.org", "password": "AdminPassword@123", "role": UserRole.ADMIN},
        {"name": "Senior Metrologist", "email": "tester@nawi-lab.org", "password": "TesterPassword@123", "role": UserRole.TESTER},
        {"name": "Technical Signatory", "email": "reviewer@nawi-lab.org", "password": "ReviewerPassword@123", "role": UserRole.REVIEWER},
        {"name": "Compliance Auditor", "email": "viewer@nawi-lab.org", "password": "ViewerPassword@123", "role": UserRole.VIEWER},
    ]

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
            print(f"[+] Created user: {u['email']} [{u['role'].value}]")

    db.commit()

    # 2. Seed Standard OIML Test Definitions
    defs_data = [
        {
            "code": "OIML_REPEATABILITY",
            "name": "Repeatability Test",
            "clause_reference": "OIML R 76-1:2006 Clause A.4.4",
            "description": "Verification of agreement between repeated weighings at identical load point (typically 0.5 Max or Max).",
            "required_observations_count": 3,
        },
        {
            "code": "OIML_ECCENTRICITY",
            "name": "Eccentricity (Corner Load) Test",
            "clause_reference": "OIML R 76-1:2006 Clause A.4.7",
            "description": "Evaluation of off-center load placement at 1/3 Max across Center, Front-Left, Front-Right, Rear-Left, Rear-Right positions.",
            "required_observations_count": 4,
        },
        {
            "code": "OIML_WEIGHING_PERFORMANCE",
            "name": "Weighing Performance (Linearity) Test",
            "clause_reference": "OIML R 76-1:2006 Clause A.4.4.3 & Table 6",
            "description": "Evaluation of intrinsic errors across increasing and decreasing load points against MPE tolerance bands.",
            "required_observations_count": 5,
        },
        {
            "code": "OIML_TARE",
            "name": "Tare Weighing Test",
            "clause_reference": "OIML R 76-1:2006 Clause A.4.6",
            "description": "Evaluation of weighing performance and zero setting with tare device engaged.",
            "required_observations_count": 3,
        },
    ]

    for d in defs_data:
        existing = db.query(TestDefinition).filter(TestDefinition.code == d["code"]).first()
        if not existing:
            tdef = TestDefinition(**d)
            db.add(tdef)
            print(f"[+] Created test definition: {d['code']}")

    db.commit()

    # 3. Seed OIML Compliance Rules
    rules_data = [
        # Class I (Special)
        {
            "rule_code": "RULE_OIML_R76_CLASS_I_WP",
            "test_code": "OIML_WEIGHING_PERFORMANCE",
            "accuracy_class": "Class I",
            "version": "OIML R 76-1:2006",
            "parameter_name": "Class I MPE Tolerance Tiers",
            "formula_type": "table_6_tiers",
            "criteria_json": json.dumps({
                "tiers": [
                    {"max_m_over_e": 50000, "mpe_e": 0.5},
                    {"max_m_over_e": 200000, "mpe_e": 1.0},
                    {"max_m_over_e": None, "mpe_e": 1.5}
                ]
            }),
            "description": "OIML R 76 Table 6 MPE limits for Class I instruments",
            "is_active": True,
        },
        # Class II (High)
        {
            "rule_code": "RULE_OIML_R76_CLASS_II_WP",
            "test_code": "OIML_WEIGHING_PERFORMANCE",
            "accuracy_class": "Class II",
            "version": "OIML R 76-1:2006",
            "parameter_name": "Class II MPE Tolerance Tiers",
            "formula_type": "table_6_tiers",
            "criteria_json": json.dumps({
                "tiers": [
                    {"max_m_over_e": 5000, "mpe_e": 0.5},
                    {"max_m_over_e": 20000, "mpe_e": 1.0},
                    {"max_m_over_e": None, "mpe_e": 1.5}
                ]
            }),
            "description": "OIML R 76 Table 6 MPE limits for Class II instruments",
            "is_active": True,
        },
        # Class III (Medium)
        {
            "rule_code": "RULE_OIML_R76_CLASS_III_WP",
            "test_code": "OIML_WEIGHING_PERFORMANCE",
            "accuracy_class": "Class III",
            "version": "OIML R 76-1:2006",
            "parameter_name": "Class III MPE Tolerance Tiers",
            "formula_type": "table_6_tiers",
            "criteria_json": json.dumps({
                "tiers": [
                    {"max_m_over_e": 500, "mpe_e": 0.5},
                    {"max_m_over_e": 2000, "mpe_e": 1.0},
                    {"max_m_over_e": None, "mpe_e": 1.5}
                ]
            }),
            "description": "OIML R 76 Table 6 MPE limits for Class III instruments",
            "is_active": True,
        },
        # Class IIII (Ordinary)
        {
            "rule_code": "RULE_OIML_R76_CLASS_IIII_WP",
            "test_code": "OIML_WEIGHING_PERFORMANCE",
            "accuracy_class": "Class IIII",
            "version": "OIML R 76-1:2006",
            "parameter_name": "Class IIII MPE Tolerance Tiers",
            "formula_type": "table_6_tiers",
            "criteria_json": json.dumps({
                "tiers": [
                    {"max_m_over_e": 50, "mpe_e": 0.5},
                    {"max_m_over_e": 200, "mpe_e": 1.0},
                    {"max_m_over_e": None, "mpe_e": 1.5}
                ]
            }),
            "description": "OIML R 76 Table 6 MPE limits for Class IIII instruments",
            "is_active": True,
        },
        # Repeatability Rule (All classes)
        {
            "rule_code": "RULE_OIML_R76_REPEATABILITY_GENERIC",
            "test_code": "OIML_REPEATABILITY",
            "accuracy_class": "Class II",
            "version": "OIML R 76-1:2006",
            "parameter_name": "Repeatability Span Limit",
            "formula_type": "repeatability_span",
            "criteria_json": json.dumps({"max_difference_e": 1.0}),
            "description": "Maximum difference between results shall not exceed absolute MPE for the load applied (Clause A.4.4.1)",
            "is_active": True,
        },
        # Eccentricity Rule (All classes)
        {
            "rule_code": "RULE_OIML_R76_ECCENTRICITY_GENERIC",
            "test_code": "OIML_ECCENTRICITY",
            "accuracy_class": "Class II",
            "version": "OIML R 76-1:2006",
            "parameter_name": "Eccentricity Error Limit",
            "formula_type": "eccentricity_single_load",
            "criteria_json": json.dumps({"max_error_e": 1.0}),
            "description": "Error at each position shall not exceed maximum permissible error for load applied (Clause A.4.7)",
            "is_active": True,
        },
    ]

    for r in rules_data:
        existing = db.query(ComplianceRule).filter(ComplianceRule.rule_code == r["rule_code"]).first()
        if not existing:
            rule = ComplianceRule(**r)
            db.add(rule)
            print(f"[+] Created rule: {r['rule_code']} [{r['accuracy_class']}]")

    db.commit()
    db.close()
    print("=== Database Seeding Complete ===")

if __name__ == "__main__":
    seed_database()
