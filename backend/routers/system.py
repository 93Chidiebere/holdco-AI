from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

import models, auth, database

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("/alerts")
def get_alerts(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if not current_user.holding_company_id:
        return []
    
    subsidiaries = db.query(models.Subsidiary).filter(models.Subsidiary.holding_company_id == current_user.holding_company_id).all()
    
    # Real-world dynamic alert logic based on NormalizedData
    alerts = []
    
    # 1. Look for anomalies in the most recent data
    for sub in subsidiaries:
        # Get data ordered by date
        data_records = db.query(models.NormalizedData).filter(
            models.NormalizedData.subsidiary_id == sub.id
        ).order_by(models.NormalizedData.date.desc()).limit(2).all()
        
        if len(data_records) >= 1:
            latest = data_records[0]
            
            # Check 1: Negative Net Income
            if latest.net_income and latest.net_income < 0:
                alerts.append({
                    "id": f"alert_loss_{sub.id}_{latest.id}",
                    "type": "critical",
                    "title": f"Operating Loss Detected in {sub.name}",
                    "description": f"The subsidiary reported a net loss of {latest.net_income:,.2f} in the latest period. Immediate cost review recommended.",
                    "subsidiary": sub.name,
                    "timestamp": latest.date.isoformat(),
                    "read": False
                })
                
            # Check 2: High Leverage (Debt to Equity)
            # We don't have explicit debt, but if Total Equity < 20% of Total Assets, it's highly leveraged
            if latest.total_assets and latest.total_equity:
                if latest.total_equity < (latest.total_assets * 0.2):
                    alerts.append({
                        "id": f"alert_leverage_{sub.id}_{latest.id}",
                        "type": "warning",
                        "title": f"High Leverage Risk in {sub.name}",
                        "description": f"Total Equity has fallen below 20% of Total Assets, indicating high debt exposure.",
                        "subsidiary": sub.name,
                        "timestamp": latest.date.isoformat(),
                        "read": False
                    })
            
            # Check 3: Month-over-Month Revenue Drop
            if len(data_records) == 2:
                previous = data_records[1]
                if previous.gross_revenue and previous.gross_revenue > 0:
                    change = (latest.gross_revenue - previous.gross_revenue) / previous.gross_revenue
                    if change < -0.15: # 15% drop
                        alerts.append({
                            "id": f"alert_revdrop_{sub.id}_{latest.id}",
                            "type": "critical",
                            "title": f"Severe Revenue Drop in {sub.name}",
                            "description": f"Gross revenue dropped by {abs(change)*100:.1f}% compared to the previous period.",
                            "subsidiary": sub.name,
                            "timestamp": latest.date.isoformat(),
                            "read": False
                        })
                        
    # Sort alerts by newest first
    alerts.sort(key=lambda x: x["timestamp"], reverse=True)
    return alerts

@router.get("/audit-logs")
def get_audit_logs(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Since we don't have an Audit Log table yet, we return an empty array
    # to replace the mock data. When Audit Logs are implemented, query them here.
    return []
