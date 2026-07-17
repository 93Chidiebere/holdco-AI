from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import auth, subsidiaries, kpis, scenarios, reports, insights, recommendations, seed, portal, dashboard

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="HoldCo AI Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only, restrict in production
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

@app.get("/")
def read_root():
    return {"message": "Welcome to HoldCo AI API"}
