import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import shutil
from datetime import datetime

import models, schemas, database, auth

router = APIRouter(prefix="/api/reports", tags=["reports"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def process_report_background(report_id: str, db: Session):
    # Dummy processing function for now
    # In reality, parse CSV/Excel and populate NormalizedData
    report = db.query(models.FinancialReport).filter(models.FinancialReport.id == report_id).first()
    if report:
        report.status = "normalized"
        db.commit()

@router.post("/upload", response_model=schemas.FinancialReport)
def upload_report(
    background_tasks: BackgroundTasks,
    subsidiary_id: str = Form(...),
    report_type: str = Form(...),
    reporting_period: str = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    # Verify subsidiary belongs to the user's holding company
    subsidiary = db.query(models.Subsidiary).filter(models.Subsidiary.id == subsidiary_id).first()
    if not subsidiary or (current_user.role != "superadmin" and subsidiary.holding_company_id != current_user.holding_company_id):
        raise HTTPException(status_code=403, detail="Not authorized to upload for this subsidiary")

    file_location = os.path.join(UPLOAD_DIR, f"{datetime.utcnow().timestamp()}_{file.filename}")
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    db_report = models.FinancialReport(
        subsidiary_id=subsidiary_id,
        report_type=report_type,
        reporting_period=reporting_period,
        file_name=file.filename,
        status="pending"
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    background_tasks.add_task(process_report_background, db_report.id, db)
    
    return db_report

@router.get("/", response_model=List[schemas.FinancialReport])
def read_reports(
    subsidiary_id: str = None,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    query = db.query(models.FinancialReport).join(models.Subsidiary)
    
    if current_user.role != "superadmin":
        query = query.filter(models.Subsidiary.holding_company_id == current_user.holding_company_id)
        
    if subsidiary_id:
        query = query.filter(models.FinancialReport.subsidiary_id == subsidiary_id)
        
    return query.all()
