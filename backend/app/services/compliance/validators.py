"""
OIML Observation Validators

Validates raw observation counts and input requirements prior to metrological evaluation.
"""

from typing import List, Tuple
from app.models.observation import Observation
from app.models.test_definition import TestDefinition


def validate_observations_sufficiency(
    observations: List[Observation],
    definition: TestDefinition
) -> Tuple[bool, str]:
    """
    Validates if the recorded observations meet minimum test definition criteria.
    """
    if not observations or len(observations) == 0:
        return False, "No observations recorded. Please enter test readings."

    required = definition.required_observations_count or 3
    if len(observations) < required:
        return False, f"Incomplete dataset: Test '{definition.name}' requires at least {required} observations (recorded: {len(observations)})."

    # Verify all observations have non-negative applied load
    for idx, obs in enumerate(observations, 1):
        if obs.load_point < 0:
            return False, f"Observation #{idx} has invalid negative load point ({obs.load_point})."
        if obs.indicated_value < 0:
            return False, f"Observation #{idx} has invalid negative indicated reading ({obs.indicated_value})."

    return True, "Valid"
