from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from datetime import datetime, timedelta
import random

import models, database, auth

router = APIRouter(prefix="/api/platform", tags=["platform"])

@router.post("/seed")
def seed_dummy_data(
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    hc_id = current_user.holding_company_id
    if not hc_id:
        raise HTTPException(status_code=400, detail="User must belong to a holding company to seed data")
        
    # Check if data already exists
    existing_subs = db.query(models.Subsidiary).filter(models.Subsidiary.holding_company_id == hc_id).count()
    if existing_subs > 0:
        raise HTTPException(status_code=400, detail="Database already contains subsidiaries. Clear data first.")

    # Create Subsidiaries
    subsidiaries_data = [
        {"name": "TechVentures Ltd", "industry": "Technology", "country": "Nigeria", "currency": "NGN", "description": "Software and IT services"},
        {"name": "FinServe Group", "industry": "Financial Services", "country": "Kenya", "currency": "KES", "description": "Microfinance and payments"},
        {"name": "MediCare Hospitals", "industry": "Healthcare", "country": "South Africa", "currency": "ZAR", "description": "Private healthcare network"},
        {"name": "AgriGrowth Partners", "industry": "Agriculture", "country": "Ghana", "currency": "GHS", "description": "Commercial farming operations"},
        {"name": "EnergyPrime", "industry": "Energy", "country": "Nigeria", "currency": "NGN", "description": "Renewable energy solutions"},
    ]
    
    subsidiary_records = []
    for data in subsidiaries_data:
        sub = models.Subsidiary(**data, holding_company_id=hc_id)
        db.add(sub)
        subsidiary_records.append(sub)
    
    db.commit()
    for sub in subsidiary_records:
        db.refresh(sub)
        
    # Create KPIs
    for sub in subsidiary_records:
        roace = round(random.uniform(5.0, 25.0), 1)
        kpi = models.KPI(
            holding_company_id=hc_id,
            subsidiary_id=sub.id,
            metric_name="roace",
            metric_value=roace,
            unit="%",
            period_date=datetime.utcnow()
        )
        db.add(kpi)
        
        rev_growth = round(random.uniform(-5.0, 30.0), 1)
        kpi2 = models.KPI(
            holding_company_id=hc_id,
            subsidiary_id=sub.id,
            metric_name="revenue_growth",
            metric_value=rev_growth,
            unit="%",
            period_date=datetime.utcnow()
        )
        db.add(kpi2)
        
    # Create AI Insights
    insights_data = [
        {"title": "Cash Drag in FinServe", "description": "FinServe holds 40% of its assets in low-yield cash equivalents. Consider sweeping excess cash to holding company level.", "severity": "medium", "category": "liquidity"},
        {"title": "FX Exposure Risk", "description": "High exposure to NGN depreciation detected in TechVentures. Recommend hedging strategies.", "severity": "high", "category": "risk"},
        {"title": "Margin Expansion", "description": "MediCare Hospitals show a 300bps improvement in EBITDA margin this quarter due to optimized procurement.", "severity": "low", "category": "performance"},
        {"title": "Capital Misallocation", "description": "EnergyPrime ROIC is below WACC. Re-evaluate ongoing CAPEX projects.", "severity": "critical", "category": "capital"},
    ]
    
    for i, data in enumerate(insights_data):
        insight = models.AIInsight(
            **data,
            holding_company_id=hc_id,
            related_subsidiary_id=subsidiary_records[i % len(subsidiary_records)].id,
        )
        db.add(insight)
        
    # Create Recommendations
    rec1 = models.CapitalRecommendation(
        holding_company_id=hc_id,
        title="Intercompany Loan to EnergyPrime",
        description="Provide a $2M internal loan from FinServe to EnergyPrime at 8% to avoid expensive external debt.",
        recommendation_type="intercompany_loan",
        amount=2000000,
        confidence_score=0.85,
        source_subsidiary_id=subsidiary_records[1].id,
        target_subsidiary_id=subsidiary_records[4].id
    )
    db.add(rec1)

    db.commit()

    return {"message": "Data seeded successfully"}
