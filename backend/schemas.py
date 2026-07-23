from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class HoldingCompanyBase(BaseModel):
    name: str

class HoldingCompanyCreate(HoldingCompanyBase):
    pass

class HoldingCompany(HoldingCompanyBase):
    id: str
    created_at: datetime
    owner_id: Optional[str]
    industry_type: Optional[str] = "corporate"

    class Config:
        orm_mode = True
        from_attributes = True

class UserBase(BaseModel):
    email: str
    name: str
    role: str
    avatar: Optional[str] = None
    holding_company_id: Optional[str] = None

class UserCreate(UserBase):
    password: str
    company_name: Optional[str] = None
    industry_type: Optional[str] = "corporate"

class UserLogin(BaseModel):
    email: str
    password: str

class User(UserBase):
    id: str
    holding_company_name: Optional[str] = None
    industry_type: Optional[str] = "corporate"

    class Config:
        orm_mode = True
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class SubsidiaryBase(BaseModel):
    name: str
    industry: str
    country: str
    currency: str
    description: Optional[str] = None

class SubsidiaryCreate(SubsidiaryBase):
    pass

class Subsidiary(SubsidiaryBase):
    id: str
    created_at: datetime
    holding_company_id: str

    class Config:
        orm_mode = True
        from_attributes = True

class FinancialReportBase(BaseModel):
    report_type: str
    reporting_period: str
    file_name: str

class FinancialReportCreate(FinancialReportBase):
    pass

class FinancialReport(FinancialReportBase):
    id: str
    subsidiary_id: str
    uploaded_at: datetime
    status: str

    class Config:
        orm_mode = True
        from_attributes = True

class SubsidiaryTokenBase(BaseModel):
    subsidiary_id: str

class SubsidiaryToken(SubsidiaryTokenBase):
    id: str
    token: str
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True

class NormalizedDataBase(BaseModel):
    date: datetime
    total_inflow: float
    total_outflow: float
    net_surplus: float
    cash_reserve: float
    primary_kpi: Optional[float] = None
    secondary_kpi: Optional[float] = None

class NormalizedData(NormalizedDataBase):
    id: str
    subsidiary_id: str

    class Config:
        orm_mode = True
        from_attributes = True

class KPIBase(BaseModel):
    name: str
    value: float
    unit: str
    trend: str
    change: float

class KPI(KPIBase):
    id: str
    holding_company_id: str

    class Config:
        orm_mode = True
        from_attributes = True

class AIInsightBase(BaseModel):
    type: str
    severity: str
    title: str
    description: str

class AIInsight(AIInsightBase):
    id: str
    subsidiary_id: str
    subsidiary_name: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class CapitalRecommendationBase(BaseModel):
    type: str
    title: str
    description: str
    amount: Optional[float] = None
    currency: Optional[str] = None
    from_subsidiary: Optional[str] = None
    to_subsidiary: Optional[str] = None
    priority: str
    status: str
    assigned_to: Optional[str] = None
    notes: Optional[str] = None

class CapitalRecommendation(CapitalRecommendationBase):
    id: str
    holding_company_id: str
    created_at: datetime
    decided_at: Optional[datetime] = None
    decided_by: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True

class ScenarioBase(BaseModel):
    name: str
    description: Optional[str] = None
    parameters: str

class ScenarioCreate(ScenarioBase):
    pass

class Scenario(ScenarioBase):
    id: str
    holding_company_id: str
    results: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class NormalizedDataSubmitRow(BaseModel):
    date: str
    total_inflow: float = 0
    total_outflow: float = 0
    net_surplus: float = 0
    cash_reserve: float = 0
    primary_kpi: Optional[float] = None
    secondary_kpi: Optional[float] = None

class NormalizedDataSubmit(BaseModel):
    subsidiary_id: str
    report_type: str
    reporting_period: str
    rows: List[NormalizedDataSubmitRow]

class APIKeyBase(BaseModel):
    name: str

class APIKeyCreate(APIKeyBase):
    pass

class APIKeyResponse(APIKeyBase):
    id: str
    prefix: str
    created_at: datetime
    last_used_at: Optional[datetime] = None
    is_active: bool

    class Config:
        orm_mode = True
        from_attributes = True

class APIKeyWithSecret(APIKeyResponse):
    key: str # Only returned once upon creation

class AsyncJobResponse(BaseModel):
    id: str
    job_type: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True

class AnalyzePayloadItem(BaseModel):
    unit_id: str
    unit_name: str
    date: str
    total_inflow: float
    total_outflow: float
    cash_reserve: float
    primary_kpi: Optional[float] = None
    secondary_kpi: Optional[float] = None

class AnalyzePayload(BaseModel):
    webhook_url: Optional[str] = None
    data: List[AnalyzePayloadItem]

class AnalyzeRequest(BaseModel):
    webhook_url: Optional[HttpUrl] = None
    data: List[Dict[str, Any]]

class ForecastRequest(BaseModel):
    webhook_url: Optional[HttpUrl] = None
    data: List[Dict[str, Any]]
    forecast_periods: int = Field(default=3, description="Number of periods to forecast into the future")
    metric: str = Field(default="revenue", description="The key metric to forecast (e.g., revenue, net_surplus)")

class VarianceRequest(BaseModel):
    webhook_url: Optional[HttpUrl] = None
    actuals: List[Dict[str, Any]] = Field(description="Array of actual financial data")
    budgets: List[Dict[str, Any]] = Field(description="Array of budgeted financial data to compare against")
    metric: str = Field(default="revenue", description="The key metric to analyze for variance")

class ScenarioParameter(BaseModel):
    metric: str
    change_pct: float = Field(description="Percentage change, e.g., 10.5 for a 10.5% increase, -5.0 for a 5% decrease")

class ScenarioModelingRequest(BaseModel):
    webhook_url: Optional[HttpUrl] = None
    baseline: Dict[str, float] = Field(description="Current baseline financials, e.g., {'revenue': 100000, 'cogs': 40000, 'opex': 30000}")
    parameters: List[ScenarioParameter] = Field(description="What-if adjustments to apply to the baseline")

class UnitCapitalRequest(BaseModel):
    unit_id: str
    unit_name: str
    cash_reserve: float
    roi_pct: float
    risk_score: float = Field(description="1-10 scale where 10 is highest risk")
    requested_capital: float

class CapitalAllocationRequest(BaseModel):
    webhook_url: Optional[HttpUrl] = None
    total_available_capital: float
    units: List[UnitCapitalRequest]

class ExecutiveSummaryRequest(BaseModel):
    webhook_url: Optional[HttpUrl] = None
    timeframe: str = Field(default="Q3 2026", description="The period this summary covers")
    insights: List[Dict[str, Any]] = Field(description="Array of all insights generated by the other endpoints over this timeframe")

class CustomerRecord(BaseModel):
    customer_id: str
    tenure_months: int
    last_active_days_ago: int
    historical_spend: float
    usage_score: float = Field(description="1-10 scale where 10 is very high usage")

class PredictiveChurnRequest(BaseModel):
    webhook_url: Optional[HttpUrl] = None
    customers: List[CustomerRecord] = Field(description="Array of customer data for churn prediction")

class DataPoint(BaseModel):
    entity_id: str
    features: List[float] = Field(description="Array of numerical features for this entity")

class ClusterAnalysisRequest(BaseModel):
    webhook_url: Optional[HttpUrl] = None
    target_clusters: int = Field(default=3, description="Number of clusters to group the data into")
    data_points: List[DataPoint] = Field(description="Array of data points with features to be clustered")

class NormalizeRequest(BaseModel):
    webhook_url: Optional[HttpUrl] = None
    raw_data: List[Dict[str, Any]] = Field(description="Array of messy, unstructured data records to normalize")
