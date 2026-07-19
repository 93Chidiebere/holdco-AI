from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database, auth

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])

@router.get("/", response_model=List[schemas.Scenario])
def read_scenarios(
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if not current_user.holding_company_id and current_user.role != "superadmin":
        return []
        
    query = db.query(models.Scenario)
    if current_user.role != "superadmin":
        query = query.filter(models.Scenario.holding_company_id == current_user.holding_company_id)
        
    return query.all()

@router.post("/", response_model=schemas.Scenario)
def create_scenario(
    scenario: schemas.ScenarioCreate, 
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if not current_user.holding_company_id:
        raise HTTPException(status_code=400, detail="User does not belong to a holding company")
        
    db_scenario = models.Scenario(
        **scenario.dict(),
        holding_company_id=current_user.holding_company_id
    )
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

class ScenarioSimulateRequest(schemas.BaseModel):
    prompt: str

@router.post("/simulate")
def simulate_scenario(
    req: ScenarioSimulateRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if not current_user.holding_company_id:
        raise HTTPException(status_code=400, detail="User does not belong to a holding company")
        
    hc = db.query(models.HoldingCompany).filter(models.HoldingCompany.id == current_user.holding_company_id).first()
    subs = db.query(models.Subsidiary).filter(models.Subsidiary.holding_company_id == hc.id).all()
    
    portfolio_data = []
    for sub in subs:
        recent = db.query(models.NormalizedData).filter(
            models.NormalizedData.subsidiary_id == sub.id
        ).order_by(models.NormalizedData.date.desc()).limit(3).all()
        
        history = []
        for d in recent:
            history.append({
                "date": d.date.strftime("%Y-%m"),
                "revenue": d.gross_revenue,
                "cogs": d.cogs,
                "opex": d.operating_expenses,
                "net_income": d.net_income,
                "cash": d.cash_and_equivalents
            })
            
        portfolio_data.append({
            "subsidiary_name": sub.name,
            "industry": sub.industry,
            "currency": sub.currency,
            "recent_performance": history
        })
        
    from services.ai_service import simulate_financial_scenario
    simulation_results = simulate_financial_scenario(portfolio_data, req.prompt)
    
    return simulation_results
