# NAWI Testing & OIML R-76 Compliance System — Deployment Guide

This guide details instructions for preparing, configuring, deploying, and maintaining the NAWI Testing & OIML R-76 Compliance System in production environments.

---

## 1. System Architecture Overview

The system consists of:
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy 2.0 ORM, Pydantic V2, ReportLab PDF Engine, Bcrypt & JWT security.
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide icons, Vite.
- **Database**: SQLite 3 (built-in default) or PostgreSQL.
- **Storage**: Tamper-evident PDF certificate store in `storage/reports/`.

---

## 2. Server Prerequisites

- **Operating System**: Windows Server 2019+, Ubuntu 20.04/22.04 LTS, or macOS
- **Python**: Version 3.10+ (Recommended: Python 3.11)
- **Node.js**: Version 18.x or 20.x LTS
- **Network Ports**:
  - Backend: `8000` (or reverse proxied via NGINX/IIS)
  - Frontend: `5173` (dev) or served statically through NGINX/Caddy/IIS

---

## 3. Step-by-Step Installation

### 3.1 Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install production dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure production environment:
   ```bash
   copy .env.production .env   # Windows
   cp .env.production .env     # Linux/macOS
   ```
   *Update `SECRET_KEY` with a cryptographically secure random string.*
5. Initialize and seed database tables:
   ```bash
   python scripts/seed_database.py
   ```

### 3.2 Frontend Setup & Build
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Compile production bundle:
   ```bash
   npm run build
   ```
   *The optimized static assets will be created in `frontend/dist/`.*

---

## 4. Production Service Management

### 4.1 Running Backend with Uvicorn / Gunicorn
For Windows production deployment with Uvicorn:
```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
```

For Linux production deployment with Gunicorn:
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
```

### 4.2 Reverse Proxy Configuration (NGINX Example)
```nginx
server {
    listen 80;
    server_name nawi.lab.local;

    # Serve compiled React frontend
    location / {
        root /var/www/nawi/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to FastAPI backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Backup & Disaster Recovery Procedures

### 5.1 Automated Database Snapshots
Run the automated snapshot script:
```bash
python scripts/backup_db.py
```
Snapshots are stored in `backend/backups/nawi_backup_YYYYMMDD_HHMMSS.db` with SHA-256 integrity verification.

### 5.2 Restoring from Backup
```bash
python scripts/restore_db.py backups/nawi_backup_YYYYMMDD_HHMMSS.db --force
```

### 5.3 On-Demand Browser Backup
Administrators can log in to `/admin/audit-logs` and click **"Download Database Backup"** at any time.
