from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database, auth

router = APIRouter(prefix="/api/subsidiaries", tags=["subsidiaries"])

@router.get("/", response_model=List[schemas.Subsidiary])
def read_subsidiaries(
    skip: int = 0, limit: int = 100, 
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if current_user.role == "superadmin":
        subsidiaries = db.query(models.Subsidiary).offset(skip).limit(limit).all()
    else:
        subsidiaries = db.query(models.Subsidiary).filter(
            models.Subsidiary.holding_company_id == current_user.holding_company_id
        ).offset(skip).limit(limit).all()
    return subsidiaries

@router.post("/", response_model=schemas.Subsidiary)
def create_subsidiary(
    subsidiary: schemas.SubsidiaryCreate, 
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if not current_user.holding_company_id:
        raise HTTPException(status_code=400, detail="User does not belong to a holding company")
        
    db_subsidiary = models.Subsidiary(
        **subsidiary.dict(),
        holding_company_id=current_user.holding_company_id
    )
    db.add(db_subsidiary)
    db.commit()
    db.refresh(db_subsidiary)
    return db_subsidiary

@router.get("/{subsidiary_id}", response_model=schemas.Subsidiary)
def read_subsidiary(
    subsidiary_id: str, 
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    subsidiary = db.query(models.Subsidiary).filter(models.Subsidiary.id == subsidiary_id).first()
    if subsidiary is None:
        raise HTTPException(status_code=404, detail="Subsidiary not found")
        
    if current_user.role != "superadmin" and subsidiary.holding_company_id != current_user.holding_company_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this subsidiary")
        
    return subsidiary
