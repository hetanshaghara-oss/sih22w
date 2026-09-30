# NAWI Testing & OIML R-76 Compliance System — 4-Minute Demo Video Production Guide & Master Script

**Output Video File**: `D:\NAWI-System\NAWI_Demo_Video_4Min.mp4`  
**Duration**: Exactly 4:00 Minutes (240.0 Seconds)  
**Resolution**: 1920 × 1080 Full HD (30 FPS)  
**Audio Architecture**: Dual-Track Composite (Crystal-Clear Female Voiceover + Soft Ambient Corporate Tech BGM ducked at -24 dB)  

---

## 1. Executive Video Overview

This demo video provides an end-to-end, comprehensive demonstration of the entire **NAWI (Non-Automatic Weighing Instruments) Testing & OIML R-76 Legal Metrology Verification System**. It covers all modules, workflows, mathematical compliance engines, quality assurance gates, and security controls across 6 structured scenes.

```
0:00 ─── Scene 1: Hook, Architecture & Command Dashboard (38s)
0:38 ─── Scene 2: High-Precision Instrument Registry & Specs (40s)
1:18 ─── Scene 3: Test Session Initialization & Environmental Tracking (42s)
2:02 ─── Scene 4: Dynamic Observation Engine & OIML R-76 Compliance (48s)
2:50 ─── Scene 5: QA Gate, Reviewer Endorsement & PDF Certificate (36s)
3:26 ─── Scene 6: Enterprise Governance, RBAC, Audit Logs & Backup (36s)
4:00 ─── Concluding Freeze Card & End of Video
```

---

## 2. Complete Scene-by-Scene Script, Narration & Visual Editing Table

| Timestamp | Scene & On-Screen Visual | Word-for-Word Voiceover Narration | Visual Edits, Callouts & Sound Design |
|---|---|---|---|
| **0:00 – 0:05** (5s) | **Intro Title Card**<br>• Glowing NAWI Emblem<br>• "Non-Automatic Weighing Instruments"<br>• "OIML R-76 Compliance Platform"<br>• "Full Platform Walkthrough" | *(Background ambient music fades in gently at -18 dB)* | **Visual**: Subtle grid texture with glowing blue border.<br>**Overlay**: Tag `LEGAL METROLOGY SYSTEM`.<br>**Sound**: Soft ambient tech chord bed. |
| **0:05 – 0:18** (13s) | **Laboratory Authentication Portal** (`01_login.png`)<br>• Clean dark metrology portal<br>• Standard OIML Metrology badge<br>• Quick-fill role switcher buttons | "Welcome to the NAWI Testing and Legal Metrology Compliance Platform. In verification laboratories, certifying Non-Automatic Weighing Instruments against the International Standard OIML R-76 demands absolute precision, strict environmental controls, and traceable documentation." | **Visual**: Focus bounding box around the `Admin`, `Tester`, and `Reviewer` one-click switcher buttons.<br>**Lower-Third**: `PORTAL AUTHENTICATION // Laboratory Access Control & Quick-Fill Terminals`.<br>**Badge**: `RBAC SECURITY`. |
| **0:18 – 0:38** (20s) | **Metrology Operations Dashboard** (`02_dashboard.png`)<br>• Real-time metric cards (Fleet size, Tests In Progress, Pass Rate, Calibrations)<br>• Recent Verification Sessions table<br>• Quick-action launchers | "Our platform fully digitizes this metrological workflow. From the role-governed authentication portal, operators enter an integrated command dashboard displaying real-time testing metrics, instrument fleet status, pending evaluations, and streamlined quick actions." | **Visual**: Highlight box around the 4 KPI telemetry cards.<br>**Lower-Third**: `OPERATIONS DASHBOARD // Executive Metrology Operations Center`.<br>**Badge**: `LIVE TELEMETRY`. |
| **0:38 – 0:58** (20s) | **Instrument Registry** (`03_instruments.png`)<br>• Balance inventory list (Mettler Toledo, Sartorius, Kern, Ohaus)<br>• Accuracy Class badges (I, II, III, IIII)<br>• Scale intervals $e$, Max capacity | "At the core of the platform is the Instrument Registry. Each weighing instrument, from Class I analytical micro-balances to Class IIII industrial scales, is registered with certified metrological specifications." | **Visual**: Green focus highlight on Accuracy Class pill badges (Special Class I, High Class II, Medium Class III).<br>**Lower-Third**: `INSTRUMENT REGISTRY // Certified Fleet & Metrological Specifications`.<br>**Badge**: `ACCURACY CLASSES`. |
| **0:58 – 1:18** (20s) | **Instrument Specification Wizard** (`04_add_instrument.png`)<br>• Add instrument modal/form<br>• Automatic ratio calculator $n = \text{Max} / e$<br>• OIML boundary verification & deletion protection | "This includes manufacturer, model, serial number, accuracy class, maximum capacity, minimum capacity, and the verification scale interval, 'e'. The system automatically computes the total scale intervals 'n', verifies OIML boundary constraints, and locks active instruments against accidental modification or deletion." | **Visual**: Bounding box on automatic ratio calculation `n = Max / e` and delete-lock badge.<br>**Lower-Third**: `INSTRUMENT REGISTRATION // OIML R-76 Technical Specification Wizard`.<br>**Badge**: `METROLOGY SPECS`. |
| **1:18 – 1:39** (21s) | **Test Session Initialization** (`05_new_test.png`)<br>• Instrument selection dropdown<br>• Auto-populating technical specs<br>• Sequential Test ID generation | "When launching a verification session, selecting an instrument instantly populates its verified technical specifications. Every test is assigned a unique, sequential Test ID." | **Visual**: Cursor animation selecting instrument; specs auto-fill instantly.<br>**Lower-Third**: `TEST INITIALIZATION // Test Session Setup & Environmental Tracking`.<br>**Badge**: `OIML BOUNDS`. |
| **1:39 – 2:02** (23s) | **Environmental Conditions & Standards** (`06_test_workspace.png`)<br>• Ambient telemetry inputs ($^\circ\text{C}$, $\%$ RH, $\text{kPa}$)<br>• Calibrated reference mass standards<br>• Procedure attachment checklist | "Because environmental factors introduce weighing uncertainty, the operator records temperature, relative humidity, barometric pressure, and calibrated reference mass standards. Operators can attach multiple standardized OIML test definitions to a single session. The system continuously validates that ambient laboratory conditions stay strictly within OIML R-76 operating limits throughout testing." | **Visual**: Pulsing highlight on Temperature ($21.4^\circ\text{C}$), Humidity ($48.5\%$), and Pressure ($101.3\,\text{kPa}$).<br>**Lower-Third**: `DYNAMIC OBSERVATION GRID // Real-Time Turning Point & Error Computation`.<br>**Badge**: `P = I + 0.5e - ΔL`. |
| **2:02 – 2:26** (24s) | **Dynamic Observation Grid & Formulas** (`06_test_workspace.png`)<br>• Observation rows with load point $L$, indicated $I$, and extra load $\Delta L$<br>• Turning point formula overlay | "Next is the dynamic observation and compliance engine. The system supports full OIML procedures: Weighing Performance, Repeatability, Eccentricity, and Tare Evaluation. For each load point, the operator inputs the indicated value and the extra load added until turning point." | **Visual**: Formula overlay card: $P = I + 0.5e - \Delta L$, $E = P - L$, $E_c = E - E_0$.<br>**Lower-Third**: `DYNAMIC OBSERVATION GRID // Real-Time Turning Point & Error Computation`.<br>**Badge**: `P = I + 0.5e - ΔL`. |
| **2:26 – 2:50** (24s) | **Live OIML R-76 Compliance & MPE Evaluation** (`07_test_history.png`)<br>• Dynamic evaluation against Table 6 MPE limits ($0.5e, 1.0e, 1.5e$)<br>• Instant PASS / FAIL chips<br>• Session audit trail | "Our mathematical engine automatically calculates the turning point P, the intrinsic error E, and the zero-corrected error E c. For eccentricity tests, corner and center positions are individually audited. It then evaluates the reading against OIML R-76 Table 6 maximum permissible errors, dynamically rendering instantaneous PASS or FAIL verdicts for every point." | **Visual**: Green glowing PASS chips lighting up row-by-row.<br>**Lower-Third**: `OIML COMPLIANCE ENGINE // Automated OIML R-76 Table 6 MPE Evaluation`.<br>**Badge**: `TABLE 6 MPE TIERS`. |
| **2:50 – 3:06** (16s) | **Reviewer Portal & Quality Assurance Gate** (`08_reports.png`)<br>• Under Review test sessions<br>• Reviewer endorsement modal<br>• Two-person verification rule | "Once testing concludes, the session enters the formal quality assurance gate. An authorized Reviewer examines all raw observations, environmental parameters, and mathematical error curves before digital endorsement. Reviewers can approve or request revisions with detailed comments." | **Visual**: Focus on Reviewer approval button and status tag `Under Review ➔ Completed`.<br>**Lower-Third**: `QUALITY ASSURANCE GATE // Reviewer Endorsement & Verification Registry`.<br>**Badge**: `QA APPROVAL GATE`. |
| **3:06 – 3:26** (20s) | **Official OIML Verification Certificate** (`09_certificate_view.png`)<br>• Tamper-proof SHA-256 digital signature<br>• Official metrology laboratory seal<br>• Vector PDF report preview & download | "Upon approval, the system generates an official OIML R-76 Verification Certificate, complete with a tamper-evident SHA-256 digital signature, authorized laboratory seal, and downloadable vector PDF report." | **Visual**: Zoom-in on the SHA-256 hash chip (`3f8a9e...`) and gold verification seal; PDF download button triggers.<br>**Lower-Third**: `OFFICIAL CERTIFICATE // Standardized OIML Verification Certificate & Digital Seal`.<br>**Badge**: `SHA-256 VERIFIED`. |
| **3:26 – 3:35** (9s) | **4-Tier User Management** (`11_admin_users.png`)<br>• Admin, Tester, Reviewer, Viewer roles<br>• Active status toggles | "Enterprise governance underpins the entire platform. Four discrete roles: Admin, Tester, Reviewer, and Viewer, enforce strict principle-of-least-privilege access across the laboratory." | **Visual**: Highlight on the 4 discrete role badges and user management table.<br>**Lower-Third**: `ENTERPRISE GOVERNANCE // 4-Tier Role-Based Access Control (RBAC)`.<br>**Badge**: `RBAC GOVERNANCE`. |
| **3:35 – 3:44** (9s) | **Configurable Compliance Rules** (`10_admin_rules.png`)<br>• Dynamic rule management<br>• Tolerance equations & boundary values | "An immutable audit trail captures every action and parameter change with timestamped JSON diffs. Administrators can update OIML compliance rules dynamically without source code changes, and create instant database backup snapshots." | **Visual**: Bounding box on OIML R 76-1:2006 rule version toggle and parameter editor.<br>**Lower-Third**: `CONFIGURABLE ENGINE // Dynamic OIML R-76 Compliance Rule Management`.<br>**Badge**: `DYNAMIC RULES`. |
| **3:44 – 3:53** (9s) | **Immutable Audit Log & Backups** (`12_admin_audit.png`)<br>• Timestamped audit trail<br>• Before/after JSON snapshots<br>• On-demand database backups (`13_admin_settings.png`) | "The NAWI Testing Platform: precision, compliance, and legal metrology excellence." | **Visual**: JSON snapshot expandable view and instant database snapshot download button.<br>**Lower-Third**: `IMMUTABLE AUDIT LOG // Traceable Security & Parameter Audit Trail`.<br>**Badge**: `TRACEABILITY`. |
| **3:53 – 4:00** (7s) | **Outro Summary Card** (`slide_14_outro.png`)<br>• Green Compliance Verified shield<br>• Feature highlights checklist<br>• Ready for Production Calibration Labs | *(Narration completes cleanly at 3:54; ambient background music plays softly and fades out to silence at 4:00)* | **Visual**: Centered compliance check card with 5 checkmarks.<br>**Overlay**: `COMPLIANCE VERIFIED // Ready for Production Calibration Laboratories`.<br>**Sound**: Soft musical resolution & fade-out. |

---

## 3. How to Re-generate or Modify the Video

All automated scripts are pre-packaged in the repository:

1. **Re-capture UI Screenshots**:
   ```powershell
   .\backend\venv\Scripts\python.exe backend/scripts/capture_demo_screens.py
   ```
2. **Re-generate Narration Audio (TTS)**:
   ```powershell
   .\backend\venv\Scripts\python.exe backend/scripts/generate_audio.py
   ```
3. **Re-render Presentation Slides & Overlays**:
   ```powershell
   .\backend\venv\Scripts\python.exe backend/scripts/generate_video_slides.py
   ```
4. **Compile Master 4-Minute MP4 Video**:
   ```powershell
   .\backend\venv\Scripts\python.exe backend/scripts/compile_demo_video.py
   ```

---

## 4. Alternative Recording Options for Live Screen Capture

If you wish to record your own live mouse movements and voiceover manually:
- **Built-in Windows Screen Recorder**: Press `Win + Alt + R` to record your browser screen directly in Full HD.
- **OBS Studio**: Set Canvas to `1920x1080` at 30/60 fps, add Window Capture (`msedge.exe` or `chrome.exe`), and record your mic with a noise gate filter.
- **Clipchamp (Windows 11)**: Import the screenshots or live recording, use Clipchamp's free built-in Microsoft Azure Neural TTS ("Jenny" or "Guy") by pasting the script lines above, and export as MP4 at 1080p.
