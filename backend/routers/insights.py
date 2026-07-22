from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database, auth

router = APIRouter(prefix="/api/insights", tags=["insights"])

@router.get("/", response_model=List[schemas.AIInsight])
def read_insights(
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if not current_user.holding_company_id and current_user.role != "superadmin":
        return []
        
    query = db.query(models.AIInsight)
    if current_user.role != "superadmin":
        query = query.join(models.Subsidiary).filter(models.Subsidiary.holding_company_id == current_user.holding_company_id)
        
    return query.all()

@router.post("/generate-portfolio")
def generate_portfolio(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if not current_user.holding_company_id:
        raise HTTPException(status_code=400, detail="User not part of a holding company")
        
    hc = db.query(models.HoldingCompany).filter(models.HoldingCompany.id == current_user.holding_company_id).first()
    subs = db.query(models.Subsidiary).filter(models.Subsidiary.holding_company_id == hc.id).all()
    
    if not subs:
        raise HTTPException(status_code=400, detail="No subsidiaries found")
        
    portfolio_data = []
    for sub in subs:
        # Get latest 6 months of data per subsidiary for context
        recent = db.query(models.NormalizedData).filter(
            models.NormalizedData.subsidiary_id == sub.id
        ).order_by(models.NormalizedData.date.desc()).limit(6).all()
        
        history = []
        for d in recent:
            history.append({
                "date": d.date.strftime("%Y-%m"),
                "total_inflow": d.total_inflow,
                "total_outflow": d.total_outflow,
                "net_surplus": d.net_surplus,
                "cash_reserve": d.cash_reserve
            })
        
        portfolio_data.append({
            "subsidiary_name": sub.name,
            "industry": sub.industry,
            "recent_performance": history
        })
        
    from services.ai_service import generate_portfolio_insights
    ai_response = generate_portfolio_insights(hc.name, portfolio_data)
    
    records_added = 0
    for ins in ai_response.get("insights", []):
        db.add(models.AIInsight(
            subsidiary_id=subs[0].id, # Assign to first subsidiary so it bypasses join filter
            type="portfolio_" + ins.get("type", "alert"),
            severity=ins.get("severity", "medium"),
            title=ins.get("title", "Portfolio Insight"),
            description=ins.get("description", "")
        ))
        records_added += 1
        
    for rec in ai_response.get("recommendations", []):
        db.add(models.CapitalRecommendation(
            holding_company_id=hc.id,
            type=rec.get("type", "internal_loan"),
            title=rec.get("title", "Portfolio Recommendation"),
            description=rec.get("description", ""),
            amount=rec.get("amount", 0),
            priority=rec.get("priority", "medium"),
            status="pending"
        ))
        records_added += 1
        
    db.commit()
    return {"message": f"Generated {records_added} portfolio insights/recommendations"}
