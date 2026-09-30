"""
Demo Environment Preparation Script for 4-Minute Video Recording

Populates the NAWI system with realistic instruments, completed tests,
pending review tests, OIML certificates, and audit logs for video presentation.
"""

import json
from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.instrument import Instrument, InstrumentStatus
from app.models.test_definition import TestDefinition
from app.models.compliance_rule import ComplianceRule
from app.models.test import Test, TestStatus, OverallVerdict
from app.models.environmental_condition import EnvironmentalCondition
from app.models.test_instance import TestInstance, InstanceStatus, InstanceVerdict
from app.models.observation import Observation
from app.models.test_result import TestResult
from app.models.report import Report
from app.models.audit_log import AuditLog
from app.services.reports.generator import ReportGenerator

def prepare_demo_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("=== Preparing Rich Demo Dataset for Video Recording ===")

    # 1. Ensure Standard Accounts
    accounts = [
        {"name": "Dr. Sarah Jenkins", "email": "admin@nawi-lab.org", "password": "AdminPassword@123", "role": UserRole.ADMIN},
        {"name": "Marcus Vance", "email": "tester@nawi-lab.org", "password": "TesterPassword@123", "role": UserRole.TESTER},
        {"name": "Elena Rostova", "email": "reviewer@nawi-lab.org", "password": "ReviewerPassword@123", "role": UserRole.REVIEWER},
        {"name": "Arthur Pendelton", "email": "viewer@nawi-lab.org", "password": "ViewerPassword@123", "role": UserRole.VIEWER},
    ]
    user_map = {}
    for acc in accounts:
        u = db.query(User).filter(User.email == acc["email"]).first()
        if not u:
            u = User(
                name=acc["name"],
                email=acc["email"],
                password_hash=get_password_hash(acc["password"]),
                role=acc["role"],
                is_active=True
            )
            db.add(u)
            db.commit()
            db.refresh(u)
        user_map[acc["role"]] = u

    # 2. Seed Realistic Showcase Instruments
    demo_instruments = [
        {
            "instrument_id": "INST-2026-001",
            "manufacturer": "Mettler Toledo",
            "model": "XPR205 Analytical Balance",
            "serial_number": "MT-9948210",
            "instrument_type": "Analytical Balance",
            "instrument_class": "Class I",
            "maximum_capacity": 220.0,
            "minimum_capacity": 0.001,
            "verification_scale_interval": 0.001,
            "accuracy_class": "Class I",
            "country_of_manufacture": "Switzerland",
            "status": "Active"
        },
        {
            "instrument_id": "INST-2026-002",
            "manufacturer": "Sartorius AG",
            "model": "Secura 324-1S",
            "serial_number": "SAR-882103",
            "instrument_type": "Precision Laboratory Balance",
            "instrument_class": "Class I",
            "maximum_capacity": 320.0,
            "minimum_capacity": 0.001,
            "verification_scale_interval": 0.001,
            "accuracy_class": "Class I",
            "country_of_manufacture": "Germany",
            "status": "Active"
        },
        {
            "instrument_id": "INST-2026-003",
            "manufacturer": "Kern & Sohn GmbH",
            "model": "EG 2200-2NM",
            "serial_number": "KERN-77402",
            "instrument_type": "Precision Weighing Scale",
            "instrument_class": "Class II",
            "maximum_capacity": 2200.0,
            "minimum_capacity": 0.5,
            "verification_scale_interval": 0.01,
            "accuracy_class": "Class II",
            "country_of_manufacture": "Germany",
            "status": "Active"
        },
        {
            "instrument_id": "INST-2026-004",
            "manufacturer": "Ohaus Corporation",
            "model": "Defender 5000",
            "serial_number": "OH-552194",
            "instrument_type": "Industrial Bench Scale",
            "instrument_class": "Class III",
            "maximum_capacity": 15000.0,
            "minimum_capacity": 20.0,
            "verification_scale_interval": 1.0,
            "accuracy_class": "Class III",
            "country_of_manufacture": "United States",
            "status": "Active"
        },
    ]

    for d_inst in demo_instruments:
        existing = db.query(Instrument).filter(Instrument.instrument_id == d_inst["instrument_id"]).first()
        if not existing:
            inst = Instrument(**d_inst)
            db.add(inst)
            db.commit()

    print("[+] Demo Instruments Verified")

    # 3. Create a Showcase Pending Review Test (Ready for Reviewer Demo)
    inst_kern = db.query(Instrument).filter(Instrument.instrument_id == "INST-2026-003").first()
    existing_pending = db.query(Test).filter(Test.status == TestStatus.UNDER_REVIEW).first()
    if not existing_pending and inst_kern:
        test_under_review = Test(
            test_id="TEST-2026-0088",
            instrument_id=inst_kern.id,
            tester_id=user_map[UserRole.TESTER].id,
            laboratory_name="National Metrology Institute (NMI) Verification Lab",
            test_location="Chamber B, Workstation 4",
            remarks="Full calibration run awaiting signatory authorization",
            status=TestStatus.UNDER_REVIEW,
            overall_verdict=OverallVerdict.PASS,
            started_at=datetime.now(timezone.utc) - timedelta(hours=2),
        )
        db.add(test_under_review)
        db.flush()

        env = EnvironmentalCondition(
            test_id=test_under_review.id,
            temperature_celsius=20.2,
            relative_humidity_percent=46.8,
            atmospheric_pressure_kpa=101.35,
            test_location="Chamber B",
            reference_standards="OIML Class E2 Weights Set SN-449"
        )
        db.add(env)

        # Attach Weighing Performance procedure
        def_wp = db.query(TestDefinition).filter(TestDefinition.code == "OIML_WEIGHING_PERFORMANCE").first()
        if def_wp:
            inst_wp = TestInstance(
                test_id=test_under_review.id,
                definition_id=def_wp.id,
                status=InstanceStatus.EVALUATED,
                verdict=InstanceVerdict.PASS,
                is_outdated=False,
                evaluated_at=datetime.now(timezone.utc) - timedelta(hours=1),
            )
            db.add(inst_wp)
            db.flush()

            # Add observations
            e = inst_kern.verification_scale_interval
            for i, load in enumerate([0.0, 100.0, 500.0, 1000.0, 2000.0]):
                obs = Observation(
                    instance_id=inst_wp.id,
                    load_point=load,
                    indicated_value=load,
                    extra_load_added=0.005,
                    sequence_order=i + 1
                )
                db.add(obs)

            # Test result
            res = TestResult(
                instance_id=inst_wp.id,
                rule_version="OIML R 76-1:2006",
                calculated_values_json=json.dumps({"procedure": "Weighing Performance", "status": "ALL_POINTS_WITHIN_MPE"}),
                allowable_limit_description="OIML R 76 Table 6 Class II tiers",
                verdict="PASS",
                explanation="All load points evaluated within maximum permissible error (MPE) limits."
            )
            db.add(res)

        # Audit log entry
        audit = AuditLog(
            user_id=user_map[UserRole.TESTER].id,
            action="SUBMIT_FOR_REVIEW",
            entity_type="test",
            entity_id=test_under_review.id,
            reference_number=test_under_review.test_id,
            details_json=json.dumps({"test_id": test_under_review.test_id, "verdict": "PASS"})
        )
        db.add(audit)
        db.commit()
        print(f"[+] Created Pending Review Showcase: {test_under_review.test_id}")

    db.close()
    print("=== Demo Data Preparation Completed Successfully ===")

if __name__ == "__main__":
    prepare_demo_data()
