from fastapi import APIRouter
from app.api.v1 import (
    auth,
    instruments,
    dashboard,
    tests,
    test_definitions,
    test_instances,
    compliance_rules,
    reports,
    users,
    audit_logs,
    system,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(instruments.router)
api_router.include_router(dashboard.router)
api_router.include_router(tests.router)
api_router.include_router(test_definitions.router)
api_router.include_router(test_instances.router)
api_router.include_router(compliance_rules.router)
api_router.include_router(reports.router)
api_router.include_router(users.router)
api_router.include_router(audit_logs.router)
api_router.include_router(system.router)


