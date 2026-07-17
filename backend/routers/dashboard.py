from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta

import models, database, auth

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

def get_exchange_rate(db: Session, from_currency: str, to_currency: str) -> float:
    if from_currency == to_currency:
        return 1.0
        
    # Check direct rate
    rate_record = db.query(models.FXRate).filter(
        models.FXRate.base_currency == from_currency,
        models.FXRate.target_currency == to_currency
    ).first()
    
    if rate_record:
        return rate_record.rate
        
    # Check inverse rate
    inverse_record = db.query(models.FXRate).filter(
        models.FXRate.base_currency == to_currency,
        models.FXRate.target_currency == from_currency
    ).first()
    
    if inverse_record and inverse_record.rate != 0:
        return 1.0 / inverse_record.rate
        
    return 1.0 # fallback

@router.get("/stats")
def get_dashboard_stats(
    currency: str = Query("USD"),
    apply_eliminations: str = Query("true"),
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    apply_elim = apply_eliminations.lower() == "true"
    hc_id = current_user.holding_company_id
    if not hc_id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Get all active subsidiaries
    subs_query = db.query(models.Subsidiary)
    if current_user.role != "superadmin":
        subs_query = subs_query.filter(models.Subsidiary.holding_company_id == hc_id)
    
    subsidiaries = subs_query.all()
    sub_ids = [s.id for s in subsidiaries]
    
    # Calculate Total Revenue (YTD or last 12 months for simplicity)
    # We will aggregate all NormalizedData
    all_data = db.query(models.NormalizedData).filter(models.NormalizedData.subsidiary_id.in_(sub_ids)).all()
    
    total_revenue = 0.0
    total_net_income = 0.0
    total_equity = 0.0
    
    for sub in subsidiaries:
        sub_data = [d for d in all_data if d.subsidiary_id == sub.id]
        if not sub_data:
            continue
            
        rate = get_exchange_rate(db, sub.currency, currency)
        
        # Sum revenue and income
        for d in sub_data:
            total_revenue += (d.gross_revenue or 0) * rate
            total_net_income += (d.net_income or 0) * rate
            
        # For equity, take the latest record
        latest_data = sorted(sub_data, key=lambda x: x.date, reverse=True)[0]
        total_equity += (latest_data.total_equity or 0) * rate
        
    # Intercompany Eliminations
    eliminated_revenue = 0.0
    if apply_elim and hc_id:
        transactions = db.query(models.InterCompanyTransaction).filter(
            models.InterCompanyTransaction.holding_company_id == hc_id
        ).all()
        for t in transactions:
            rate = get_exchange_rate(db, t.currency, currency)
            eliminated_revenue += (t.amount or 0) * rate
            
        total_revenue -= eliminated_revenue
        if total_revenue < 0: total_revenue = 0
        
    # Calculate Portfolio ROACE
    # Return on Average Capital Employed (Net Income / Total Equity roughly for simplicity here)
    portfolio_roace = 0.0
    if total_equity > 0:
        portfolio_roace = (total_net_income / total_equity) * 100
        
    return {
        "total_revenue": total_revenue,
        "portfolio_roace": portfolio_roace,
        "active_subsidiaries": len(subsidiaries),
        "eliminated_amount": eliminated_revenue
    }

@router.get("/revenue-trend")
def get_revenue_trend(
    currency: str = Query("USD"),
    apply_eliminations: str = Query("true"),
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    apply_elim = apply_eliminations.lower() == "true"
    hc_id = current_user.holding_company_id
    if not hc_id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    subs_query = db.query(models.Subsidiary)
    if current_user.role != "superadmin":
        subs_query = subs_query.filter(models.Subsidiary.holding_company_id == hc_id)
        
    subsidiaries = subs_query.all()
    sub_ids = [s.id for s in subsidiaries]
    
    # Get last 12 months
    now = datetime.utcnow()
    twelve_months_ago = now - timedelta(days=365)
    
    all_data = db.query(models.NormalizedData).filter(
        models.NormalizedData.subsidiary_id.in_(sub_ids),
        models.NormalizedData.date >= twelve_months_ago
    ).all()
    
    # Group by month string (YYYY-MM)
    monthly_data = {}
    
    for sub in subsidiaries:
        sub_data = [d for d in all_data if d.subsidiary_id == sub.id]
        rate = get_exchange_rate(db, sub.currency, currency)
        
        for d in sub_data:
            month_key = d.date.strftime("%b") # Jan, Feb
            sort_key = d.date.strftime("%Y-%m")
            
            if sort_key not in monthly_data:
                monthly_data[sort_key] = {"month": month_key, "sort_key": sort_key}
                
            if sub.name not in monthly_data[sort_key]:
                monthly_data[sort_key][sub.name] = 0.0
                
            monthly_data[sort_key][sub.name] += (d.gross_revenue or 0) * rate

    # Apply monthly eliminations
    if apply_elim and hc_id:
        transactions = db.query(models.InterCompanyTransaction).filter(
            models.InterCompanyTransaction.holding_company_id == hc_id,
            models.InterCompanyTransaction.date >= twelve_months_ago
        ).all()
        
        for t in transactions:
            rate = get_exchange_rate(db, t.currency, currency)
            sort_key = t.date.strftime("%Y-%m")
            if sort_key in monthly_data:
                # We subtract from the selling subsidiary (revenue was recognized there)
                seller = db.query(models.Subsidiary).filter(models.Subsidiary.id == t.selling_subsidiary_id).first()
                if seller and seller.name in monthly_data[sort_key]:
                    monthly_data[sort_key][seller.name] -= (t.amount * rate)
                    if monthly_data[sort_key][seller.name] < 0:
                        monthly_data[sort_key][seller.name] = 0

    # Sort chronologically
    sorted_months = sorted(list(monthly_data.values()), key=lambda x: x["sort_key"])
    
    # Clean up sort_key
    for m in sorted_months:
        del m["sort_key"]
        
    return sorted_months
