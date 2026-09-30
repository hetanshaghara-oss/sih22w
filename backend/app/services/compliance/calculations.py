"""
OIML R 76 Metrological Calculation Service

Implements standard metrological calculation algorithms according to OIML R 76-1 (2006):
- Turning Point determination: P = I + 0.5e - dL
- Intrinsic error before rounding: E = P - L
- Corrected error: Ec = E - E0
- Range difference for repeatability: delta_P = P_max - P_min
- Eccentricity deviation: delta_E = max |E_i|
"""

from typing import List, Dict, Any, Tuple


def calculate_turning_point(indicated: float, verification_interval: float, extra_load: float = 0.0) -> float:
    """
    OIML R 76-1 Clause A.4.4.3: Determination of turning point.
    P = I + 0.5e - dL
    If extra_load is 0, P equals indicated reading I.
    """
    if extra_load > 0:
        return round(indicated + 0.5 * verification_interval - extra_load, 6)
    return round(indicated, 6)


def calculate_intrinsic_error(turning_point: float, applied_load: float) -> float:
    """
    OIML R 76-1 Clause A.4.4.3: Error before rounding.
    E = P - L
    """
    return round(turning_point - applied_load, 6)


def calculate_corrected_error(intrinsic_error: float, zero_error: float = 0.0) -> float:
    """
    OIML R 76-1 Clause A.4.4.3: Corrected error taking into account zero error.
    Ec = E - E0
    """
    return round(intrinsic_error - zero_error, 6)


def calculate_repeatability_range(turning_points: List[float]) -> float:
    """
    OIML R 76-1 Clause A.4.4.1: Difference between maximum and minimum results.
    delta_P = P_max - P_min
    """
    if not turning_points:
        return 0.0
    return round(max(turning_points) - min(turning_points), 6)


def calculate_eccentricity_max_error(errors: List[float]) -> Tuple[float, float]:
    """
    OIML R 76-1 Clause A.4.7: Maximum absolute error and maximum difference between positions.
    """
    if not errors:
        return 0.0, 0.0
    max_abs_err = max(abs(e) for e in errors)
    max_diff = max(errors) - min(errors)
    return round(max_abs_err, 6), round(max_diff, 6)
