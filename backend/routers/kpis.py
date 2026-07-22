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
            
            # Compute Surplus Margin (Net Surplus / Total Inflow)
            surplus_margin = 0
            if latest.total_inflow and latest.total_inflow > 0:
                surplus_margin = (latest.net_surplus or 0) / latest.total_inflow * 100
                
            # Compute Operating Efficiency (Total Outflow / Total Inflow)
            operating_efficiency = 0
            if latest.total_inflow and latest.total_inflow > 0:
                operating_efficiency = (latest.total_outflow or 0) / latest.total_inflow * 100
                
            # Inflow Growth
            inflow_growth = 0
            if len(data) == 2:
                prev = data[1]
                if prev.total_inflow and prev.total_inflow > 0:
                    inflow_growth = ((latest.total_inflow or 0) - prev.total_inflow) / prev.total_inflow * 100
                    
            # Cash Runway (Cash Reserve / Monthly Outflow)
            cash_runway = 0
            if latest.total_outflow and latest.total_outflow > 0:
                cash_runway = (latest.cash_reserve or 0) / latest.total_outflow
                
            computed_kpis.extend([
                {"id": f"surplus_{sub.id}", "subsidiary_id": sub.id, "name": "Surplus Margin", "value": round(surplus_margin, 1), "unit": "%", "trend": "up" if surplus_margin > 0 else "down", "change": 0},
                {"id": f"efficiency_{sub.id}", "subsidiary_id": sub.id, "name": "Operating Efficiency", "value": round(operating_efficiency, 1), "unit": "%", "trend": "up" if operating_efficiency < 80 else "down", "change": 0},
                {"id": f"growth_{sub.id}", "subsidiary_id": sub.id, "name": "Inflow Growth", "value": round(inflow_growth, 1), "unit": "%", "trend": "up" if inflow_growth > 0 else "down", "change": 0},
                {"id": f"runway_{sub.id}", "subsidiary_id": sub.id, "name": "Cash Runway", "value": round(cash_runway, 1), "unit": "mo", "trend": "up" if cash_runway > 3 else "down", "change": 0},
            ])
        else:
            # Fallback if no data
            computed_kpis.extend([
                {"id": f"surplus_{sub.id}", "subsidiary_id": sub.id, "name": "Surplus Margin", "value": 0, "unit": "%", "trend": "flat", "change": 0},
                {"id": f"efficiency_{sub.id}", "subsidiary_id": sub.id, "name": "Operating Efficiency", "value": 0, "unit": "%", "trend": "flat", "change": 0},
                {"id": f"growth_{sub.id}", "subsidiary_id": sub.id, "name": "Inflow Growth", "value": 0, "unit": "%", "trend": "flat", "change": 0},
                {"id": f"runway_{sub.id}", "subsidiary_id": sub.id, "name": "Cash Runway", "value": 0, "unit": "mo", "trend": "flat", "change": 0},
            ])
            
    return computed_kpis
