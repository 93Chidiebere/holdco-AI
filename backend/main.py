from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import auth, subsidiaries, kpis, scenarios, reports, insights, recommendations, seed, portal, dashboard, system, api_keys, api_v1

from sqlalchemy import text

models.Base.metadata.create_all(bind=engine)

# Quick auto-migrations for newly added columns during pivot
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE holding_companies ADD COLUMN currency VARCHAR DEFAULT 'NGN'"))
        conn.commit()
except Exception:
    pass

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE holding_companies ADD COLUMN industry_type VARCHAR DEFAULT 'corporate'"))
        conn.commit()
except Exception:
    pass

app = FastAPI(title="HoldCo AI Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:8080", 
        "https://holdcoai.online", 
        "https://www.holdcoai.online"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(subsidiaries.router)
app.include_router(kpis.router)
app.include_router(scenarios.router)
app.include_router(reports.router)
app.include_router(insights.router)
app.include_router(recommendations.router)
app.include_router(seed.router)
app.include_router(portal.router)
app.include_router(dashboard.router)
app.include_router(system.router)
app.include_router(api_keys.router)
app.include_router(api_v1.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to HoldCo AI API"}
