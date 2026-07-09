# HoldCo AI

**HoldCo AI** is a comprehensive, multi-tenant portfolio management and data consolidation platform built for modern holding companies. 

By automating the ingestion of subsidiary financial reports and leveraging artificial intelligence, HoldCo AI standardizes charts of accounts, identifies intercompany transactions, and uncovers actionable insights—empowering executives to make data-driven capital allocation decisions.

---

## 🎯 Who is this for?

This solution is designed specifically for **Holding Companies, Private Equity Firms, and Conglomerates** that manage multiple subsidiaries operating across different geographies and industries. 

Key user personas include:
- **MDs & CEOs**: Need a unified, bird's-eye view of portfolio performance, FX risk exposure, and automated capital allocation recommendations.
- **Financial Analysts**: Need tools to run scenario modeling, normalize disparate financial data, and drill down into specific subsidiary KPIs.
- **IT Administrators**: Need a secure, multi-tenant environment with strict Role-Based Access Control (RBAC) to provision workspaces and manage cross-company data access.

---

## 🚀 Key Features

- **Multi-Tenant Architecture**: A single deployed instance securely partitions data by Holding Company, ensuring privacy and compliance.
- **Automated Consolidation**: Standardizes varying Charts of Accounts (CoA) from different subsidiaries into a unified holding company base currency.
- **AI-Driven Insights**: Automatically flags anomalies, risks, and growth opportunities based on ingested financial data.
- **Capital Allocation Engine**: Recommends internal loans, dividend distributions, or cost reduction strategies based on cross-portfolio liquidity.
- **Scenario Modeling**: Test "what-if" macroeconomic scenarios (e.g., FX fluctuations or interest rate hikes) against the consolidated portfolio.

---

## 🛠️ Tech Stack

HoldCo AI is a modern, full-stack application:

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Radix UI (Shadcn components).
- **Backend**: Python, FastAPI, SQLAlchemy ORM, SQLite/PostgreSQL.
- **Authentication**: Custom open-source JWT implementation using `python-jose` and `passlib`.

---

## 📖 How to Use It

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### 1. Start the Backend (FastAPI)
The backend is located in the `backend/` directory.

```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
# source venv/bin/activate

pip install fastapi "uvicorn[standard]" sqlalchemy python-jose passlib bcrypt python-multipart

# Start the server (runs on http://localhost:8000)
uvicorn main:app --reload
```

### 2. Start the Frontend (Vite/React)
In a new terminal window, navigate to the root directory.

```bash
npm install
npm run dev
```
The frontend will start on `http://localhost:8080/`.

### 3. Set Up Your Workspace
1. Navigate to `http://localhost:8080/signup`.
2. Enter your Holding Company Name and credentials to **Create a workspace as IT Admin**.
3. You will be automatically logged into the Dashboard. From here, you can begin adding subsidiaries and navigating the platform.

---

## 🗺️ What Next to Build?

To transform HoldCo AI from a robust foundation into an enterprise-grade product, the following implementations should be prioritized next:

1. **Complete Frontend API Integration**
   - Replace the remaining hardcoded mock data in the Dashboard, Subsidiaries, Insights, KPIs, and Scenarios views with live fetch calls to the `/api` endpoints.

2. **AI Data Processing Pipeline**
   - Implement the background worker (using Celery or FastAPI BackgroundTasks) for the `/api/reports/upload` endpoint.
   - Parse uploaded CSV/Excel files and insert them into the `NormalizedData` table.
   - Integrate an LLM (like OpenAI or Anthropic) or a ML model to generate records in the `AIInsight` and `CapitalRecommendation` tables whenever new data is ingested.

3. **ERP Integrations**
   - Build custom connectors or integrate third-party APIs (like Codat, Merge.dev, or Plaid) to automatically pull live accounting data from Xero, NetSuite, and QuickBooks, replacing manual file uploads.

4. **Multi-Currency & FX Engine**
   - Integrate a real-time FX API (e.g., OpenExchangeRates) to dynamically convert subsidiary financials into the holding company's base currency, calculating historical FX gains/losses.

5. **Advanced Scenario Modeling Engine**
   - Build the mathematical engine behind `/api/scenarios` to run Monte Carlo simulations based on user-defined macroeconomic parameters.
