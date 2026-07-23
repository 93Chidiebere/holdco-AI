import requests
import json
import time
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from services.analysis_engine import detect_anomalies
from services.llm_orchestrator import generate_insights_from_anomalies
from datetime import datetime
from typing import List, Dict, Any

MAX_RETRIES = 3
RETRY_DELAY = 5 # seconds

def process_analysis_job(job_id: str):
    """
    Background task to process the anomaly detection job.
    Uses its own DB session since it runs async.
    """
    db: Session = SessionLocal()
    try:
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if not job:
            return
            
        job.status = "processing"
        db.commit()
        
        try:
            payload = json.loads(job.payload)
            data = payload.get("data", [])
            webhook_url = payload.get("webhook_url")
            
            # 1. Deterministic Math
            anomalies = detect_anomalies(data)
            
            # 2. LLM Orchestration
            insights = []
            if anomalies:
                insights = generate_insights_from_anomalies(anomalies)
                
            # Combine Results
            result_data = {
                "anomalies_detected": len(anomalies),
                "anomalies": anomalies,
                "insights": insights
            }
            
            job.result = json.dumps(result_data)
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            db.commit()
            
            # 3. Deliver via Webhook if provided
            if webhook_url:
                deliver_webhook(webhook_url, job_id, "completed", result_data, job, db)
                
        except Exception as e:
            job.status = "failed"
            job.error = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()
            
            if job.webhook_url:
                deliver_webhook(job.webhook_url, job_id, "failed", {"error": str(e)}, job, db)
                
    finally:
        db.close()

def process_forecast_job(job_id: str, webhook_url: str | None, payload_data: List[Dict[str, Any]], metric: str, periods: int):
    """
    Background worker that runs statistical forecast and LLM interpretation.
    """
    db: Session = SessionLocal()
    try:
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if not job:
            return
            
        job.status = "processing"
        db.commit()
        
        # 1. Run Math Engine (Pandas Polyfit)
        from services.analysis_engine import generate_forecast
        forecast_output = generate_forecast(payload_data, metric, periods)
        
        # 2. Run LLM Engine (Gemini)
        from services.llm_orchestrator import generate_forecast_insights
        final_insights = generate_forecast_insights(forecast_output)
        
        # 3. Save Results
        job.result = json.dumps(final_insights)
        job.status = "completed"
        db.commit()
        
        # 4. Deliver Webhook
        if webhook_url:
            deliver_webhook(webhook_url, job_id, "completed", final_insights, job, db)
            
    except Exception as e:
        print(f"Error in process_forecast_job: {e}")
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error = str(e)
            db.commit()
            if webhook_url:
                deliver_webhook(webhook_url, job_id, "failed", {"error": str(e)}, job, db)
    finally:
        db.close()

def process_variance_job(job_id: str, webhook_url: str | None, actuals: List[Dict[str, Any]], budgets: List[Dict[str, Any]], metric: str):
    """
    Background worker that runs variance analysis and LLM interpretation.
    """
    db: Session = SessionLocal()
    try:
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if not job:
            return
            
        job.status = "processing"
        db.commit()
        
        # 1. Run Math Engine
        from services.analysis_engine import calculate_variance
        variance_output = calculate_variance(actuals, budgets, metric)
        
        # 2. Run LLM Engine (Gemini)
        from services.llm_orchestrator import generate_variance_insights
        final_insights = generate_variance_insights(variance_output)
        
        # 3. Save Results
        job.result = json.dumps(final_insights)
        job.status = "completed"
        db.commit()
        
        # 4. Deliver Webhook
        if webhook_url:
            deliver_webhook(webhook_url, job_id, "completed", final_insights, job, db)
            
    except Exception as e:
        print(f"Error in process_variance_job: {e}")
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error = str(e)
            db.commit()
            if webhook_url:
                deliver_webhook(webhook_url, job_id, "failed", {"error": str(e)}, job, db)
    finally:
        db.close()

def process_scenario_job(job_id: str, webhook_url: str | None, baseline: Dict[str, float], parameters: List[Dict[str, Any]]):
    """
    Background worker that runs scenario modeling math and LLM interpretation.
    """
    db: Session = SessionLocal()
    try:
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if not job:
            return
            
        job.status = "processing"
        db.commit()
        
        # 1. Run Math Engine
        from services.analysis_engine import simulate_scenario
        scenario_output = simulate_scenario(baseline, parameters)
        
        # 2. Run LLM Engine (Gemini)
        from services.llm_orchestrator import generate_scenario_insights
        final_insights = generate_scenario_insights(scenario_output)
        
        # 3. Save Results
        job.result = json.dumps(final_insights)
        job.status = "completed"
        db.commit()
        
        # 4. Deliver Webhook
        if webhook_url:
            deliver_webhook(webhook_url, job_id, "completed", final_insights, job, db)
            
    except Exception as e:
        print(f"Error in process_scenario_job: {e}")
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error = str(e)
            db.commit()
            if webhook_url:
                deliver_webhook(webhook_url, job_id, "failed", {"error": str(e)}, job, db)
    finally:
        db.close()

def process_capital_job(job_id: str, webhook_url: str | None, total_available: float, units: List[Dict[str, Any]]):
    """
    Background worker that runs capital allocation optimization and LLM generation.
    """
    db: Session = SessionLocal()
    try:
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if not job:
            return
            
        job.status = "processing"
        db.commit()
        
        # 1. Run Math Engine
        from services.analysis_engine import optimize_capital_allocation
        allocation_output = optimize_capital_allocation(total_available, units)
        
        # 2. Run LLM Engine (Gemini)
        from services.llm_orchestrator import generate_capital_insights
        final_insights = generate_capital_insights(allocation_output)
        
        # 3. Save Results
        job.result = json.dumps(final_insights)
        job.status = "completed"
        db.commit()
        
        # 4. Deliver Webhook
        if webhook_url:
            deliver_webhook(webhook_url, job_id, "completed", final_insights, job, db)
            
    except Exception as e:
        print(f"Error in process_capital_job: {e}")
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error = str(e)
            db.commit()
            if webhook_url:
                deliver_webhook(webhook_url, job_id, "failed", {"error": str(e)}, job, db)
    finally:
        db.close()

def process_executive_summary_job(job_id: str, webhook_url: str | None, timeframe: str, insights: List[Dict[str, Any]]):
    """
    Background worker that runs the LLM executive synthesis.
    """
    db: Session = SessionLocal()
    try:
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if not job:
            return
            
        job.status = "processing"
        db.commit()
        
        # 1. Run LLM Engine (Gemini)
        from services.llm_orchestrator import generate_executive_summary
        final_insights = generate_executive_summary(timeframe, insights)
        
        # 2. Save Results
        job.result = json.dumps(final_insights)
        job.status = "completed"
        db.commit()
        
        # 3. Deliver Webhook
        if webhook_url:
            deliver_webhook(webhook_url, job_id, "completed", final_insights, job, db)
            
    except Exception as e:
        print(f"Error in process_executive_summary_job: {e}")
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error = str(e)
            db.commit()
            if webhook_url:
                deliver_webhook(webhook_url, job_id, "failed", {"error": str(e)}, job, db)
    finally:
        db.close()

def process_churn_job(job_id: str, webhook_url: str | None, customers: List[Dict[str, Any]]):
    """
    Background worker that runs churn prediction math and LLM strategy generation.
    """
    db: Session = SessionLocal()
    try:
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if not job:
            return
            
        job.status = "processing"
        db.commit()
        
        # 1. Run Math Engine
        from services.analysis_engine import calculate_churn_risk
        churn_output = calculate_churn_risk(customers)
        
        # 2. Run LLM Engine (Gemini)
        from services.llm_orchestrator import generate_churn_insights
        final_insights = generate_churn_insights(churn_output)
        
        # 3. Save Results
        job.result = json.dumps(final_insights)
        job.status = "completed"
        db.commit()
        
        # 4. Deliver Webhook
        if webhook_url:
            deliver_webhook(webhook_url, job_id, "completed", final_insights, job, db)
            
    except Exception as e:
        print(f"Error in process_churn_job: {e}")
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error = str(e)
            db.commit()
            if webhook_url:
                deliver_webhook(webhook_url, job_id, "failed", {"error": str(e)}, job, db)
    finally:
        db.close()

def process_cluster_job(job_id: str, webhook_url: str | None, data_points: List[Dict[str, Any]], target_clusters: int):
    """
    Background worker that runs clustering math and LLM persona generation.
    """
    db: Session = SessionLocal()
    try:
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if not job:
            return
            
        job.status = "processing"
        db.commit()
        
        # 1. Run Math Engine
        from services.analysis_engine import perform_clustering
        cluster_output = perform_clustering(data_points, target_clusters)
        
        # 2. Run LLM Engine (Gemini)
        from services.llm_orchestrator import generate_cluster_insights
        final_insights = generate_cluster_insights(cluster_output)
        
        # 3. Save Results
        job.result = json.dumps(final_insights)
        job.status = "completed"
        db.commit()
        
        # 4. Deliver Webhook
        if webhook_url:
            deliver_webhook(webhook_url, job_id, "completed", final_insights, job, db)
            
    except Exception as e:
        print(f"Error in process_cluster_job: {e}")
        job = db.query(models.AsyncJob).filter(models.AsyncJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error = str(e)
            db.commit()
            if webhook_url:
                deliver_webhook(webhook_url, job_id, "failed", {"error": str(e)}, job, db)
    finally:
        db.close()

def deliver_webhook(url: str, job_id: str, status: str, data: dict, job: models.AsyncJob, db: Session):
    payload = {
        "job_id": job_id,
        "status": status,
        "data": data
    }
    
    headers = {"Content-Type": "application/json"}
    
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code in (200, 201, 202, 204):
                # Success
                break
            else:
                # Log failure
                print(f"Webhook delivery failed with status {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"Webhook request exception: {e}")
            
        job.retry_count = attempt
        db.commit()
        
        if attempt < MAX_RETRIES:
            time.sleep(RETRY_DELAY)
