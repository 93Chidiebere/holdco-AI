from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import uuid
import pandas as pd
import io
from datetime import datetime

import models, schemas, database, auth

router = APIRouter(prefix="/api/portal", tags=["portal"])

@router.post("/generate-token", response_model=schemas.SubsidiaryToken)
def generate_portal_token(
    request: schemas.SubsidiaryTokenBase,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if not current_user.holding_company_id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    sub = db.query(models.Subsidiary).filter(models.Subsidiary.id == request.subsidiary_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subsidiary not found")
        
    if current_user.role != "superadmin" and sub.holding_company_id != current_user.holding_company_id:
        raise HTTPException(status_code=403, detail="Not authorized for this subsidiary")
        
    # Generate a unique token
    token_str = str(uuid.uuid4())
    token_record = models.SubsidiaryToken(
        subsidiary_id=request.subsidiary_id,
        token=token_str
    )
    db.add(token_record)
    db.commit()
    db.refresh(token_record)
    
    return token_record

@router.get("/verify/{token}")
def verify_token(token: str, db: Session = Depends(database.get_db)):
    token_record = db.query(models.SubsidiaryToken).filter(models.SubsidiaryToken.token == token).first()
    if not token_record:
        raise HTTPException(status_code=404, detail="Invalid or expired token")
        
    sub = db.query(models.Subsidiary).filter(models.Subsidiary.id == token_record.subsidiary_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subsidiary not found")
        
    return {
        "valid": True,
        "subsidiary_name": sub.name,
        "subsidiary_id": sub.id
    }

@router.post("/upload/{token}")
async def upload_financial_data(
    token: str,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    token_record = db.query(models.SubsidiaryToken).filter(models.SubsidiaryToken.token == token).first()
    if not token_record:
        raise HTTPException(status_code=404, detail="Invalid or expired token")
        
    # Read CSV
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {str(e)}")
        
    # Expected columns
    expected_columns = [
        "Date", "Total_Inflow", "Total_Outflow", "Cash_Reserve", "Primary_KPI", "Secondary_KPI"
    ]
    
    missing_cols = [col for col in expected_columns if col not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing_cols)}")
        
    records_added = 0
    
    # Process rows
    for index, row in df.iterrows():
        try:
            # Parse Date (Expected YYYY-MM)
            date_str = str(row["Date"])
            if len(date_str) == 7:
                period_date = datetime.strptime(date_str, "%Y-%m")
            else:
                period_date = datetime.strptime(date_str, "%Y-%m-%d")
                
            norm_data = models.NormalizedData(
                subsidiary_id=token_record.subsidiary_id,
                date=period_date,
                total_inflow=float(row.get("Total_Inflow", 0)),
                total_outflow=float(row.get("Total_Outflow", 0)),
                net_surplus=float(row.get("Total_Inflow", 0)) - float(row.get("Total_Outflow", 0)),
                cash_reserve=float(row.get("Cash_Reserve", 0)),
                primary_kpi=float(row.get("Primary_KPI", 0)) if pd.notna(row.get("Primary_KPI")) else None,
                secondary_kpi=float(row.get("Secondary_KPI", 0)) if pd.notna(row.get("Secondary_KPI")) else None,
            )
            db.add(norm_data)
            records_added += 1
            
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Error parsing row {index + 1}: {str(e)}")
            
    db.commit()
    
    # -------------------------------------------------------------------------
    # TRIGGER AI INSIGHT GENERATION
    # -------------------------------------------------------------------------
    try:
        from services.ai_service import generate_financial_insights
        
        # Prepare historical data to send to LLM
        sub = db.query(models.Subsidiary).filter(models.Subsidiary.id == token_record.subsidiary_id).first()
        recent_data = db.query(models.NormalizedData).filter(
            models.NormalizedData.subsidiary_id == sub.id
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
            
        ai_response = generate_financial_insights(sub.name, history_dicts)
        
        # Save Insights
        for ins in ai_response.get("insights", []):
            db.add(models.AIInsight(
                subsidiary_id=sub.id,
                title=ins.get("title", "AI Insight"),
                description=ins.get("description", ""),
                severity=ins.get("severity", "medium"),
                type=ins.get("type", "opportunity")
            ))
            
        # Save Recommendations
        for rec in ai_response.get("recommendations", []):
            db.add(models.CapitalRecommendation(
                holding_company_id=sub.holding_company_id,
                title=rec.get("title", "Capital Recommendation"),
                description=rec.get("description", ""),
                type=rec.get("type", "growth_investment"),
                amount=rec.get("amount", 0),
                currency=sub.currency,
                from_subsidiary=sub.name,
                priority=rec.get("priority", "medium"),
                status="pending"
            ))
            
        db.commit()
    except Exception as ai_e:
        print(f"AI Generation Failed: {ai_e}")
        # We don't fail the upload if AI generation fails
        pass
    
    return {"message": f"Successfully uploaded {records_added} records and generated AI insights.", "records": records_added}
