import pytest
from app.services.compliance.calculations import (
    calculate_turning_point,
    calculate_intrinsic_error,
    calculate_corrected_error,
    calculate_repeatability_range,
    calculate_eccentricity_max_error,
)
from app.services.compliance.rules import (
    evaluate_mpe_limit_for_load,
    evaluate_repeatability_criteria,
    evaluate_eccentricity_criteria,
)

def test_turning_point_clause_a443():
    """
    OIML R 76-1:2006 Clause A.4.4.3: P = I + 0.5e - delta_L
    """
    e = 0.01  # grams
    indicated = 100.00
    extra_load = 0.004
    # P = 100.00 + 0.005 - 0.004 = 100.001
    P = calculate_turning_point(indicated, e, extra_load)
    assert pytest.approx(P, rel=1e-6) == 100.001


def test_intrinsic_and_corrected_error():
    """
    E = P - L
    Ec = E - E0
    """
    L = 100.000
    P = 100.003
    E = calculate_intrinsic_error(P, L)
    assert pytest.approx(E, rel=1e-6) == 0.003

    E0 = 0.001
    Ec = calculate_corrected_error(E, E0)
    assert pytest.approx(Ec, rel=1e-6) == 0.002


def test_class_i_mpe_table_6_tiers():
    """
    OIML R 76 Table 6 Class I:
    0 <= m <= 50,000e: MPE = +/- 0.5e
    50,000e < m <= 200,000e: MPE = +/- 1.0e
    m > 200,000e: MPE = +/- 1.5e
    """
    e = 0.001  # g
    criteria = {
        "tiers": [
            {"max_m_over_e": 50000, "mpe_e": 0.5},
            {"max_m_over_e": 200000, "mpe_e": 1.0},
            {"max_m_over_e": None, "mpe_e": 1.5}
        ]
    }
    # Load 40g = 40,000e -> Tier 1 (+/- 0.5e = +/- 0.0005g)
    limit, label = evaluate_mpe_limit_for_load(40.0, e, criteria)
    assert limit == 0.0005
    assert "±0.5e" in label

    # Load 100g = 100,000e -> Tier 2 (+/- 1.0e = +/- 0.0010g)
    limit, label = evaluate_mpe_limit_for_load(100.0, e, criteria)
    assert limit == 0.001
    assert "±1.0e" in label

    # Load 300g = 300,000e -> Tier 3 (+/- 1.5e = +/- 0.0015g)
    limit, label = evaluate_mpe_limit_for_load(300.0, e, criteria)
    assert limit == 0.0015
    assert "±1.5e" in label


def test_class_ii_mpe_table_6_tiers():
    """
    OIML R 76 Table 6 Class II:
    0 <= m <= 5,000e: MPE = +/- 0.5e
    5,000e < m <= 20,000e: MPE = +/- 1.0e
    m > 20,000e: MPE = +/- 1.5e
    """
    e = 0.01  # g
    criteria = {
        "tiers": [
            {"max_m_over_e": 5000, "mpe_e": 0.5},
            {"max_m_over_e": 20000, "mpe_e": 1.0},
            {"max_m_over_e": None, "mpe_e": 1.5}
        ]
    }
    # 40g = 4,000e -> Tier 1 (+/- 0.5e = 0.005g)
    limit, _ = evaluate_mpe_limit_for_load(40.0, e, criteria)
    assert limit == 0.005

    # 100g = 10,000e -> Tier 2 (+/- 1.0e = 0.010g)
    limit, _ = evaluate_mpe_limit_for_load(100.0, e, criteria)
    assert limit == 0.01

    # 500g = 50,000e -> Tier 3 (+/- 1.5e = 0.015g)
    limit, _ = evaluate_mpe_limit_for_load(500.0, e, criteria)
    assert limit == 0.015


def test_class_iii_mpe_table_6_tiers():
    """
    OIML R 76 Table 6 Class III:
    0 <= m <= 500e: MPE = +/- 0.5e
    500e < m <= 2,000e: MPE = +/- 1.0e
    m > 2,000e: MPE = +/- 1.5e
    """
    e = 1.0  # g
    criteria = {
        "tiers": [
            {"max_m_over_e": 500, "mpe_e": 0.5},
            {"max_m_over_e": 2000, "mpe_e": 1.0},
            {"max_m_over_e": None, "mpe_e": 1.5}
        ]
    }
    # 400g = 400e -> Tier 1 (+/- 0.5e = 0.5g)
    limit, _ = evaluate_mpe_limit_for_load(400.0, e, criteria)
    assert limit == 0.5

    # 1000g = 1000e -> Tier 2 (+/- 1.0e = 1.0g)
    limit, _ = evaluate_mpe_limit_for_load(1000.0, e, criteria)
    assert limit == 1.0

    # 5000g = 5000e -> Tier 3 (+/- 1.5e = 1.5g)
    limit, _ = evaluate_mpe_limit_for_load(5000.0, e, criteria)
    assert limit == 1.5


def test_boundary_limit_exact_vs_exceeded():
    """
    Metrological boundary test:
    - Exactly at limit -> PASS
    - Delta above limit (+0.0001e) -> FAIL
    """
    e = 0.01
    criteria = {"max_difference_e": 1.0}
    limit = 1.0 * e  # 0.01

    # Exactly at limit
    passed_exact, _, _, _ = evaluate_repeatability_criteria(0.0100000, e, criteria)
    assert passed_exact is True

    # Sligthly below limit
    passed_below, _, _, _ = evaluate_repeatability_criteria(0.0099999, e, criteria)
    assert passed_below is True

    # Marginally above limit (exceeded)
    passed_above, _, _, _ = evaluate_repeatability_criteria(0.0100010, e, criteria)
    assert passed_above is False


def test_eccentricity_boundary_evaluation():
    """
    OIML Clause A.4.7: Corner loading eccentricity
    Max error across positions |E_i| <= limit
    """
    e = 0.05
    criteria = {"max_error_e": 1.0}  # Limit = 0.05

    # 5 positions: Center, FL, FR, RL, RR
    errors_pass = [0.01, -0.02, 0.045, -0.049, 0.050]
    max_err, _ = calculate_eccentricity_max_error(errors_pass)
    passed, _, _, _ = evaluate_eccentricity_criteria(max_err, e, criteria)
    assert passed is True

    errors_fail = [0.01, -0.02, 0.045, -0.051, 0.03]
    max_err_fail, _ = calculate_eccentricity_max_error(errors_fail)
    passed_fail, _, _, _ = evaluate_eccentricity_criteria(max_err_fail, e, criteria)
    assert passed_fail is False
