import os
import json
import google.generativeai as genai
from typing import Dict, List, Any
import logging
from dotenv import load_dotenv

load_dotenv()

# Ensure you have your Gemini API key set in the environment variables
# e.g., os.environ["GEMINI_API_KEY"] = "your-api-key"
API_KEY = os.environ.get("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)

logger = logging.getLogger(__name__)

def generate_financial_insights(subsidiary_name: str, financial_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Takes historical financial data for a subsidiary and uses Gemini to generate insights and capital allocations.
    """
    if not API_KEY:
        logger.warning("GEMINI_API_KEY not found. Returning mock insights for development.")
        return get_mock_insights(subsidiary_name)
        
    # Prepare the prompt
    data_str = json.dumps(financial_data, indent=2)
    
    prompt = f"""
    You are an expert AI financial analyst for a massive Holding Company (like Dangote Group or Heirs Holdings).
    Your job is to analyze the monthly financial reports of a subsidiary and generate actionable strategic insights and capital allocation recommendations.
    
    Subsidiary Name: {subsidiary_name}
    
    Recent Financial Data (JSON array of months):
    {data_str}
    
    Analyze the trends in Revenue, COGS, OPEX, PBT, Net Income, Margins, and Cash Balance.
    
    Return your response strictly as a JSON object with the following structure:
    {{
      "insights": [
        {{
          "title": "Short descriptive title (e.g., Margin Compression detected)",
          "description": "Detailed 2-sentence explanation of what is happening and why.",
          "severity": "low", "medium", "high", or "critical",
          "type": "opportunity", "risk", "anomaly", or "alert"
        }}
      ],
      "recommendations": [
        {{
          "title": "Strategic action to take",
          "description": "Why we should do this and what the expected outcome is.",
          "type": "reallocation", "internal_loan", "cost_reduction", "growth_investment", or "risk_alert",
          "amount": (integer, estimated capital involved, 0 if not applicable),
          "priority": "low", "medium", "high", or "urgent"
        }}
      ]
    }}
    
    Only output valid JSON. Do not include markdown formatting like ```json. Just the raw JSON string.
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Strip markdown if model included it
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
            
        parsed_data = json.loads(response_text)
        return parsed_data
        
    except Exception as e:
        logger.error(f"Failed to generate AI insights: {str(e)}")
        # Fallback if API fails
        return get_mock_insights(subsidiary_name)

def get_mock_insights(subsidiary_name: str) -> Dict[str, Any]:
    return {
      "insights": [
        {
          "title": f"Cost Optimization detected in {subsidiary_name}",
          "description": f"OPEX decreased by 5% while Gross Revenue grew. The subsidiary is achieving better operational efficiency.",
          "severity": "low",
          "type": "opportunity"
        }
      ],
      "recommendations": [
        {
          "title": "Expand Production Capacity",
          "description": "Strong cash flows suggest capacity to self-fund expansion without relying on the Holding Company.",
          "type": "growth_investment",
          "amount": 5000000,
        }
      ]
    }

def generate_portfolio_insights(holding_company_name: str, subsidiaries_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Takes aggregated financial data for ALL subsidiaries in a holding company and uses Gemini
    to perform a holistic, cross-subsidiary comparative analysis.
    """
    if not API_KEY:
        logger.warning("GEMINI_API_KEY not found. Returning mock portfolio insights.")
        return get_mock_portfolio_insights()
        
    data_str = json.dumps(subsidiaries_data, indent=2)
    
    from services.macro_service import fetch_macro_data
    macro_data = fetch_macro_data()
    macro_str = json.dumps(macro_data, indent=2)
    
    prompt = f"""
    You are an expert AI financial analyst and Group CFO for a massive Holding Company (like Dangote Group or Heirs Holdings).
    Your job is to analyze the aggregated recent financial reports of ALL our subsidiaries and generate actionable strategic portfolio insights.
    
    Holding Company Name: {holding_company_name}
    
    Real-Time Macro-Economic Context (incorporate this into your reasoning):
    {macro_str}
    
    Aggregated Financial Data for all subsidiaries (JSON):
    {data_str}
    
    Tasks:
    1. Rank the subsidiaries by performance and margins.
    2. Identify cash-rich vs. cash-poor subsidiaries.
    3. Recommend specific intra-company loans or bailouts (e.g., Take X amount from Subsidiary A and loan to Subsidiary B) taking into account macro factors like FX.
    4. Recommend group-wide cost reduction, resource reallocation, or growth strategies.
    
    Return your response strictly as a JSON object with the following structure:
    {{
      "insights": [
        {{
          "title": "Short descriptive title (e.g., Heavy Cash Drag in Tech Subsidiary due to FX)",
          "description": "Detailed explanation of what is happening across the portfolio and why.",
          "severity": "low", "medium", "high", or "critical",
          "type": "opportunity", "risk", "anomaly", or "alert"
        }}
      ],
      "recommendations": [
        {{
          "title": "Strategic action to take",
          "description": "Why we should do this and what the expected outcome is.",
          "type": "reallocation", "internal_loan", "cost_reduction", "growth_investment", or "risk_alert",
          "amount": (integer, estimated capital involved, 0 if not applicable),
          "priority": "low", "medium", "high", or "urgent"
        }}
      ]
    }}
    
    Only output valid JSON. Do not include markdown formatting like ```json.
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
            
        return json.loads(response_text)
    except Exception as e:
        logger.error(f"Failed to generate portfolio insights: {str(e)}")
        return get_mock_portfolio_insights()

def simulate_financial_scenario(portfolio_data: List[Dict[str, Any]], user_prompt: str) -> Dict[str, Any]:
    """
    Runs a deterministic mathematical projection using Gemini to simulate a 12-month scenario.
    """
    if not API_KEY:
        logger.warning("GEMINI_API_KEY not found. Returning mock simulation.")
        return get_mock_simulation(portfolio_data)
        
    from services.macro_service import fetch_macro_data
    macro_data = fetch_macro_data()
    
    prompt = f"""
    You are a strictly quantitative Financial Modeling AI.
    I am providing you with the historical financial baseline of a holding company's subsidiaries and a live macro-economic context.
    I am also giving you a scenario provided by the MD/CEO.
    
    Live Macro Context:
    {json.dumps(macro_data, indent=2)}
    
    Historical Portfolio Baseline:
    {json.dumps(portfolio_data, indent=2)}
    
    SCENARIO TO SIMULATE:
    "{user_prompt}"
    
    TASK:
    Generate a 12-month mathematical projection for EACH subsidiary mentioned in the baseline.
    Apply standard financial reasoning (e.g., if inflation is 33%, operating costs should linearly increase by ~2.7% per month; if NGN devalues, imported COGS increase proportionally; if a loan is executed, cash decreases in source and increases in target, plus interest implications).
    
    Return your response strictly as a JSON object containing a "narrative" explanation and a "results" array. Do not include any text outside the JSON object. Do not use markdown like ```json.
    
    Structure of the JSON:
    {{
      "narrative": "Detailed textual explanation of the impact of this scenario, explaining the changes in revenue, cash flow, margins, and any strategic recommendations based on the macro context.",
      "results": [
        {{
          "subsidiary": "Name of Subsidiary",
          "projection": [
            {{
              "month": 1,
              "revenue": (integer),
              "cogs": (integer),
              "opex": (integer),
              "net_income": (integer),
              "cash": (integer),
              "roace": (float, e.g. 15.5)
            }}
          ]
        }}
      ]
    }}
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-pro') # Using Pro for mathematical reasoning
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
            
        return json.loads(response_text)
    except Exception as e:
        logger.error(f"Failed to run scenario simulation: {str(e)}")
        return get_mock_simulation(portfolio_data)

def get_mock_portfolio_insights() -> Dict[str, Any]:
    return {
      "insights": [
        {
          "title": "Uneven Liquidity Distribution",
          "description": "One subsidiary holds 70% of the group's cash reserves while others face liquidity crunches, hindering overall portfolio agility.",
          "severity": "high",
          "type": "risk"
        }
      ],
      "recommendations": [
        {
          "title": "Execute Intra-Company Loan",
          "description": "Transfer excess reserves from the cash-rich subsidiary to underperforming ones to fund short-term OPEX without external high-interest debt.",
          "type": "internal_loan",
          "amount": 2500000,
          "priority": "urgent"
        }
      ]
    }

def get_mock_simulation(portfolio_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Generate deterministic mock simulation based on baseline data
    results = []
    for sub in portfolio_data:
        base_rev = 5000000
        base_cash = 1000000
        base_opex = 2000000
        
        if sub.get("recent_performance") and len(sub["recent_performance"]) > 0:
            latest = sub["recent_performance"][0]
            base_rev = latest.get("revenue", base_rev) or base_rev
            base_cash = latest.get("cash", base_cash) or base_cash
            base_opex = latest.get("opex", base_opex) or base_opex
            
        projection = []
        for month in range(1, 13):
            # Add some variance and trends
            rev = int(base_rev * (1 + (month * 0.02)))
            cash = int(base_cash * (1 + (month * 0.05)))
            opex = int(base_opex * (1 + (month * 0.01)))
            net = rev - opex
            
            projection.append({
                "month": month,
                "revenue": rev,
                "cogs": int(rev * 0.4),
                "opex": opex,
                "net_income": net,
                "cash": cash,
                "roace": round(15.0 + (month * 0.5), 1)
            })
            
        results.append({
            "subsidiary": sub["subsidiary_name"],
            "projection": projection
        })
        
    return {
        "narrative": "Notice: The GEMINI_API_KEY is not configured or not responding. The system has fallen back to a deterministic 12-month baseline projection using continuous growth parameters. For real AI analysis of macro-economic impacts, please configure a valid Gemini API key.",
        "results": results
    }
