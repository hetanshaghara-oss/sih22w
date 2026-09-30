import os
import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.test import Test
from app.models.report import Report
from app.schemas.report import (
    ReportCreate,
    ReportSummaryResponse,
    ReportDetailResponse,
    PaginatedReports
)
from app.services.reports.generator import ReportGenerator

router = APIRouter(prefix="/reports", tags=["Test Reports"])

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


def generate_report_number(db: Session) -> str:
    year = datetime.now().year
    prefix = f"REP-{year}-"
    last_report = (
        db.query(Report)
        .filter(Report.report_number.like(f"{prefix}%"))
        .order_by(Report.id.desc())
        .first()
    )
    if last_report and last_report.report_number.startswith(prefix):
        try:
            seq = int(last_report.report_number.split("-")[-1]) + 1
        except ValueError:
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


@router.post("", response_model=ReportDetailResponse, status_code=status.HTTP_201_CREATED)
def generate_and_save_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates a formal tamper-evident OIML R-76 test report and stores it in the database.
    Also creates and saves the PDF certificate file.
    """
    test = db.query(Test).filter(Test.id == payload.test_id).first()
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test session not found")

    # Compile data and calculate SHA-256 hash
    compiled = ReportGenerator.compile_report_data(test, payload.summary_remarks)
    report_data = compiled["data"]
    checksum_hash = compiled["checksum"]
    overall_verdict = compiled["overall_verdict"]

    report_number = generate_report_number(db)
    pdf_filename = f"{report_number}.pdf"
    pdf_path = os.path.join(REPORTS_DIR, pdf_filename)

    # Render PDF certificate to disk
    ReportGenerator.generate_pdf(report_data, output_path=pdf_path)

    # Create Report DB record
    report = Report(
        report_number=report_number,
        test_id=test.id,
        certificate_title="OIML R 76-1 TEST REPORT FOR NON-AUTOMATIC WEIGHING INSTRUMENTS",
        overall_verdict=overall_verdict,
        issued_by_id=current_user.id,
        authorized_by_id=test.reviewer_id if test.reviewer_id else current_user.id,
        report_data_json=json.dumps(report_data),

        summary_remarks=payload.summary_remarks,
        checksum_hash=checksum_hash,
        file_path=pdf_path
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    from app.services.audit.logger import log_activity
    log_activity(
        db=db,
        action="GENERATE_REPORT",
        entity_type="Report",
        entity_id=report.id,
        reference_number=report.report_number,
        user_id=current_user.id,
        details={
            "report_number": report.report_number,
            "test_id": test.test_id,
            "overall_verdict": overall_verdict,
            "checksum": checksum_hash[:16] + "..."
        },
    )
    db.commit()

    return report



@router.get("", response_model=PaginatedReports)
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    verdict: Optional[str] = None,
):
    query = (
        db.query(Report)
        .options(
            joinedload(Report.issued_by),
            joinedload(Report.authorized_by),
            joinedload(Report.test).joinedload(Test.instrument),
        )
    )

    if search:
        s = f"%{search}%"
        query = query.join(Report.test).join(Test.instrument).filter(
            or_(
                Report.report_number.ilike(s),
                Test.test_id.ilike(s),
                Test.instrument.has(manufacturer=s),
                Test.instrument.has(model=s),
            )
        )

    if verdict:
        query = query.filter(Report.overall_verdict == verdict.upper())

    total = query.count()
    items = (
        query.order_by(Report.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/{report_id}", response_model=ReportDetailResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = (
        db.query(Report)
        .options(
            joinedload(Report.issued_by),
            joinedload(Report.authorized_by),
            joinedload(Report.test).joinedload(Test.instrument),
        )
        .filter(Report.id == report_id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    return report


@router.get("/{report_id}/pdf")
def download_report_pdf(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    # If file exists on disk, read it; otherwise regenerate from frozen json
    if report.file_path and os.path.exists(report.file_path):
        with open(report.file_path, "rb") as f:
            pdf_bytes = f.read()
    else:
        report_data = json.loads(report.report_data_json)
        pdf_bytes = ReportGenerator.generate_pdf(report_data)

    filename = f"{report.report_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"'
        }
    )


@router.get("/preview-by-test/{test_id}")
def preview_report_by_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns an instant live report snapshot preview for a test without saving to DB.
    """
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test session not found")

    compiled = ReportGenerator.compile_report_data(test)
    return compiled


@router.get("/preview-pdf-by-test/{test_id}")
def preview_pdf_by_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Streams an on-the-fly PDF preview without saving a report record yet.
    """
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test session not found")

    compiled = ReportGenerator.compile_report_data(test)
    pdf_bytes = ReportGenerator.generate_pdf(compiled["data"])

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="PREVIEW-{test.test_id}.pdf"'
        }
    )
