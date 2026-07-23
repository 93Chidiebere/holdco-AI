from fastapi import Depends, HTTPException, Security, Request
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from database import get_db
import models
from routers.api_keys import hash_api_key
from datetime import datetime
import auth

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_holding_company_from_api_key(
    api_key_header: str = Security(api_key_header),
    db: Session = Depends(get_db)
) -> models.HoldingCompany:
    if not api_key_header:
        raise HTTPException(status_code=401, detail="Missing API Key")
        
    hashed_key = hash_api_key(api_key_header)
    
    db_key = db.query(models.APIKey).filter(
        models.APIKey.key_hash == hashed_key,
        models.APIKey.is_active == True
    ).first()
    
    if not db_key:
        raise HTTPException(status_code=403, detail="Invalid or revoked API Key")
        
    # Update last used
    db_key.last_used_at = datetime.utcnow()
    db.commit()
    
    company = db.query(models.HoldingCompany).filter(models.HoldingCompany.id == db_key.holding_company_id).first()
    if not company:
        raise HTTPException(status_code=403, detail="Holding company not found")
        
    return company

def get_holding_company_from_api_key_or_user(
    request: Request,
    db: Session = Depends(get_db)
) -> models.HoldingCompany:
    # 1. Check for API Key first
    api_key = request.headers.get(API_KEY_NAME)
    if api_key:
        return get_holding_company_from_api_key(api_key, db)
        
    # 2. Fall back to JWT Auth (SaaS UI)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing API Key or Authorization Token")
        
    token = auth_header.split(" ")[1]
    user = auth.get_current_user(token, db)
    
    if not user.holding_company_id:
        raise HTTPException(status_code=403, detail="User is not associated with a holding company")
        
    company = db.query(models.HoldingCompany).filter(models.HoldingCompany.id == user.holding_company_id).first()
    if not company:
        raise HTTPException(status_code=403, detail="Holding company not found")
        
    return company
