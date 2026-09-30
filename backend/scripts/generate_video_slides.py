import os
from PIL import Image, ImageDraw, ImageFont

SCREENSHOTS_DIR = r"D:\NAWI-System\media\screenshots"
SLIDES_DIR = r"D:\NAWI-System\media\slides"
os.makedirs(SLIDES_DIR, exist_ok=True)

FONT_BOLD = r"C:\Windows\Fonts\segoeui.ttf"
FONT_SEMI = r"C:\Windows\Fonts\segoeui.ttf"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"

def get_font(size, mono=False):
    fpath = FONT_MONO if mono else FONT_BOLD
    try:
        return ImageFont.truetype(fpath, size)
    except:
        return ImageFont.load_default()

def draw_top_badge(draw, text, tag="OIML R-76 COMPLIANCE"):
    # Pill in top-left
    box = [50, 40, 650, 95]
    draw.rounded_rectangle(box, radius=12, fill=(15, 23, 42, 230), outline=(59, 130, 246, 180), width=2)
    # Green pulse dot
    draw.ellipse([70, 61, 82, 73], fill=(34, 197, 94, 255))
    draw.text((95, 54), text, font=get_font(20), fill=(248, 250, 252, 255))
    draw.text((460, 56), tag, font=get_font(15, mono=True), fill=(147, 197, 253, 230))

def draw_lower_third(draw, title, subtitle, badge_text=None, border_color=(59, 130, 246)):
    # Bottom banner bar
    y_start = 930
    draw.rectangle([0, y_start, 1920, 1080], fill=(10, 15, 30, 235))
    # Glowing top accent line
    draw.line([0, y_start, 1920, y_start], fill=border_color, width=4)
    
    # Left accent block
    draw.rectangle([50, y_start + 25, 58, y_start + 115], fill=border_color)
    
    # Title
    draw.text((80, y_start + 20), title, font=get_font(28), fill=(255, 255, 255, 255))
    # Subtitle
    draw.text((80, y_start + 65), subtitle, font=get_font(20), fill=(203, 213, 225, 240))
    
    if badge_text:
        # Badge on right
        b_box = [1550, y_start + 35, 1870, y_start + 90]
        draw.rounded_rectangle(b_box, radius=8, fill=(30, 41, 59, 240), outline=border_color, width=1)
        draw.text((1570, y_start + 48), badge_text, font=get_font(18, mono=True), fill=(147, 197, 253, 255))

def draw_focus_box(draw, coords, label=None, color=(34, 197, 94)):
    # Highlight a section of the screen with a futuristic border
    draw.rounded_rectangle(coords, radius=8, outline=color, width=3)
    if label:
        lx, ly = coords[0] + 10, coords[1] - 28
        draw.rounded_rectangle([lx - 6, ly - 4, lx + len(label) * 11 + 6, ly + 22], radius=4, fill=(15, 23, 42, 240), outline=color, width=1)
        draw.text((lx, ly), label, font=get_font(15, mono=True), fill=(248, 250, 252, 255))

def create_intro_slide():
    img = Image.new("RGBA", (1920, 1080), (10, 15, 30, 255))
    draw = ImageDraw.Draw(img)
    
    # Grid lines aesthetic
    for x in range(0, 1920, 80):
        draw.line([x, 0, x, 1080], fill=(30, 41, 59, 60), width=1)
    for y in range(0, 1080, 80):
        draw.line([0, y, 1920, y], fill=(30, 41, 59, 60), width=1)
        
    # Central container
    draw.rounded_rectangle([260, 200, 1660, 880], radius=24, fill=(15, 23, 42, 240), outline=(59, 130, 246, 200), width=3)
    
    # Header tag
    draw.rounded_rectangle([800, 240, 1120, 285], radius=20, fill=(30, 58, 138, 180), outline=(96, 165, 250, 180), width=1)
    draw.ellipse([820, 257, 832, 269], fill=(96, 165, 250, 255))
    draw.text((845, 250), "LEGAL METROLOGY SYSTEM", font=get_font(16, mono=True), fill=(191, 219, 254, 255))
    
    # Big Title
    draw.text((360, 330), "Non-Automatic Weighing Instruments", font=get_font(54), fill=(255, 255, 255, 255))
    draw.text((450, 410), "NAWI Testing & OIML R 76 Compliance Engine", font=get_font(36), fill=(96, 165, 250, 255))
    
    # Bullet grid
    draw.line([400, 490, 1520, 490], fill=(51, 65, 85, 180), width=2)
    
    points = [
        ("Precision Metrology", "Accuracy Classes I, II, III, IIII with verified scale interval e and Max/Min limits"),
        ("Dynamic Test Workspace", "Turning point calculation P = I + 0.5e - ΔL & real-time zero-corrected error Ec"),
        ("OIML R-76 MPE Engine", "Automatic boundary mapping against OIML R-76 Table 6 tolerance tiers"),
        ("Quality Assurance & Reports", "Reviewer electronic gate, SHA-256 digital seals & vector PDF certificates")
    ]
    
    for i, (p_title, p_desc) in enumerate(points):
        row = i // 2
        col = i % 2
        bx = 360 + col * 600
        by = 530 + row * 130
        draw.ellipse([bx, by + 8, bx + 14, by + 22], fill=(34, 197, 94, 255))
        draw.text((bx + 26, by), p_title, font=get_font(24), fill=(241, 245, 249, 255))
        draw.text((bx + 26, by + 36), p_desc, font=get_font(17), fill=(148, 163, 184, 240))
        
    # Bottom credit
    draw.text((750, 810), "Full Platform Walkthrough // Runtime: 4:00 Minutes", font=get_font(20, mono=True), fill=(147, 197, 253, 220))
    
    out_path = os.path.join(SLIDES_DIR, "slide_01_intro.png")
    img.save(out_path)
    print(f"[+] Saved intro slide: {out_path}")

def create_outro_slide():
    img = Image.new("RGBA", (1920, 1080), (10, 15, 30, 255))
    draw = ImageDraw.Draw(img)
    
    # Grid lines aesthetic
    for x in range(0, 1920, 80):
        draw.line([x, 0, x, 1080], fill=(30, 41, 59, 60), width=1)
    for y in range(0, 1080, 80):
        draw.line([0, y, 1920, y], fill=(30, 41, 59, 60), width=1)
        
    draw.rounded_rectangle([300, 220, 1620, 860], radius=24, fill=(15, 23, 42, 240), outline=(34, 197, 94, 200), width=3)
    
    draw.rounded_rectangle([820, 260, 1100, 305], radius=20, fill=(20, 83, 45, 180), outline=(74, 222, 128, 180), width=1)
    draw.ellipse([840, 277, 852, 289], fill=(74, 222, 128, 255))
    draw.text((865, 270), "COMPLIANCE VERIFIED", font=get_font(16, mono=True), fill=(187, 247, 208, 255))
    
    draw.text((440, 350), "NAWI Testing & OIML R-76 System", font=get_font(52), fill=(255, 255, 255, 255))
    draw.text((490, 430), "Standardized Legal Metrology Verification Platform", font=get_font(32), fill=(74, 222, 128, 255))
    
    draw.line([400, 500, 1520, 500], fill=(51, 65, 85, 180), width=2)
    
    summary = [
        "✓ 100% Automated OIML R 76-1:2006 Mathematical Calculations",
        "✓ Strict 4-Tier Role-Based Security: Admin, Tester, Reviewer, Viewer",
        "✓ Tamper-Evident SHA-256 Digital Verification Certificates",
        "✓ Immutable Metrological Audit Trails with JSON State Snapshots",
        "✓ Full Instrument Lifecycle Management & Accidental Deletion Protection"
    ]
    for i, line in enumerate(summary):
        draw.text((460, 540 + i * 50), line, font=get_font(23), fill=(226, 232, 240, 255))
        
    draw.text((700, 800), "Ready for Production Calibration Laboratories", font=get_font(20, mono=True), fill=(147, 197, 253, 230))
    
    out_path = os.path.join(SLIDES_DIR, "slide_14_outro.png")
    img.save(out_path)
    print(f"[+] Saved outro slide: {out_path}")

def process_screenshot_slide(src_name, dst_name, top_badge, lower_title, lower_sub, badge_tag=None, focus_rect=None, focus_label=None, accent_color=(59, 130, 246)):
    src_path = os.path.join(SCREENSHOTS_DIR, src_name)
    dst_path = os.path.join(SLIDES_DIR, dst_name)
    
    if not os.path.exists(src_path):
        print(f"[-] Source missing: {src_path}")
        return
        
    img = Image.open(src_path).convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    # Focus box if specified
    if focus_rect:
        draw_focus_box(draw, focus_rect, focus_label, color=accent_color)
        
    # Top badge
    draw_top_badge(draw, top_badge)
    
    # Lower third
    draw_lower_third(draw, lower_title, lower_sub, badge_tag, border_color=accent_color)
    
    img.save(dst_path)
    print(f"[+] Generated slide: {dst_name}")

def generate_all_slides():
    print("[*] Generating Intro and Outro Presentation Cards...")
    create_intro_slide()
    create_outro_slide()
    
    # 01 Login
    process_screenshot_slide(
        "01_login.png", "slide_02_login.png",
        "01 // PORTAL AUTHENTICATION",
        "Laboratory Access Control & Quick-Fill Terminals",
        "Strict credential protection with role-governed profiles for Admin, Tester, and Reviewer.",
        badge_tag="RBAC SECURITY",
        focus_rect=[1100, 770, 1750, 910],
        focus_label="ONE-CLICK ROLE DEMO SWITCHER",
        accent_color=(99, 102, 241)
    )
    
    # 02 Dashboard
    process_screenshot_slide(
        "02_dashboard.png", "slide_03_dashboard.png",
        "01 // OPERATIONS DASHBOARD",
        "Executive Metrology Operations Center",
        "Live KPI tracking: Active Instruments, Completed Certifications, Pass Rates, and Recent Sessions.",
        badge_tag="LIVE TELEMETRY",
        focus_rect=[260, 110, 1870, 310],
        focus_label="REAL-TIME METROLOGY METRICS",
        accent_color=(59, 130, 246)
    )
    
    # 03 Instruments
    process_screenshot_slide(
        "03_instruments.png", "slide_04_instruments.png",
        "02 // INSTRUMENT REGISTRY",
        "Certified Instrument Fleet & Specifications",
        "Complete classification for Accuracy Classes I, II, III, IIII with verification interval e and Max capacity.",
        badge_tag="ACCURACY CLASSES",
        focus_rect=[260, 200, 1870, 680],
        focus_label="FLEET REGISTRY & DELETE PROTECTION",
        accent_color=(14, 165, 233)
    )
    
    # 04 Add Instrument
    process_screenshot_slide(
        "04_add_instrument.png", "slide_05_add_instrument.png",
        "02 // INSTRUMENT REGISTRATION",
        "OIML R-76 Technical Specification Wizard",
        "Automatic computation of scale intervals n = Max / e with instant validation of OIML boundary constraints.",
        badge_tag="METROLOGY SPECS",
        focus_rect=[450, 260, 1470, 870],
        focus_label="AUTOMATIC RATIO CALCULATION (n = Max / e)",
        accent_color=(14, 165, 233)
    )
    
    # 05 New Test
    process_screenshot_slide(
        "05_new_test.png", "slide_06_new_test.png",
        "03 // TEST INITIALIZATION",
        "Test Session Setup & Environmental Tracking",
        "Sequential Test ID generation, certified standard selection, and ambient conditions validation (Temp, RH, kPa).",
        badge_tag="OIML BOUNDS",
        focus_rect=[400, 380, 1520, 850],
        focus_label="AMBIENT CONDITIONS & REFERENCE STANDARDS",
        accent_color=(168, 85, 247)
    )
    
    # 06 Test Workspace: Dynamic observations & turning point formula
    process_screenshot_slide(
        "06_test_workspace.png", "slide_07_workspace_obs.png",
        "04 // DYNAMIC OBSERVATION GRID",
        "Real-Time Turning Point & Error Computation",
        "Calculates Turning Point P = I + 0.5e - ΔL, Intrinsic Error E, and Zero-Corrected Error Ec = E - E0.",
        badge_tag="P = I + 0.5e - ΔL",
        focus_rect=[280, 320, 1860, 750],
        focus_label="DYNAMIC LOAD OBSERVATION GRID",
        accent_color=(34, 197, 94)
    )
    
    # 07 Test Workspace / History: MPE Evaluation
    process_screenshot_slide(
        "07_test_history.png", "slide_08_compliance_check.png",
        "04 // OIML COMPLIANCE ENGINE",
        "Automated OIML R-76 Table 6 MPE Evaluation",
        "Automated tolerance mapping across 0.5e, 1.0e, and 1.5e tiers with instant visual PASS / FAIL verdicts.",
        badge_tag="TABLE 6 MPE TIERS",
        focus_rect=[260, 220, 1870, 780],
        focus_label="MPE TOLERANCE AUDIT & HISTORY",
        accent_color=(34, 197, 94)
    )
    
    # 08 Reports List
    process_screenshot_slide(
        "08_reports.png", "slide_09_reports.png",
        "05 // QUALITY ASSURANCE GATE",
        "Reviewer Endorsement & Verification Registry",
        "Two-person integrity rule: authorized Reviewers audit observations and endorse official certificates.",
        badge_tag="QA APPROVAL GATE",
        focus_rect=[260, 210, 1870, 750],
        focus_label="OFFICIAL VERIFICATION CERTIFICATES",
        accent_color=(234, 88, 12)
    )
    
    # 09 Certificate View
    process_screenshot_slide(
        "09_certificate_view.png", "slide_10_certificate_view.png",
        "05 // OFFICIAL CERTIFICATE",
        "Standardized OIML Verification Certificate & Digital Seal",
        "Tamper-proof SHA-256 digital signature, official metrology laboratory stamp, and vector PDF download.",
        badge_tag="SHA-256 VERIFIED",
        focus_rect=[350, 180, 1570, 880],
        focus_label="TAMPER-EVIDENT CRYPTOGRAPHIC SEAL",
        accent_color=(234, 88, 12)
    )
    
    # 10 Admin Rules & Users
    process_screenshot_slide(
        "10_admin_rules.png", "slide_11_admin_rules.png",
        "06 // CONFIGURABLE ENGINE",
        "Dynamic OIML R-76 Compliance Rule Management",
        "Authorized metrologists can update tolerance equations and boundary intervals without source code rebuilds.",
        badge_tag="DYNAMIC RULES",
        focus_rect=[260, 200, 1870, 860],
        focus_label="CONFIGURABLE OIML TOLERANCES",
        accent_color=(16, 185, 129)
    )
    
    # 11 Admin Users
    process_screenshot_slide(
        "11_admin_users.png", "slide_12_admin_users.png",
        "06 // ENTERPRISE GOVERNANCE",
        "4-Tier Role-Based Access Control (RBAC)",
        "Strict separation of concerns across Admin, Tester, Reviewer, and Viewer accounts with instant activation.",
        badge_tag="RBAC GOVERNANCE",
        focus_rect=[260, 200, 1870, 780],
        focus_label="LABORATORY USER ACCESS TIERS",
        accent_color=(16, 185, 129)
    )
    
    # 12 Admin Audit
    process_screenshot_slide(
        "12_admin_audit.png", "slide_13_admin_audit.png",
        "06 // IMMUTABLE AUDIT LOG",
        "Traceable Security & Parameter Audit Trail",
        "Cryptographically traceable event log storing full JSON before/after snapshots for every metrological change.",
        badge_tag="TRACEABILITY",
        focus_rect=[260, 200, 1870, 820],
        focus_label="JSON PARAMETER DIFF AUDIT LOG",
        accent_color=(16, 185, 129)
    )

if __name__ == "__main__":
    generate_all_slides()
