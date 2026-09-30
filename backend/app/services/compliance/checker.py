"""
OIML R-76 Compliance Checking Module

Performs fine-grained regulatory compliance verification:
- Evaluates calculated test metrics against applicable OIML R-76 requirements
- Computes exact deviations from permissible limits (absolute and relative to scale interval 'e')
- Generates point-by-point compliance matrices highlighting passed and failed points
- Formulates clear, legal-metrology failure rationales for non-conforming tests
- Prepares structured compliance payloads ready for inclusion in standardized reports
"""

import json
from typing import Dict, Any, List, Optional
from app.models.test import Test
from app.models.test_instance import TestInstance
from app.models.compliance_rule import ComplianceRule
from app.services.compliance.rules import get_applicable_rule, parse_criteria, evaluate_mpe_limit_for_load


class OIMLComplianceChecker:
    """
    Comprehensive compliance checking module for OIML R-76 Non-Automatic Weighing Instruments.
    """

    @classmethod
    def check_test_compliance(cls, test: Test) -> Dict[str, Any]:
        """
        Runs comprehensive compliance verification across all procedures in a test session.
        Returns a structured compliance payload with highlighted failure reasons and exact deviations.
        """
        instrument = test.instrument
        e = instrument.verification_scale_interval
        accuracy_class = instrument.accuracy_class

        procedures_compliance = []
        overall_pass = True
        failed_count = 0
        passed_count = 0

        for instance in test.test_instances:
            definition = instance.definition
            results = instance.results
            latest_result = results[0] if results else None

            calc_data: Dict[str, Any] = {}
            if latest_result and latest_result.calculated_values_json:
                try:
                    calc_data = json.loads(latest_result.calculated_values_json)
                except Exception:
                    calc_data = {}

            # Analyze individual procedure
            proc_check = cls._check_procedure_compliance(
                definition_code=definition.code,
                definition_name=definition.name,
                clause_ref=definition.clause_reference,
                accuracy_class=accuracy_class,
                e=e,
                calc_data=calc_data,
                verdict=latest_result.verdict if latest_result else "INCOMPLETE",
                rule_version=latest_result.rule_version if latest_result else "OIML R 76-1:2006",
                applicable_rule_code=latest_result.applicable_rule_code if latest_result else None,
                explanation=latest_result.explanation if latest_result else "Procedure not evaluated"
            )

            if proc_check["verdict"] == "FAIL":
                overall_pass = False
                failed_count += 1
            elif proc_check["verdict"] == "PASS":
                passed_count += 1
            else:
                overall_pass = False

            procedures_compliance.append(proc_check)

        overall_status = "PASS" if (overall_pass and len(procedures_compliance) > 0 and failed_count == 0) else ("FAIL" if failed_count > 0 else "REVIEW")

        return {
            "test_id": test.test_id,
            "instrument_id": instrument.instrument_id,
            "accuracy_class": accuracy_class,
            "verification_scale_interval_e": e,
            "overall_status": overall_status,
            "total_procedures": len(procedures_compliance),
            "passed_procedures": passed_count,
            "failed_procedures": failed_count,
            "procedures": procedures_compliance,
        }

    @classmethod
    def _check_procedure_compliance(
        cls,
        definition_code: str,
        definition_name: str,
        clause_ref: str,
        accuracy_class: str,
        e: float,
        calc_data: Dict[str, Any],
        verdict: str,
        rule_version: str,
        applicable_rule_code: Optional[str],
        explanation: str
    ) -> Dict[str, Any]:
        """
        Calculates exact deviations and failure rationales for a specific procedure.
        """
        point_evaluations: List[Dict[str, Any]] = []
        is_procedure_pass = (verdict == "PASS")
        failure_reasons: List[str] = []

        if definition_code == "OIML_REPEATABILITY":
            delta_P = calc_data.get("max_difference_delta_P", 0.0)
            limit = calc_data.get("allowable_limit", e)
            deviation = round(delta_P - limit, 6)
            deviation_in_e = round(deviation / e, 2) if e > 0 else 0.0

            passed = delta_P <= limit
            if not passed:
                is_procedure_pass = False
                failure_reasons.append(
                    f"Repeatability range ΔP = {delta_P} g exceeds allowable tolerance of {limit} g by {deviation} g ({deviation_in_e}e)."
                )

            point_evaluations.append({
                "parameter": "Repeatability Range (ΔP = P_max - P_min)",
                "observed_value": f"{delta_P} g",
                "permissible_limit": f"≤ {limit} g (1.0e)",
                "error_or_deviation": f"{'+' if deviation > 0 else ''}{deviation} g",
                "status": "PASS" if passed else "FAIL",
                "is_failed": not passed,
                "notes": "Clause A.4.4.1 requirement"
            })

        elif definition_code == "OIML_ECCENTRICITY":
            max_abs_err = calc_data.get("max_absolute_error", 0.0)
            limit = calc_data.get("allowable_limit", e)
            deviation = round(max_abs_err - limit, 6)
            deviation_in_e = round(deviation / e, 2) if e > 0 else 0.0

            passed = max_abs_err <= limit
            if not passed:
                is_procedure_pass = False
                failure_reasons.append(
                    f"Maximum eccentric loading error |E| = {max_abs_err} g exceeds allowable limit of ±{limit} g by {deviation} g ({deviation_in_e}e)."
                )

            # Check individual eccentric positions
            observations = calc_data.get("observations", [])
            for obs in observations:
                E = obs.get("intrinsic_error_E", 0.0)
                pos = obs.get("position", "Position")
                pos_pass = abs(E) <= limit
                pos_dev = round(abs(E) - limit, 6)
                point_evaluations.append({
                    "parameter": f"Eccentric Position: {pos}",
                    "observed_value": f"E = {E} g (Ind: {obs.get('indicated')})",
                    "permissible_limit": f"±{limit} g (1.0e)",
                    "error_or_deviation": f"{'+' if pos_dev > 0 else ''}{pos_dev} g" if not pos_pass else "Within tolerance",
                    "status": "PASS" if pos_pass else "FAIL",
                    "is_failed": not pos_pass,
                    "notes": f"Applied load: {obs.get('load_point')} kg"
                })

        elif definition_code in ("OIML_WEIGHING_PERFORMANCE", "OIML_TARE"):
            observations = calc_data.get("observations", [])
            for obs in observations:
                Ec = obs.get("corrected_error_Ec", obs.get("intrinsic_error_E", 0.0))
                mpe = obs.get("mpe_limit", e)
                mpe_label = obs.get("mpe_label", f"±{mpe} g")
                passed = obs.get("passed", abs(Ec) <= mpe)
                dev = round(abs(Ec) - mpe, 6)

                if not passed:
                    is_procedure_pass = False
                    failure_reasons.append(
                        f"At load {obs.get('load_point')} kg: corrected error Ec = {Ec} g exceeds permissible limit {mpe_label} by {dev} g."
                    )

                point_evaluations.append({
                    "parameter": f"Load Point {obs.get('load_point')} kg",
                    "observed_value": f"Ec = {Ec} g (Ind: {obs.get('indicated')})",
                    "permissible_limit": mpe_label,
                    "error_or_deviation": f"{'+' if dev > 0 else ''}{dev} g" if not passed else "Within tolerance",
                    "status": "PASS" if passed else "FAIL",
                    "is_failed": not passed,
                    "notes": f"P = {obs.get('turning_point_P')} g"
                })

        return {
            "procedure_code": definition_code,
            "procedure_name": definition_name,
            "clause_reference": clause_ref,
            "rule_version": rule_version,
            "applicable_rule_code": applicable_rule_code or "OIML Standard",
            "verdict": "PASS" if is_procedure_pass else ("FAIL" if failure_reasons else verdict),
            "is_failed": not is_procedure_pass,
            "failure_reasons": failure_reasons,
            "summary_explanation": explanation,
            "points": point_evaluations,
        }
