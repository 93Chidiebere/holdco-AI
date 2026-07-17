from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

import models, auth, database

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("/alerts")
def get_alerts(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if not current_user.holding_company_id:
        return []
    
    # We derive alerts from high/critical AI insights
    subsidiaries = db.query(models.Subsidiary).filter(models.Subsidiary.holding_company_id == current_user.holding_company_id).all()
    sub_ids = [s.id for s in subsidiaries]
    
    if not sub_ids:
        return []
        
    insights = db.query(models.AIInsight).filter(
        models.AIInsight.subsidiary_id.in_(sub_ids),
        models.AIInsight.severity.in_(["high", "critical"])
    ).order_by(models.AIInsight.created_at.desc()).all()
    
    alerts = []
    for insight in insights:
        alerts.append({
            "id": insight.id,
            "type": "critical" if insight.severity == "critical" else "warning",
            "title": insight.title,
            "description": insight.description,
            "subsidiary": insight.subsidiary.name if insight.subsidiary else "Unknown",
            "timestamp": insight.created_at.isoformat(),
            "read": False
        })
        
    return alerts

@router.get("/audit-logs")
def get_audit_logs(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Since we don't have an Audit Log table yet, we return an empty array
    # to replace the mock data. When Audit Logs are implemented, query them here.
    return []
