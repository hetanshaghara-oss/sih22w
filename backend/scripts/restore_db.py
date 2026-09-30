"""
Automated Database Restore CLI Utility

Restores an SQLite database snapshot safely with pre-restoration backup safeguard.
Usage:
    python scripts/restore_db.py <path_to_backup_file> [--force]
"""

import os
import sys
import shutil
import hashlib
from datetime import datetime

# Adjust path to find app config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

def run_restore(backup_file: str, force: bool = False):
    if not os.path.exists(backup_file):
        print(f"[!] Error: Specified backup file '{backup_file}' does not exist.")
        sys.exit(1)

    target_db = settings.DATABASE_URL.replace("sqlite:///", "")

    if not force:
        print(f"WARNING: Restoring will overwrite the current live database at '{target_db}'.")
        print("To proceed automatically in scripts, pass '--force'.")
        confirm = input("Are you sure you want to proceed? (yes/no): ").strip().lower()
        if confirm != "yes":
            print("Restore aborted by operator.")
            sys.exit(0)

    # Pre-restore safety backup of active database
    if os.path.exists(target_db):
        safety_name = f"{target_db}.pre_restore_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.bak"
        shutil.copy2(target_db, safety_name)
        print(f"[+] Safety snapshot created: {safety_name}")

    # Overwrite live database with backup snapshot
    shutil.copy2(backup_file, target_db)

    print("=== Database Restore Complete ===")
    print(f"Restored From: {backup_file}")
    print(f"Active DB    : {target_db}")
    print(f"Completed At : {datetime.utcnow().isoformat()}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/restore_db.py <backup_file_path> [--force]")
        sys.exit(1)

    b_file = sys.argv[1]
    is_force = "--force" in sys.argv
    run_restore(b_file, is_force)
