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
        
    # Clear existing data for this holding company to ensure a fresh seed
    db.query(models.CapitalRecommendation).filter(models.CapitalRecommendation.holding_company_id == hc_id).delete()
    db.query(models.AIInsight).filter(models.AIInsight.subsidiary_id.in_(
        db.query(models.Subsidiary.id).filter(models.Subsidiary.holding_company_id == hc_id)
    )).delete(synchronize_session=False)
    db.query(models.KPI).filter(models.KPI.holding_company_id == hc_id).delete()
    db.query(models.Subsidiary).filter(models.Subsidiary.holding_company_id == hc_id).delete()
    db.commit()

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
            name=f"ROACE - {sub.name}",
            value=roace,
            unit="%",
            trend="up" if roace > 15 else "down",
            change=round(random.uniform(0.1, 3.0), 1)
        )
        db.add(kpi)
        
        rev_growth = round(random.uniform(-5.0, 30.0), 1)
        kpi2 = models.KPI(
            holding_company_id=hc_id,
            name=f"Revenue Growth - {sub.name}",
            value=rev_growth,
            unit="%",
            trend="up" if rev_growth > 0 else "down",
            change=round(random.uniform(0.1, 5.0), 1)
        )
        db.add(kpi2)
        
    # Create AI Insights
    insights_data = [
        {"title": "Cash Drag in FinServe", "description": "FinServe holds 40% of its assets in low-yield cash equivalents. Consider sweeping excess cash to holding company level.", "severity": "medium", "type": "alert"},
        {"title": "FX Exposure Risk", "description": "High exposure to NGN depreciation detected in TechVentures. Recommend hedging strategies.", "severity": "high", "type": "risk"},
        {"title": "Margin Expansion", "description": "MediCare Hospitals show a 300bps improvement in EBITDA margin this quarter due to optimized procurement.", "severity": "low", "type": "opportunity"},
        {"title": "Capital Misallocation", "description": "EnergyPrime ROIC is below WACC. Re-evaluate ongoing CAPEX projects.", "severity": "critical", "type": "anomaly"},
    ]
    
    for i, data in enumerate(insights_data):
        insight = models.AIInsight(
            **data,
            subsidiary_id=subsidiary_records[i % len(subsidiary_records)].id,
        )
        db.add(insight)
        
    # Create Recommendations
    rec1 = models.CapitalRecommendation(
        holding_company_id=hc_id,
        title="Intercompany Loan to EnergyPrime",
        description="Provide a $2M internal loan from FinServe to EnergyPrime at 8% to avoid expensive external debt.",
        type="internal_loan",
        amount=2000000,
        currency="USD",
        from_subsidiary=subsidiary_records[1].name,
        to_subsidiary=subsidiary_records[4].name,
        priority="high",
        status="pending"
    )
    db.add(rec1)

    # Clean existing data for the new seed
    db.query(models.NormalizedData).filter(models.NormalizedData.subsidiary_id.in_([s.id for s in subsidiary_records])).delete(synchronize_session=False)
    db.query(models.InterCompanyTransaction).filter(models.InterCompanyTransaction.holding_company_id == hc_id).delete(synchronize_session=False)
    db.query(models.FXRate).delete(synchronize_session=False)

    # Create FX Rates
    fx_rates = [
        ("USD", 1.0),
        ("NGN", 1500.0),
        ("KES", 130.0),
        ("ZAR", 19.0),
        ("GHS", 14.0),
        ("EUR", 0.92),
        ("GBP", 0.79),
        ("XOF", 600.0)
    ]
    for target, rate in fx_rates:
        if target != "USD":
            db.add(models.FXRate(base_currency="USD", target_currency=target, rate=rate))
            db.add(models.FXRate(base_currency=target, target_currency="USD", rate=1.0/rate))

    # Create Normalized Data for the last 12 months
    for sub in subsidiary_records:
        base_revenue = random.uniform(1000000, 5000000)
        for i in range(12):
            date = datetime.utcnow() - timedelta(days=30 * i)
            rev = base_revenue * (1 + random.uniform(-0.1, 0.2))
            cogs = rev * random.uniform(0.3, 0.6)
            opex = rev * random.uniform(0.1, 0.3)
            pbt = rev - cogs - opex
            db.add(models.NormalizedData(
                subsidiary_id=sub.id,
                date=date,
                gross_revenue=rev,
                cogs=cogs,
                operating_expenses=opex,
                pbt=pbt,
                net_income=pbt * 0.7,
                total_assets=rev * 3,
                total_equity=rev * 1.5,
            ))
            
    # Create some Intercompany Transactions for eliminations
    db.add(models.InterCompanyTransaction(
        holding_company_id=hc_id,
        date=datetime.utcnow(),
        selling_subsidiary_id=subsidiary_records[0].id,
        buying_subsidiary_id=subsidiary_records[1].id,
        amount=500000,
        currency="NGN",
        description="IT Services provided by TechVentures",
        status="pending_elimination"
    ))

    db.commit()

    return {"message": "Data seeded successfully"}
