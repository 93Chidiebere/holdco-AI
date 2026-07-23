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

@router.post("/forecast", status_code=status.HTTP_202_ACCEPTED)
async def submit_forecast_job(
    request: schemas.ForecastRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    holding_company: models.HoldingCompany = Depends(get_holding_company_from_api_key)
):
    """
    Submit historical data for statistical forecasting and AI insights.
    Returns a Job ID immediately. Processing happens in the background.
    """
    # Create the job
    job = models.AsyncJob(
        holding_company_id=holding_company.id,
        job_type="forecast",
        status="pending",
        payload=json.dumps({"data": request.data, "webhook_url": str(request.webhook_url) if request.webhook_url else None}),
        webhook_url=str(request.webhook_url) if request.webhook_url else None
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Send to background
    from services.webhook_service import process_forecast_job
    background_tasks.add_task(
        process_forecast_job, 
        job.id, 
        str(request.webhook_url) if request.webhook_url else None,
        request.data,
        request.metric,
        request.forecast_periods
    )
    
    return {
        "job_id": job.id,
        "status": "accepted",
        "message": "Forecast job accepted and processing in background."
    }

@router.post("/variance-analysis", status_code=status.HTTP_202_ACCEPTED)
async def submit_variance_job(
    request: schemas.VarianceRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    holding_company: models.HoldingCompany = Depends(get_holding_company_from_api_key)
):
    """
    Submit actual and budgeted data for variance analysis and AI insights.
    Returns a Job ID immediately. Processing happens in the background.
    """
    job = models.AsyncJob(
        holding_company_id=holding_company.id,
        job_type="variance_analysis",
        status="pending",
        payload=json.dumps({
            "actuals": request.actuals, 
            "budgets": request.budgets,
            "webhook_url": str(request.webhook_url) if request.webhook_url else None
        }),
        webhook_url=str(request.webhook_url) if request.webhook_url else None
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    from services.webhook_service import process_variance_job
    background_tasks.add_task(
        process_variance_job, 
        job.id, 
        str(request.webhook_url) if request.webhook_url else None,
        request.actuals,
        request.budgets,
        request.metric
    )
    
    return {
        "job_id": job.id,
        "status": "accepted",
        "message": "Variance analysis job accepted and processing in background."
    }

@router.post("/scenario-modeling", status_code=status.HTTP_202_ACCEPTED)
async def submit_scenario_job(
    request: schemas.ScenarioModelingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    holding_company: models.HoldingCompany = Depends(get_holding_company_from_api_key)
):
    """
    Submit a baseline state and parameters for what-if scenario modeling and AI insights.
    Returns a Job ID immediately. Processing happens in the background.
    """
    # Convert Pydantic objects to dict for json serialization
    params_dict = [p.dict() for p in request.parameters]
    
    job = models.AsyncJob(
        holding_company_id=holding_company.id,
        job_type="scenario_modeling",
        status="pending",
        payload=json.dumps({
            "baseline": request.baseline, 
            "parameters": params_dict,
            "webhook_url": str(request.webhook_url) if request.webhook_url else None
        }),
        webhook_url=str(request.webhook_url) if request.webhook_url else None
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    from services.webhook_service import process_scenario_job
    background_tasks.add_task(
        process_scenario_job, 
        job.id, 
        str(request.webhook_url) if request.webhook_url else None,
        request.baseline,
        params_dict
    )
    
    return {
        "job_id": job.id,
        "status": "accepted",
        "message": "Scenario modeling job accepted and processing in background."
    }

@router.post("/capital-allocation", status_code=status.HTTP_202_ACCEPTED)
async def submit_capital_job(
    request: schemas.CapitalAllocationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    holding_company: models.HoldingCompany = Depends(get_holding_company_from_api_key)
):
    """
    Submit capital reserves and unit ROI/Risk for optimal capital allocation.
    Returns a Job ID immediately. Processing happens in the background.
    """
    units_dict = [u.dict() for u in request.units]
    
    job = models.AsyncJob(
        holding_company_id=holding_company.id,
        job_type="capital_allocation",
        status="pending",
        payload=json.dumps({
            "total_available_capital": request.total_available_capital, 
            "units": units_dict,
            "webhook_url": str(request.webhook_url) if request.webhook_url else None
        }),
        webhook_url=str(request.webhook_url) if request.webhook_url else None
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    from services.webhook_service import process_capital_job
    background_tasks.add_task(
        process_capital_job, 
        job.id, 
        str(request.webhook_url) if request.webhook_url else None,
        request.total_available_capital,
        units_dict
    )
    
    return {
        "job_id": job.id,
        "status": "accepted",
        "message": "Capital allocation job accepted and processing in background."
    }

@router.post("/executive-summary", status_code=status.HTTP_202_ACCEPTED)
async def submit_executive_summary_job(
    request: schemas.ExecutiveSummaryRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    holding_company: models.HoldingCompany = Depends(get_holding_company_from_api_key)
):
    """
    Submit a batch of raw insights generated over a quarter to synthesize a board-level executive memo.
    Returns a Job ID immediately. Processing happens in the background.
    """
    job = models.AsyncJob(
        holding_company_id=holding_company.id,
        job_type="executive_summary",
        status="pending",
        payload=json.dumps({
            "timeframe": request.timeframe, 
            "insights": request.insights,
            "webhook_url": str(request.webhook_url) if request.webhook_url else None
        }),
        webhook_url=str(request.webhook_url) if request.webhook_url else None
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    from services.webhook_service import process_executive_summary_job
    background_tasks.add_task(
        process_executive_summary_job, 
        job.id, 
        str(request.webhook_url) if request.webhook_url else None,
        request.timeframe,
        request.insights
    )
    
    return {
        "job_id": job.id,
        "status": "accepted",
        "message": "Executive summary synthesis job accepted and processing in background."
    }

@router.post("/predictive-churn", status_code=status.HTTP_202_ACCEPTED)
async def submit_churn_job(
    request: schemas.PredictiveChurnRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    holding_company: models.HoldingCompany = Depends(get_holding_company_from_api_key)
):
    """
    Submit customer data for churn risk prediction and retention strategy generation.
    Returns a Job ID immediately. Processing happens in the background.
    """
    customers_dict = [c.dict() for c in request.customers]
    
    job = models.AsyncJob(
        holding_company_id=holding_company.id,
        job_type="predictive_churn",
        status="pending",
        payload=json.dumps({
            "customers": customers_dict,
            "webhook_url": str(request.webhook_url) if request.webhook_url else None
        }),
        webhook_url=str(request.webhook_url) if request.webhook_url else None
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    from services.webhook_service import process_churn_job
    background_tasks.add_task(
        process_churn_job, 
        job.id, 
        str(request.webhook_url) if request.webhook_url else None,
        customers_dict
    )
    
    return {
        "job_id": job.id,
        "status": "accepted",
        "message": "Predictive churn job accepted and processing in background."
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

@router.get("/jobs", response_model=list[schemas.AsyncJobResponse])
def list_jobs(
    db: Session = Depends(get_db),
    company: models.HoldingCompany = Depends(get_holding_company_from_api_key),
    limit: int = 50
):
    """
    Fetch the latest async jobs (webhook logs).
    """
    db_jobs = db.query(models.AsyncJob).filter(
        models.AsyncJob.holding_company_id == company.id
    ).order_by(models.AsyncJob.created_at.desc()).limit(limit).all()
    
    response_list = []
    for job in db_jobs:
        job_data = {
            "id": job.id,
            "job_type": job.job_type,
            "status": job.status,
            "created_at": job.created_at,
            "completed_at": job.completed_at,
            "error": job.error
        }
        if job.result:
            try:
                job_data["result"] = json.loads(job.result)
            except:
                job_data["result"] = {"raw": job.result}
        response_list.append(job_data)
        
    return response_list

