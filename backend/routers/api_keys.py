from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user
import secrets
import hashlib
from datetime import datetime

router = APIRouter(prefix="/api/keys", tags=["API Keys"])

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

def generate_api_key():
    # Returns (raw_key, hashed_key, prefix)
    raw_key = "hk_" + secrets.token_urlsafe(32)
    hashed_key = hash_api_key(raw_key)
    prefix = raw_key[:8]
    return raw_key, hashed_key, prefix

@router.post("/", response_model=schemas.APIKeyWithSecret)
def create_api_key(
    key_in: schemas.APIKeyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.holding_company_id:
        raise HTTPException(status_code=400, detail="User not part of an organization")
        
    raw_key, hashed_key, prefix = generate_api_key()
    
    db_key = models.APIKey(
        holding_company_id=current_user.holding_company_id,
        name=key_in.name,
        key_hash=hashed_key,
        prefix=prefix
    )
    db.add(db_key)
    db.commit()
    db.refresh(db_key)
    
    return {
        "id": db_key.id,
        "name": db_key.name,
        "prefix": db_key.prefix,
        "created_at": db_key.created_at,
        "last_used_at": db_key.last_used_at,
        "is_active": db_key.is_active,
        "key": raw_key # Return raw key only once!
    }

@router.get("/", response_model=list[schemas.APIKeyResponse])
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.holding_company_id:
        return []
    return db.query(models.APIKey).filter(
        models.APIKey.holding_company_id == current_user.holding_company_id
    ).all()

@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_key = db.query(models.APIKey).filter(
        models.APIKey.id == key_id,
        models.APIKey.holding_company_id == current_user.holding_company_id
    ).first()
    
    if not db_key:
        raise HTTPException(status_code=404, detail="API Key not found")
        
    db.delete(db_key)
    db.commit()
    return None
