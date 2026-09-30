"""
OIML Compliance Rule Resolver

Fetches configurable rules from database and evaluates calculated values against configured criteria.
Strict compliance rule: If a rule is missing, NEVER assume PASS; return REVIEW with 'Rule not configured'.
"""

import json
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.compliance_rule import ComplianceRule


def get_applicable_rule(
    db: Session,
    test_code: str,
    accuracy_class: str,
    version: Optional[str] = None
) -> Optional[ComplianceRule]:
    """
    Retrieves the active compliance rule from database.
    """
    query = db.query(ComplianceRule).filter(
        ComplianceRule.test_code == test_code,
        ComplianceRule.accuracy_class == accuracy_class,
        ComplianceRule.is_active == True,
    )
    if version:
        query = query.filter(ComplianceRule.version == version)

    return query.first()


def parse_criteria(rule: ComplianceRule) -> Dict[str, Any]:
    """Parses JSON-encoded criteria from database rule."""
    try:
        return json.loads(rule.criteria_json)
    except Exception:
        return {}


def evaluate_mpe_limit_for_load(
    load_point: float,
    scale_interval_e: float,
    criteria: Dict[str, Any]
) -> Tuple[float, str]:
    """
    Evaluates configured Maximum Permissible Error (MPE) for a given load point.
    Criteria format:
    {
      "tiers": [
        {"max_m_over_e": 50000, "mpe_e": 0.5},
        {"max_m_over_e": 200000, "mpe_e": 1.0},
        {"max_m_over_e": null, "mpe_e": 1.5}
      ]
    }
    """
    tiers = criteria.get("tiers", [])
    if not tiers or scale_interval_e <= 0:
        default_mpe_e = criteria.get("default_mpe_e", 1.0)
        limit_val = default_mpe_e * scale_interval_e
        return limit_val, f"±{default_mpe_e}e (±{limit_val} g/kg)"

    m_over_e = load_point / scale_interval_e
    for tier in tiers:
        max_limit = tier.get("max_m_over_e")
        if max_limit is None or m_over_e <= max_limit:
            mpe_e = tier.get("mpe_e", 1.0)
            limit_val = round(mpe_e * scale_interval_e, 6)
            return limit_val, f"±{mpe_e}e (±{limit_val})"

    # Fallback to last tier
    last_mpe_e = tiers[-1].get("mpe_e", 1.5)
    limit_val = round(last_mpe_e * scale_interval_e, 6)
    return limit_val, f"±{last_mpe_e}e (±{limit_val})"


def evaluate_repeatability_criteria(
    max_difference: float,
    scale_interval_e: float,
    criteria: Dict[str, Any]
) -> Tuple[bool, float, str, str]:
    """
    Evaluates Repeatability test: delta_P <= allowable_limit.
    Under OIML R 76, max difference must not exceed absolute MPE at that load point.
    """
    allowable_multiplier = criteria.get("max_difference_e", 1.0)
    allowable_limit = round(allowable_multiplier * scale_interval_e, 6)

    limit_desc = f"Max permissible difference: ≤ {allowable_multiplier}e ({allowable_limit})"
    passed = round(max_difference, 7) <= round(allowable_limit, 7)
    explanation = (
        f"Calculated range ΔP = {max_difference} is within allowable limit of {allowable_limit}."
        if passed
        else f"Calculated range ΔP = {max_difference} exceeds maximum allowable limit of {allowable_limit}."
    )
    return passed, allowable_limit, limit_desc, explanation


def evaluate_eccentricity_criteria(
    max_error: float,
    scale_interval_e: float,
    criteria: Dict[str, Any]
) -> Tuple[bool, float, str, str]:
    """
    Evaluates Eccentricity test: max |E_i| <= allowable_limit.
    """
    allowable_multiplier = criteria.get("max_error_e", 1.0)
    allowable_limit = round(allowable_multiplier * scale_interval_e, 6)

    limit_desc = f"Max permissible eccentric error: ≤ ±{allowable_multiplier}e (±{allowable_limit})"
    passed = round(abs(max_error), 7) <= round(allowable_limit, 7)
    explanation = (
        f"Maximum eccentric error |E| = {abs(max_error)} is within allowable limit of ±{allowable_limit}."
        if passed
        else f"Maximum eccentric error |E| = {abs(max_error)} exceeds allowable limit of ±{allowable_limit}."
    )
    return passed, allowable_limit, limit_desc, explanation
