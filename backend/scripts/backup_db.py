"""
Automated Database Backup CLI Utility

Generates timestamped binary SQLite database snapshots with SHA-256 verification.
Usage:
    python scripts/backup_db.py [--output-dir PATH]
"""

import os
import sys
import shutil
import hashlib
from datetime import datetime

# Adjust path to find app config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

def run_backup(output_dir: str = None):
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_path):
        print(f"[!] Error: Database file '{db_path}' not found.")
        sys.exit(1)

    if not output_dir:
        output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backups")

    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"nawi_backup_{timestamp}.db"
    backup_filepath = os.path.join(output_dir, backup_filename)

    # Perform atomic binary snapshot
    shutil.copy2(db_path, backup_filepath)

    # Calculate SHA-256 checksum
    hasher = hashlib.sha256()
    with open(backup_filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    checksum = hasher.hexdigest()

    file_size_kb = round(os.path.getsize(backup_filepath) / 1024, 2)

    print("=== Database Backup Successful ===")
    print(f"Source Database : {db_path}")
    print(f"Snapshot File   : {backup_filepath}")
    print(f"File Size       : {file_size_kb} KB")
    print(f"SHA-256 Checksum: {checksum}")
    print(f"Timestamp (UTC) : {datetime.utcnow().isoformat()}")
    return backup_filepath

if __name__ == "__main__":
    out_dir = sys.argv[1] if len(sys.argv) > 1 else None
    run_backup(out_dir)
