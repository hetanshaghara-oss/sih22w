# NAWI System Architecture Document

## System Purpose
The **NAWI Compliance & Test Report System** is an enterprise-grade laboratory information and metrological compliance system designed for Non-Automatic Weighing Instruments according to International Recommendation **OIML R 76-1 (Edition 2006 E)**.

---

## High-Level Architecture

```
+--------------------------------------------------------------+
|                 Frontend Layer (SPA)                         |
|   React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons  |
+--------------------------------------------------------------+
                              |
                              | HTTP / JSON (REST API)
                              | Authorization: Bearer <JWT>
                              v
+--------------------------------------------------------------+
|                  API Gateway & Routers                       |
|           FastAPI 0.110+ (Asynchronous ASGI)                 |
+--------------------------------------------------------------+
         |                     |                     |
         v                     v                     v
+-----------------+   +-----------------+   +--------------------+
|  Auth Service   |   | Instrument Svc  |   | Compliance Engine  |
|  Bcrypt + JWT   |   |   CRUD & Spec   |   | [Phase 3 Modular]  |
+-----------------+   +-----------------+   +--------------------+
         \                     |                     /
          \                    |                    /
           +-------------------+-------------------+
                               |
                               v
+--------------------------------------------------------------+
|                   Data Access Layer                          |
|             SQLAlchemy 2.0 ORM Engine                        |
+--------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|                   Relational Database                        |
|   PostgreSQL 16 (Native Target) / SQLite (Standalone Dev)   |
+--------------------------------------------------------------+
```

---

## Modular Layering Principles

1. **Separation of Concerns**:
   - The UI never directly talks to database tables.
   - All state transitions pass through Pydantic v2 schemas for data sanitization.
   - Database models inherit from a common SQLAlchemy `Base`.

2. **Role-Based Access Control (RBAC)**:
   - Three distinct roles: `Admin`, `Tester`, `Reviewer`.
   - Security enforced at both API dependency layer (`require_roles`) and frontend routing layer (`ProtectedRoute`).

3. **Metrological Integrity**:
   - In accordance with Phase 1 design guidelines, no fake or unverified OIML formulas are hard-coded.
   - The `services/compliance/` module is isolated to allow seamless injection of the calculation engine in Phase 3.
