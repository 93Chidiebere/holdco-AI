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
        query = query.filter(models.AIInsight.holding_company_id == current_user.holding_company_id)
        
    return query.all()
