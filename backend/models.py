from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class RoleEnum(str, enum.Enum):
    superadmin = "superadmin"
    admin = "admin"
    analyst = "analyst"
    viewer = "viewer"

class HoldingCompany(Base):
    __tablename__ = "holding_companies"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(String) # UUID of User

    users = relationship("User", back_populates="holding_company")
    subsidiaries = relationship("Subsidiary", back_populates="holding_company")
    recommendations = relationship("CapitalRecommendation", back_populates="holding_company")

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    role = Column(String, default=RoleEnum.admin.value)
    avatar = Column(String, nullable=True)
    holding_company_id = Column(String, ForeignKey("holding_companies.id"), nullable=True)
    
    holding_company = relationship("HoldingCompany", back_populates="users", foreign_keys=[holding_company_id])

class Subsidiary(Base):
    __tablename__ = "subsidiaries"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True)
    industry = Column(String)
    country = Column(String)
    currency = Column(String)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    holding_company_id = Column(String, ForeignKey("holding_companies.id"))
    
    holding_company = relationship("HoldingCompany", back_populates="subsidiaries")
    reports = relationship("FinancialReport", back_populates="subsidiary")
    normalized_data = relationship("NormalizedData", back_populates="subsidiary")
    insights = relationship("AIInsight", back_populates="subsidiary")

class FinancialReport(Base):
    __tablename__ = "financial_reports"
    id = Column(String, primary_key=True, default=generate_uuid)
    subsidiary_id = Column(String, ForeignKey("subsidiaries.id"))
    report_type = Column(String) # income_statement, balance_sheet, etc.
    reporting_period = Column(String) # monthly, quarterly, yearly
    file_name = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending") # pending, mapped, normalized, error
    
    subsidiary = relationship("Subsidiary", back_populates="reports")

class NormalizedData(Base):
    __tablename__ = "normalized_data"
    id = Column(String, primary_key=True, default=generate_uuid)
    subsidiary_id = Column(String, ForeignKey("subsidiaries.id"))
    date = Column(DateTime)
    revenue = Column(Float, default=0)
    expenses = Column(Float, default=0)
    net_income = Column(Float, default=0)
    cash = Column(Float, default=0)
    debt = Column(Float, default=0)
    assets = Column(Float, default=0)
    liabilities = Column(Float, default=0)
    equity = Column(Float, default=0)
    operating_costs = Column(Float, default=0)
    
    subsidiary = relationship("Subsidiary", back_populates="normalized_data")

class KPI(Base):
    __tablename__ = "kpis"
    id = Column(String, primary_key=True, default=generate_uuid)
    holding_company_id = Column(String, ForeignKey("holding_companies.id"))
    name = Column(String)
    value = Column(Float)
    unit = Column(String)
    trend = Column(String) # up, down, flat
    change = Column(Float)

class AIInsight(Base):
    __tablename__ = "ai_insights"
    id = Column(String, primary_key=True, default=generate_uuid)
    type = Column(String) # anomaly, alert, risk, etc.
    severity = Column(String) # low, medium, high, critical
    title = Column(String)
    description = Column(Text)
    subsidiary_id = Column(String, ForeignKey("subsidiaries.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    subsidiary = relationship("Subsidiary", back_populates="insights")

class CapitalRecommendation(Base):
    __tablename__ = "capital_recommendations"
    id = Column(String, primary_key=True, default=generate_uuid)
    holding_company_id = Column(String, ForeignKey("holding_companies.id"))
    type = Column(String)
    title = Column(String)
    description = Column(Text)
    amount = Column(Float, nullable=True)
    currency = Column(String, nullable=True)
    from_subsidiary = Column(String, nullable=True) # Subsidiary Name or ID
    to_subsidiary = Column(String, nullable=True)
    priority = Column(String) # low, medium, high, urgent
    status = Column(String, default="pending")
    assigned_to = Column(String, nullable=True)
    decided_at = Column(DateTime, nullable=True)
    decided_by = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    holding_company = relationship("HoldingCompany", back_populates="recommendations")

class Scenario(Base):
    __tablename__ = "scenarios"
    id = Column(String, primary_key=True, default=generate_uuid)
    holding_company_id = Column(String, ForeignKey("holding_companies.id"))
    name = Column(String)
    description = Column(Text, nullable=True)
    parameters = Column(Text) # JSON string of params
    results = Column(Text, nullable=True) # JSON string of results
    created_at = Column(DateTime, default=datetime.utcnow)
