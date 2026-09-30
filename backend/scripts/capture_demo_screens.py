import os
import subprocess
import time

def capture_screens():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    profile_dir = r"C:\Users\hetansh\AppData\Local\Temp\chrome_demo_profile"
    output_dir = r"D:\NAWI-System\media\screenshots"
    os.makedirs(output_dir, exist_ok=True)

    pages = [
        ("01_login", "http://localhost:5173/login"),
        ("02_dashboard", "http://localhost:5173/dashboard?auto_auth=admin"),
        ("03_instruments", "http://localhost:5173/instruments?auto_auth=admin"),
        ("04_add_instrument", "http://localhost:5173/instruments/new?auto_auth=admin"),
        ("05_new_test", "http://localhost:5173/testing/new?auto_auth=tester"),
        ("06_test_workspace", "http://localhost:5173/testing/1?auto_auth=tester"),
        ("07_test_history", "http://localhost:5173/testing/history?auto_auth=admin"),
        ("08_reports", "http://localhost:5173/reports?auto_auth=admin"),
        ("09_certificate_view", "http://localhost:5173/reports/1?auto_auth=admin"),
        ("10_admin_rules", "http://localhost:5173/admin/rules?auto_auth=admin"),
        ("11_admin_users", "http://localhost:5173/admin/users?auto_auth=admin"),
        ("12_admin_audit", "http://localhost:5173/admin/audit-logs?auto_auth=admin"),
        ("13_admin_settings", "http://localhost:5173/admin/settings?auto_auth=admin"),
    ]

    for name, url in pages:
        out_file = os.path.join(output_dir, f"{name}.png")
        print(f"[*] Capturing {name} from {url}...")
        cmd = [
            chrome_path,
            "--headless=new",
            "--disable-gpu",
            "--no-first-run",
            f"--user-data-dir={profile_dir}",
            f"--screenshot={out_file}",
            "--window-size=1920,1080",
            "--virtual-time-budget=4000",
            url
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        if os.path.exists(out_file) and os.path.getsize(out_file) > 1000:
            print(f"  [+] Saved {out_file} ({os.path.getsize(out_file)} bytes)")
        else:
            print(f"  [-] Failed or empty: {res.stderr}")

if __name__ == "__main__":
    capture_screens()
