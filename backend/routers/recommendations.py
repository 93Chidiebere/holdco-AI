from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database, auth

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

@router.get("/", response_model=List[schemas.CapitalRecommendation])
def read_recommendations(
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if not current_user.holding_company_id and current_user.role != "superadmin":
        return []
        
    query = db.query(models.CapitalRecommendation)
    if current_user.role != "superadmin":
        query = query.filter(models.CapitalRecommendation.holding_company_id == current_user.holding_company_id)
        
    return query.all()
