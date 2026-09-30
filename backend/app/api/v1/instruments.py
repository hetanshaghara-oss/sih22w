import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.instrument import Instrument, InstrumentStatus
from app.models.test import Test
from app.services.audit.logger import log_activity
from app.schemas.instrument import (
    InstrumentCreate,
    InstrumentUpdate,
    InstrumentResponse,
    PaginatedInstruments,
)

router = APIRouter(prefix="/instruments", tags=["Instruments"])


@router.get("", response_model=PaginatedInstruments)
def list_instruments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None, description="Search by ID, manufacturer, model, or serial number"),
    status: Optional[str] = Query(None, description="Filter by status (Active, Inactive, Under Testing)"),
    instrument_type: Optional[str] = Query(None, description="Filter by instrument type"),
    accuracy_class: Optional[str] = Query(None, description="Filter by accuracy class"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort direction"),
):
    query = db.query(Instrument)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Instrument.instrument_id.ilike(search_fmt),
                Instrument.manufacturer.ilike(search_fmt),
                Instrument.model.ilike(search_fmt),
                Instrument.serial_number.ilike(search_fmt),
            )
        )

    if status:
        query = query.filter(Instrument.status == status)

    if instrument_type:
        query = query.filter(Instrument.instrument_type == instrument_type)

    if accuracy_class:
        query = query.filter(Instrument.accuracy_class == accuracy_class)

    total = query.count()

    # Sorting
    sort_column = getattr(Instrument, sort_by, Instrument.created_at)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Pagination
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return PaginatedInstruments(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{instrument_id}", response_model=InstrumentResponse)
def get_instrument(
    instrument_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    instrument = db.query(Instrument).filter(Instrument.id == instrument_id).first()
    if not instrument:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instrument with ID #{instrument_id} not found."
        )
    return instrument


@router.post("", response_model=InstrumentResponse, status_code=status.HTTP_201_CREATED)
def create_instrument(
    instrument_in: InstrumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.TESTER])),
):
    # Check duplicate instrument_id
    existing = db.query(Instrument).filter(
        Instrument.instrument_id == instrument_in.instrument_id.strip()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An instrument with ID '{instrument_in.instrument_id}' already exists."
        )

    instrument = Instrument(
        instrument_id=instrument_in.instrument_id.strip(),
        manufacturer=instrument_in.manufacturer.strip(),
        model=instrument_in.model.strip(),
        serial_number=instrument_in.serial_number.strip(),
        instrument_type=instrument_in.instrument_type.strip(),
        instrument_class=instrument_in.instrument_class.strip(),
        maximum_capacity=instrument_in.maximum_capacity,
        minimum_capacity=instrument_in.minimum_capacity,
        verification_scale_interval=instrument_in.verification_scale_interval,
        accuracy_class=instrument_in.accuracy_class.strip(),
        country_of_manufacture=instrument_in.country_of_manufacture.strip(),
        status=instrument_in.status,
    )

    db.add(instrument)
    db.commit()
    db.refresh(instrument)

    log_activity(
        db,
        action="CREATE_INSTRUMENT",
        entity_type="instrument",
        entity_id=instrument.id,
        user_id=current_user.id,
        reference_number=instrument.instrument_id,
        details={
            "manufacturer": instrument.manufacturer,
            "model": instrument.model,
            "serial_number": instrument.serial_number,
            "accuracy_class": instrument.accuracy_class,
        }
    )
    db.commit()

    return instrument


@router.put("/{instrument_id}", response_model=InstrumentResponse)
def update_instrument(
    instrument_id: int,
    instrument_in: InstrumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.TESTER])),
):
    instrument = db.query(Instrument).filter(Instrument.id == instrument_id).first()
    if not instrument:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instrument with ID #{instrument_id} not found."
        )

    # Check unique instrument_id if being updated
    if instrument_in.instrument_id and instrument_in.instrument_id.strip() != instrument.instrument_id:
        existing = db.query(Instrument).filter(
            Instrument.instrument_id == instrument_in.instrument_id.strip()
        ).first()
        if existing and existing.id != instrument_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An instrument with ID '{instrument_in.instrument_id}' already exists."
            )

    update_data = instrument_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(instrument, field, value)

    db.commit()
    db.refresh(instrument)

    log_activity(
        db,
        action="UPDATE_INSTRUMENT",
        entity_type="instrument",
        entity_id=instrument.id,
        user_id=current_user.id,
        reference_number=instrument.instrument_id,
        details=update_data
    )
    db.commit()

    return instrument


@router.delete("/{instrument_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_instrument(
    instrument_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.TESTER])),
):
    instrument = db.query(Instrument).filter(Instrument.id == instrument_id).first()
    if not instrument:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Instrument with ID #{instrument_id} not found."
        )

    # Protect against accidental deletion if tests are associated with instrument
    linked_tests = db.query(Test).filter(Test.instrument_id == instrument_id).count()
    if linked_tests > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete instrument '{instrument.instrument_id}' because it has {linked_tests} associated test record(s). Deactivate or archive it instead."
        )

    inst_id_ref = instrument.instrument_id
    mfg = instrument.manufacturer
    model = instrument.model

    db.delete(instrument)
    db.commit()

    log_activity(
        db,
        action="DELETE_INSTRUMENT",
        entity_type="instrument",
        entity_id=instrument_id,
        user_id=current_user.id,
        reference_number=inst_id_ref,
        details={"manufacturer": mfg, "model": model}
    )
    db.commit()

    return None
