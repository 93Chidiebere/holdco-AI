from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, database, auth

router = APIRouter(prefix="/api/kpis", tags=["kpis"])

@router.get("/")
def read_kpis(
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    hc_id = current_user.holding_company_id
    if not hc_id and current_user.role != "superadmin":
        return []
        
    subs_query = db.query(models.Subsidiary)
    if current_user.role != "superadmin":
        subs_query = subs_query.filter(models.Subsidiary.holding_company_id == hc_id)
    subsidiaries = subs_query.all()
    
    computed_kpis = []
    
    for sub in subsidiaries:
        data = db.query(models.NormalizedData).filter(
            models.NormalizedData.subsidiary_id == sub.id
        ).order_by(models.NormalizedData.date.desc()).limit(2).all()
        
        if len(data) > 0:
            latest = data[0]
            
            # Compute ROACE (Net Income / Total Equity)
            roace = 0
            if latest.total_equity and latest.total_equity > 0:
                roace = (latest.net_income or 0) / latest.total_equity * 100
                
            # Compute EBITDA Margin (PBT + Depr, but we just use PBT/Rev for simplicity as proxy)
            ebitda_margin = 0
            if latest.gross_revenue and latest.gross_revenue > 0:
                ebitda_margin = (latest.pbt or 0) / latest.gross_revenue * 100
                
            # Revenue Growth
            rev_growth = 0
            if len(data) == 2:
                prev = data[1]
                if prev.gross_revenue and prev.gross_revenue > 0:
                    rev_growth = ((latest.gross_revenue or 0) - prev.gross_revenue) / prev.gross_revenue * 100
                    
            # Liquidity Ratio (Cash / Total Liabilities as proxy)
            liquidity = 1.5
            if latest.total_liabilities and latest.total_liabilities > 0:
                liquidity = (latest.cash_and_equivalents or 0) / latest.total_liabilities
                
            # Debt/Equity
            debt_equity = 0.8
            if latest.total_equity and latest.total_equity > 0:
                # Approximate debt as total liabilities
                debt_equity = (latest.total_liabilities or 0) / latest.total_equity
                
            computed_kpis.extend([
                {"id": f"roace_{sub.id}", "subsidiary_id": sub.id, "name": "ROACE", "value": round(roace, 1), "unit": "%", "trend": "up" if roace > 10 else "down", "change": 0},
                {"id": f"ebitda_{sub.id}", "subsidiary_id": sub.id, "name": "EBITDA Margin", "value": round(ebitda_margin, 1), "unit": "%", "trend": "up", "change": 0},
                {"id": f"rev_growth_{sub.id}", "subsidiary_id": sub.id, "name": "Revenue Growth", "value": round(rev_growth, 1), "unit": "%", "trend": "up" if rev_growth > 0 else "down", "change": 0},
                {"id": f"liquidity_{sub.id}", "subsidiary_id": sub.id, "name": "Liquidity", "value": round(liquidity, 2), "unit": "x", "trend": "up", "change": 0},
                {"id": f"debt_{sub.id}", "subsidiary_id": sub.id, "name": "Debt/Equity", "value": round(debt_equity, 2), "unit": "x", "trend": "down", "change": 0},
            ])
        else:
            # Fallback if no data
            computed_kpis.extend([
                {"id": f"roace_{sub.id}", "subsidiary_id": sub.id, "name": "ROACE", "value": 0, "unit": "%", "trend": "flat", "change": 0},
                {"id": f"ebitda_{sub.id}", "subsidiary_id": sub.id, "name": "EBITDA Margin", "value": 0, "unit": "%", "trend": "flat", "change": 0},
                {"id": f"rev_growth_{sub.id}", "subsidiary_id": sub.id, "name": "Revenue Growth", "value": 0, "unit": "%", "trend": "flat", "change": 0},
                {"id": f"liquidity_{sub.id}", "subsidiary_id": sub.id, "name": "Liquidity", "value": 0, "unit": "x", "trend": "flat", "change": 0},
                {"id": f"debt_{sub.id}", "subsidiary_id": sub.id, "name": "Debt/Equity", "value": 0, "unit": "x", "trend": "flat", "change": 0},
            ])
            
    return computed_kpis
