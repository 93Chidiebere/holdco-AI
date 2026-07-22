from pydantic import BaseModel
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

