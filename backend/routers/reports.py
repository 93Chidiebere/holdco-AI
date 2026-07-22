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
                total_inflow=row.total_inflow,
                total_outflow=row.total_outflow,
                net_surplus=row.net_surplus,
                cash_reserve=row.cash_reserve,
                primary_kpi=row.primary_kpi,
                secondary_kpi=row.secondary_kpi
            )
            db.add(norm_data)
            records_added += 1
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Error parsing row: {str(e)}")
            
    db.commit()

    # -------------------------------------------------------------------------
    # TRIGGER AI INSIGHT GENERATION
    # -------------------------------------------------------------------------
    try:
        from services.ai_service import generate_financial_insights
        
        # Prepare historical data to send to LLM
        recent_data = db.query(models.NormalizedData).filter(
            models.NormalizedData.subsidiary_id == subsidiary.id
        ).order_by(models.NormalizedData.date.desc()).limit(12).all()
        
        # Convert to dicts for LLM
        history_dicts = []
        for d in recent_data:
            history_dicts.append({
                "date": d.date.strftime("%Y-%m"),
                "total_inflow": d.total_inflow,
                "total_outflow": d.total_outflow,
                "net_surplus": d.net_surplus,
                "cash_reserve": d.cash_reserve
            })
            
        ai_response = generate_financial_insights(subsidiary.name, history_dicts)
        
        # Save Insights
        for ins in ai_response.get("insights", []):
            db.add(models.AIInsight(
                subsidiary_id=subsidiary.id,
                title=ins.get("title", "AI Insight"),
                description=ins.get("description", ""),
                severity=ins.get("severity", "medium"),
                type=ins.get("type", "opportunity")
            ))
            
        # Save Recommendations
        for rec in ai_response.get("recommendations", []):
            db.add(models.CapitalRecommendation(
                holding_company_id=subsidiary.holding_company_id,
                title=rec.get("title", "Capital Recommendation"),
                description=rec.get("description", ""),
                type=rec.get("type", "growth_investment"),
                amount=rec.get("amount", 0),
                currency=subsidiary.currency,
                from_subsidiary=subsidiary.name,
                priority=rec.get("priority", "medium"),
                status="pending"
            ))
            
        db.commit()
    except Exception as ai_e:
        print(f"AI Generation Failed: {ai_e}")
        pass

    return {"message": f"Successfully normalized {records_added} records"}
