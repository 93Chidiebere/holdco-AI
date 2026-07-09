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
