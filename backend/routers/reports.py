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

@router.post("/submit-normalized")
def submit_normalized_data(
    payload: schemas.NormalizedDataSubmit,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    subsidiary = db.query(models.Subsidiary).filter(models.Subsidiary.id == payload.subsidiary_id).first()
    if not subsidiary or (current_user.role != "superadmin" and subsidiary.holding_company_id != current_user.holding_company_id):
        raise HTTPException(status_code=403, detail="Not authorized for this subsidiary")

    records_added = 0
    for row in payload.rows:
        try:
            date_str = str(row.date)
            if len(date_str) == 7:
                period_date = datetime.strptime(date_str, "%Y-%m")
            else:
                try:
                    period_date = datetime.strptime(date_str, "%Y-%m-%d")
                except:
                    period_date = datetime.utcnow()
                    
            norm_data = models.NormalizedData(
                subsidiary_id=payload.subsidiary_id,
                date=period_date,
                gross_revenue=row.gross_revenue,
                cogs=row.cogs,
                operating_expenses=row.operating_expenses,
                pbt=row.pbt,
                net_income=row.net_income,
                cash_and_equivalents=row.cash_and_equivalents,
                total_assets=row.total_assets,
                total_liabilities=row.total_liabilities,
                total_equity=row.total_equity,
                capital_expenditure=row.capital_expenditure,
                headcount=row.headcount
            )
            db.add(norm_data)
            records_added += 1
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Error parsing row: {str(e)}")
            
    db.commit()

    return {"message": f"Successfully normalized {records_added} records"}
