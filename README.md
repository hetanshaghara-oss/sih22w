# NAWI Compliance & Test Report System

**Software for Non-Automatic Weighing Instruments based on OIML R 76**

A web-based laboratory management, instrument verification, and metrological compliance application developed for legal metrology authorities and calibration laboratories.

---

## 📌 Project Overview & Purpose

The **NAWI Compliance & Test Report System** provides a digital foundation for managing, verifying, and testing Non-Automatic Weighing Instruments (NAWI) in accordance with the International Organization of Legal Metrology Recommendation **OIML R 76-1 (Edition 2006 E)**.

In **Phase 1 (Project Foundation & Core Website)**, the system establishes:
- Full-stack client-server architecture with strict separation of concerns.
- Role-based access control (RBAC) with predefined permissions for **Admin**, **Tester**, and **Reviewer**.
- Complete **Instrument Registry** with OIML R 76 metrological characteristics ($Max$, $Min$, verification scale interval $e$, accuracy classes).
- Real-time laboratory dashboard tracking instrument metrics and chronological events.
- Turnkey database architecture supporting PostgreSQL 16 (with SQLite fallback for standalone local execution).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router v6, Axios |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2, Uvicorn, Bcrypt, PyJWT |
| **Database** | PostgreSQL 16 (production target via Docker Compose) & SQLite (zero-config dev) |
| **Authentication** | JSON Web Tokens (JWT) with HS256 algorithm and role scopes |
| **Containerization** | Docker, Docker Compose |

---

## 🏛️ System Architecture

```
Frontend (React 18 + Vite + TS + Tailwind)
                  ↓  (REST API / JWT Bearer)
Backend API Layer (FastAPI Routers)
                  ↓  (Dependency Injection & Validation)
Backend Services & Security (Bcrypt, JWT, Compliance Interface)
                  ↓  (SQLAlchemy 2.0 ORM)
Relational Database (PostgreSQL 16 / SQLite)
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher) and `npm`
- **Python** (v3.10 or higher)
- *(Optional)* **Docker & Docker Compose** for containerized PostgreSQL

---

### 2. Running with Docker Compose (Recommended for Full Stack)

To spin up PostgreSQL, the FastAPI backend, and the Vite frontend with one command:

```bash
docker-compose up --build
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API & Swagger Docs**: `http://localhost:8000/docs`
- **PostgreSQL**: `localhost:5432` (database: `nawi_db`, user: `postgres`, password: `postgrespassword`)

---

### 3. Running Locally (Step-by-Step)

#### A. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd NAWI-System/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell:
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
   *(By default, `DATABASE_URL` is configured for SQLite `sqlite:///./nawi.db` for instant local execution without needing an external database server).*
5. Seed initial laboratory users and instruments:
   ```bash
   python -m app.seed
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *Interactive API Documentation is available at: `http://127.0.0.1:8000/docs`*

---

#### B. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd NAWI-System/frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to: `http://localhost:5173`

---

## 🔑 Pre-Seeded Laboratory Accounts

Use any of these pre-configured credentials to evaluate role-based access:

| Role | Staff Member | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Sarah Jenkins | `admin@nawi-lab.org` | `Admin@12345` | Full system access, User management, Settings |
| **Tester** | Marcus Vance | `tester@nawi-lab.org` | `Tester@12345` | Instrument registration, Test entry (Phase 2) |
| **Reviewer** | Elena Rostova | `reviewer@nawi-lab.org` | `Reviewer@12345` | Registry view, Inspection, Report approval |

*(Quick-fill buttons are also available on the Login screen).*

---

## 📂 Project Directory Structure

```
NAWI-System/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Reusable Button, Input, Modal, Alert, Badge, Pagination
│   │   │   └── layout/        # Sidebar, TopNavbar, MainLayout, ProtectedRoute
│   │   ├── contexts/          # AuthContext (JWT, session, role state)
│   │   ├── pages/
│   │   │   ├── auth/          # LoginPage, UnauthorizedPage (403)
│   │   │   ├── dashboard/     # DashboardPage (KPIs, recent activity, roadmap)
│   │   │   ├── instruments/   # InstrumentListPage, AddInstrumentPage
│   │   │   ├── testing/       # PlaceholderTestingPage (Phase 2/3)
│   │   │   ├── reports/       # PlaceholderReportsPage (Phase 4)
│   │   │   └── admin/         # UsersPage, SettingsPage
│   │   ├── services/          # Axios API layer (auth, instruments, dashboard)
│   │   ├── types/             # TypeScript type definitions
│   │   ├── App.tsx            # Application routing hierarchy
│   │   └── main.tsx           # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/v1/            # Endpoints (auth, instruments, dashboard)
│   │   ├── core/              # Config, Security (Bcrypt+JWT), DB engine, Dependencies
│   │   ├── models/            # SQLAlchemy models (User, Instrument, Future Stubs)
│   │   ├── schemas/           # Pydantic v2 schemas (Requests, Responses, Pagination)
│   │   ├── services/
│   │   │   └── compliance/    # OIML R 76 Engine placeholder interface
│   │   ├── seed.py            # Database seeder CLI
│   │   └── main.py            # FastAPI main application
│   ├── test_backend.py        # Automated test suite
│   ├── requirements.txt
│   └── Dockerfile
│
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # PostgreSQL DDL migration
│   └── seed_data.sql               # PostgreSQL seed SQL script
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   └── API_DOCUMENTATION.md
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🧪 Testing and Verification

Run the automated backend test suite:
```bash
cd NAWI-System/backend
.\venv\Scripts\python test_backend.py
```
**Tests verify:**
- API health check
- Authentication validation (invalid credentials rejected with 401; valid credentials issue JWT)
- Dashboard KPIs match real database counts
- Full Instrument CRUD:
  - Instrument creation with numeric capacity validation
  - Uniqueness constraint on `instrument_id`
  - Strict validation check: $Max \le Min$ rejected with 422
  - Get by ID, update properties, and delete operations

---

## 🗺️ Roadmap & Phase Progression

- **✅ Phase 1: Project Foundation & Core Website** (Current)
  - Full-stack architecture, JWT authentication, RBAC, Instrument Registry CRUD, Dashboard, and Documentation.
- **⏳ Phase 2: Test Management**
  - Environmental parameter tracking, test session lifecycle, procedures for Repeatability, Eccentricity, Weighing Performance, and Tare.
- **⏳ Phase 3: OIML R 76 Calculation Engine**
  - Automated determination of rounding errors, maximum permissible errors (MPE), and compliance pass/fail logic.
- **⏳ Phase 4: Standardized Test Reports**
  - Formal OIML R 76 certificate generation, digital signatures, and PDF export.
- **⏳ Phase 5: Historical Reports & Audit Logs**
  - Complete tamper-proof audit trail and regulatory compliance archiving.
# sih20206
