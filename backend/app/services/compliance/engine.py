"""
OIML R 76 Compliance Engine

Coordinates metrological calculations, rule resolution, and pass/fail/review determinations.
Stores evaluated results separately from raw observations.
"""

import json
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.test import Test, OverallVerdict
from app.models.test_instance import TestInstance, InstanceStatus, InstanceVerdict
from app.models.test_result import TestResult
from app.models.instrument import Instrument
from app.services.compliance.calculations import (
    calculate_turning_point,
    calculate_intrinsic_error,
    calculate_corrected_error,
    calculate_repeatability_range,
    calculate_eccentricity_max_error,
)
from app.services.compliance.validators import validate_observations_sufficiency
from app.services.compliance.rules import (
    get_applicable_rule,
    parse_criteria,
    evaluate_mpe_limit_for_load,
    evaluate_repeatability_criteria,
    evaluate_eccentricity_criteria,
)


class ComplianceEngine:
    """
    Core OIML R 76 metrological evaluation engine.
    """

    @classmethod
    def evaluate_test_instance(cls, db: Session, instance: TestInstance) -> TestResult:
        """
        Evaluates a single TestInstance based on its recorded observations and instrument specifications.
        """
        definition = instance.definition
        test_session = instance.test
        instrument: Instrument = test_session.instrument
        observations = instance.observations

        # 1. Validation check
        is_sufficient, validation_msg = validate_observations_sufficiency(observations, definition)
        if not is_sufficient:
            result = cls._create_or_update_result(
                db=db,
                instance=instance,
                rule=None,
                rule_version="OIML R 76-1:2006",
                calculated_values={"error": validation_msg, "observation_count": len(observations)},
                allowable_limit_desc="Minimum required observations per OIML procedure",
                verdict="INCOMPLETE",
                explanation=validation_msg,
            )
            instance.status = InstanceStatus.IN_PROGRESS
            instance.verdict = InstanceVerdict.INCOMPLETE
            instance.is_outdated = False
            instance.evaluated_at = datetime.now(timezone.utc)
            db.commit()
            return result

        # 2. Rule Resolution
        # Look up rule in database matching test code and instrument accuracy class
        rule = get_applicable_rule(
            db=db,
            test_code=definition.code,
            accuracy_class=instrument.accuracy_class
        )

        if not rule:
            # IMPORTANT: NEVER assume PASS if rule is not configured!
            explanation = (
                f"Rule not configured for test '{definition.name}' and instrument accuracy class '{instrument.accuracy_class}'. "
                "Per metrological standards, automatic approval is withheld until rule parameters are defined in system."
            )
            result = cls._create_or_update_result(
                db=db,
                instance=instance,
                rule=None,
                rule_version="Unconfigured",
                calculated_values={"status": "NO_RULE_CONFIGURED"},
                allowable_limit_desc="Not configured",
                verdict="REVIEW",
                explanation=explanation,
            )
            instance.status = InstanceStatus.EVALUATED
            instance.verdict = InstanceVerdict.REVIEW
            instance.is_outdated = False
            instance.evaluated_at = datetime.now(timezone.utc)
            db.commit()
            return result

        criteria = parse_criteria(rule)
        e = instrument.verification_scale_interval

        # 3. Perform Calculations per test procedure
        if definition.code == "OIML_REPEATABILITY":
            # Repeatability evaluation
            turning_points = []
            detailed_obs = []
            for obs in observations:
                P = calculate_turning_point(obs.indicated_value, e, obs.extra_load_added)
                E = calculate_intrinsic_error(P, obs.load_point)
                turning_points.append(P)
                detailed_obs.append({
                    "id": obs.id,
                    "load_point": obs.load_point,
                    "indicated": obs.indicated_value,
                    "extra_load": obs.extra_load_added,
                    "turning_point_P": P,
                    "intrinsic_error_E": E,
                })

            delta_P = calculate_repeatability_range(turning_points)
            passed, limit_val, limit_desc, explanation = evaluate_repeatability_criteria(delta_P, e, criteria)

            calc_summary = {
                "procedure": "Repeatability (OIML Clause A.4.4)",
                "observations": detailed_obs,
                "turning_points": turning_points,
                "max_difference_delta_P": delta_P,
                "allowable_limit": limit_val,
                "verification_interval_e": e,
            }
            verdict = "PASS" if passed else "FAIL"

        elif definition.code == "OIML_ECCENTRICITY":
            # Eccentricity evaluation
            detailed_obs = []
            errors = []
            for obs in observations:
                P = calculate_turning_point(obs.indicated_value, e, obs.extra_load_added)
                E = calculate_intrinsic_error(P, obs.load_point)
                errors.append(E)
                detailed_obs.append({
                    "id": obs.id,
                    "position": obs.position_label or "Unspecified",
                    "load_point": obs.load_point,
                    "indicated": obs.indicated_value,
                    "turning_point_P": P,
                    "intrinsic_error_E": E,
                })

            max_abs_err, max_pos_diff = calculate_eccentricity_max_error(errors)
            passed, limit_val, limit_desc, explanation = evaluate_eccentricity_criteria(max_abs_err, e, criteria)

            calc_summary = {
                "procedure": "Eccentricity (OIML Clause A.4.7)",
                "observations": detailed_obs,
                "max_absolute_error": max_abs_err,
                "max_positional_difference": max_pos_diff,
                "allowable_limit": limit_val,
                "verification_interval_e": e,
            }
            verdict = "PASS" if passed else "FAIL"

        elif definition.code in ("OIML_WEIGHING_PERFORMANCE", "OIML_TARE"):
            # General Weighing Performance / Tare test
            detailed_obs = []
            all_pass = True
            first_zero_error = 0.0

            # Find zero error if zero point is present
            zero_obs = [o for o in observations if o.load_point == 0]
            if zero_obs:
                z = zero_obs[0]
                P0 = calculate_turning_point(z.indicated_value, e, z.extra_load_added)
                first_zero_error = calculate_intrinsic_error(P0, 0.0)

            for obs in observations:
                P = calculate_turning_point(obs.indicated_value, e, obs.extra_load_added)
                E = calculate_intrinsic_error(P, obs.load_point)
                Ec = calculate_corrected_error(E, first_zero_error)
                limit_val, limit_label = evaluate_mpe_limit_for_load(obs.load_point, e, criteria)
                is_point_pass = round(abs(Ec), 7) <= round(limit_val, 7)
                if not is_point_pass:
                    all_pass = False

                detailed_obs.append({
                    "id": obs.id,
                    "load_point": obs.load_point,
                    "indicated": obs.indicated_value,
                    "turning_point_P": P,
                    "intrinsic_error_E": E,
                    "corrected_error_Ec": Ec,
                    "mpe_limit": limit_val,
                    "mpe_label": limit_label,
                    "passed": is_point_pass,
                })

            verdict = "PASS" if all_pass else "FAIL"
            limit_desc = f"MPE tiers for {instrument.accuracy_class} per OIML R 76 Table 6"
            explanation = (
                "All load points evaluated within maximum permissible error (MPE) tolerances."
                if all_pass
                else "One or more test load points exceeded maximum permissible error limits."
            )
            calc_summary = {
                "procedure": definition.name,
                "zero_error_E0": first_zero_error,
                "observations": detailed_obs,
                "verification_interval_e": e,
            }

        else:
            # Custom / unhandled test code -> REVIEW
            verdict = "REVIEW"
            limit_desc = "Custom definition criteria"
            explanation = f"Automated calculation handler for test definition code '{definition.code}' requires manual metrologist review."
            calc_summary = {"observations_count": len(observations)}

        # 4. Save Test Result record
        result = cls._create_or_update_result(
            db=db,
            instance=instance,
            rule=rule,
            rule_version=rule.version,
            calculated_values=calc_summary,
            allowable_limit_desc=limit_desc,
            verdict=verdict,
            explanation=explanation,
        )

        instance.status = InstanceStatus.EVALUATED
        instance.verdict = InstanceVerdict(verdict)
        instance.is_outdated = False
        instance.evaluated_at = datetime.now(timezone.utc)
        instance.evaluation_summary = explanation
        db.commit()

        # Update parent test overall verdict
        cls.recalculate_test_overall_verdict(db, test_session)

        return result

    @classmethod
    def _create_or_update_result(
        cls,
        db: Session,
        instance: TestInstance,
        rule: Any,
        rule_version: str,
        calculated_values: Dict[str, Any],
        allowable_limit_desc: str,
        verdict: str,
        explanation: str,
    ) -> TestResult:
        result = db.query(TestResult).filter(TestResult.instance_id == instance.id).first()
        if not result:
            result = TestResult(
                instance_id=instance.id,
                rule_id=rule.id if rule else None,
                applicable_rule_code=rule.rule_code if rule else None,
                rule_version=rule_version,
                calculated_values_json=json.dumps(calculated_values),
                allowable_limit_description=allowable_limit_desc,
                verdict=verdict,
                explanation=explanation,
            )
            db.add(result)
        else:
            result.rule_id = rule.id if rule else None
            result.applicable_rule_code = rule.rule_code if rule else None
            result.rule_version = rule_version
            result.calculated_values_json = json.dumps(calculated_values)
            result.allowable_limit_description = allowable_limit_desc
            result.verdict = verdict
            result.explanation = explanation
            result.evaluated_at = datetime.now(timezone.utc)

        db.flush()
        return result

    @classmethod
    def recalculate_test_overall_verdict(cls, db: Session, test: Test) -> OverallVerdict:
        """
        Determines overall test session verdict from all child test instances:
        - Any FAIL -> FAIL
        - Else any REVIEW -> REVIEW
        - Else any INCOMPLETE or PENDING -> PENDING / INCOMPLETE
        - If all instances PASS -> PASS
        """
        instances = test.test_instances
        if not instances or len(instances) == 0:
            test.overall_verdict = OverallVerdict.PENDING
            db.commit()
            return OverallVerdict.PENDING

        verdicts = [inst.verdict.value for inst in instances]

        if "FAIL" in verdicts:
            overall = OverallVerdict.FAIL
        elif "REVIEW" in verdicts:
            overall = OverallVerdict.REVIEW
        elif "INCOMPLETE" in verdicts or "PENDING" in verdicts:
            overall = OverallVerdict.INCOMPLETE
        elif all(v == "PASS" for v in verdicts):
            overall = OverallVerdict.PASS
        else:
            overall = OverallVerdict.REVIEW

        test.overall_verdict = overall
        db.commit()
        return overall
