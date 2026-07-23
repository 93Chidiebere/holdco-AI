from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.api_security import get_holding_company_from_api_key
from services.webhook_service import process_analysis_job
import json

router = APIRouter(prefix="/api/v1", tags=["API v1"])

@router.post("/analyze", status_code=status.HTTP_202_ACCEPTED)
def submit_analysis_job(
    payload: schemas.AnalyzePayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    company: models.HoldingCompany = Depends(get_holding_company_from_api_key)
):
    """
    Submit unit financial data for asynchronous Anomaly & Insight Detection.
    Returns a Job ID immediately. Results will be delivered to the webhook_url.
    """
    job_payload = {
        "webhook_url": payload.webhook_url,
        "data": [item.dict() for item in payload.data]
    }
    
    db_job = models.AsyncJob(
        holding_company_id=company.id,
        job_type="anomaly_detection",
        status="pending",
        payload=json.dumps(job_payload),
        webhook_url=payload.webhook_url
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    # Enqueue background task
    background_tasks.add_task(process_analysis_job, str(db_job.id))
    
    return {
        "job_id": db_job.id,
        "status": db_job.status,
        "message": "Job accepted and is processing in the background."
    }

@router.get("/jobs/{job_id}", response_model=schemas.AsyncJobResponse)
def get_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    company: models.HoldingCompany = Depends(get_holding_company_from_api_key)
):
    """
    Poll for job status.
    """
    db_job = db.query(models.AsyncJob).filter(
        models.AsyncJob.id == job_id,
        models.AsyncJob.holding_company_id == company.id
    ).first()
    
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    response_data = {
        "id": db_job.id,
        "job_type": db_job.job_type,
        "status": db_job.status,
        "created_at": db_job.created_at,
        "completed_at": db_job.completed_at,
        "error": db_job.error
    }
    
    if db_job.result:
        try:
            response_data["result"] = json.loads(db_job.result)
        except:
            response_data["result"] = {"raw": db_job.result}
            
    return response_data
