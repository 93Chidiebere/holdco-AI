import os
import json
import google.generativeai as genai
from typing import Dict, List, Any
import logging

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
          "priority": "medium"
        }
      ]
    }
