# OIML R-76 Calculation & Compliance Engine — Metrological Validation Report

This report documents the mathematical formulas, regulatory references, test cases, and numerical boundary verification results implemented in the **NAWI Test Report Application**.

---

## 1. Applicable Standard & Clauses

- **Standard**: OIML R 76-1 (Edition 2006 E) — *Non-automatic weighing instruments — Part 1: Metrological and technical requirements - Tests*
- **Scope**: Verification of Non-Automatic Weighing Instruments across all four standard accuracy classes:
  - **Class I** ($\text{Special Accuracy}$)
  - **Class II** ($\text{High Accuracy}$)
  - **Class III** ($\text{Medium Accuracy}$)
  - **Class IIII** ($\text{Ordinary Accuracy}$)

---

## 2. Mathematical Formulations & Algorithms

### 2.1 Turning Point Determination (Clause A.4.4.3)
At a given load $L$, small extra loads of $0.1e$ are sequentially added until the instrument indication increases unambiguously by one scale interval ($I + e$). If an extra load of $\Delta L$ was added:
$$P = I + \frac{1}{2}e - \Delta L$$

### 2.2 Intrinsic Error Before Rounding (Clause A.4.4.3)
The intrinsic error $E$ prior to digital rounding is:
$$E = P - L = I + \frac{1}{2}e - \Delta L - L$$

### 2.3 Zero-Point Corrected Error (Clause A.4.4.3)
To eliminate zero-point shifts, the corrected error $E_c$ at load $L$ is:
$$E_c = E - E_0$$
where $E_0$ is the intrinsic error calculated at zero load ($L = 0$).

### 2.4 Maximum Permissible Error (MPE) Tiers (Clause 3.5.1, Table 6)
For initial verification, the maximum permissible error on increasing or decreasing load is given in scale intervals ($e$):

| Accuracy Class | Load Range ($m$ in verification intervals $e$) | Initial Verification MPE |
| :--- | :--- | :--- |
| **Class I** | $0 \le m \le 50,000e$<br>$50,000e < m \le 200,000e$<br>$m > 200,000e$ | $\pm 0.5e$<br>$\pm 1.0e$<br>$\pm 1.5e$ |
| **Class II** | $0 \le m \le 5,000e$<br>$5,000e < m \le 20,000e$<br>$m > 20,000e$ | $\pm 0.5e$<br>$\pm 1.0e$<br>$\pm 1.5e$ |
| **Class III** | $0 \le m \le 500e$<br>$500e < m \le 2,000e$<br>$m > 2,000e$ | $\pm 0.5e$<br>$\pm 1.0e$<br>$\pm 1.5e$ |
| **Class IIII** | $0 \le m \le 50e$<br>$50e < m \le 200e$<br>$m > 200e$ | $\pm 0.5e$<br>$\pm 1.0e$<br>$\pm 1.5e$ |

### 2.5 Repeatability Evaluation (Clause A.4.4.1)
The difference between the maximum and minimum results obtained from identical loads shall not exceed the absolute value of the maximum permissible error for that load:
$$\Delta P = P_{\max} - P_{\min} \le \text{allowable limit} \quad (\le 1.0e)$$

### 2.6 Eccentricity (Corner Load) Evaluation (Clause A.4.7)
For instruments with four or fewer supports, a load of approximately $1/3 \text{ Max}$ is applied successively to 5 positions (Center, Front-Left, Front-Right, Rear-Left, Rear-Right):
$$\max |E_i| \le \text{allowable limit} \quad (\le 1.0e)$$

---

## 3. Boundary & Limit Verification Results

Automated tests in `test_oiml_validation.py` confirm exact behavior around limit thresholds:

| Test Case | Calculated Value | Permissible Limit | Expected Result | Engine Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Turning point formula | $I=100.00, e=0.01, \Delta L=0.004$ | N/A | $P = 100.001$ | $100.001$ | **VERIFIED** |
| Class I Tier 1 | $m=40,000e$ ($40\text{g}$) | $\pm 0.5e$ | $\pm 0.0005\text{g}$ | $0.0005$ | **VERIFIED** |
| Class I Tier 2 | $m=100,000e$ ($100\text{g}$) | $\pm 1.0e$ | $\pm 0.0010\text{g}$ | $0.0010$ | **VERIFIED** |
| Class I Tier 3 | $m=300,000e$ ($300\text{g}$) | $\pm 1.5e$ | $\pm 0.0015\text{g}$ | $0.0015$ | **VERIFIED** |
| Class II Tier 1 | $m=4,000e$ ($40\text{g}$) | $\pm 0.5e$ | $\pm 0.005\text{g}$ | $0.005$ | **VERIFIED** |
| Class III Tier 1 | $m=400e$ ($400\text{g}$) | $\pm 0.5e$ | $\pm 0.5\text{g}$ | $0.5$ | **VERIFIED** |
| Boundary exact limit | $\Delta P = 0.0100000$ | $0.0100000$ | **PASS** | `PASS` | **VERIFIED** |
| Boundary below limit | $\Delta P = 0.0099999$ | $0.0100000$ | **PASS** | `PASS` | **VERIFIED** |
| Boundary exceeded limit | $\Delta P = 0.0100010$ | $0.0100000$ | **FAIL** | `FAIL` | **VERIFIED** |
| Eccentricity Pass | $\max |E_i| = 0.050$ | $0.050$ | **PASS** | `PASS` | **VERIFIED** |
| Eccentricity Fail | $\max |E_i| = 0.051$ | $0.050$ | **FAIL** | `FAIL` | **VERIFIED** |
| Unconfigured Rule | Test with unseeded rule | Strict Rule | **REVIEW** | `REVIEW (Rule not configured)` | **VERIFIED** |

---

## 4. Immutability & Audit Guarantee
1. **Raw Observation Separation**: Raw indicated readings ($I, \Delta L$) are stored in `observations` table and are never overwritten by calculated values.
2. **Outdated Flagging**: If any raw reading is modified, the parent test instance is flagged `is_outdated = True`, voiding prior compliance results until re-evaluated.
3. **Approval Lock**: Once a session is approved by a technical reviewer, status changes to `Completed` and record modification is locked at database and API levels.
