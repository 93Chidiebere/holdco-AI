import google.generativeai as genai
import os
import json
from typing import List, Dict, Any

# Ensure API key is configured
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def generate_insights_from_anomalies(anomalies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Takes strictly filtered statistical anomalies and prompts Gemini to generate structured insights.
    """
    if not anomalies:
        return []

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are an expert financial and operational analyst for a multi-unit organization.
        I am providing you with a list of statistically significant anomalies detected in our units' recent performance.
        
        Anomalies:
        {json.dumps(anomalies, indent=2)}
        
        For each anomaly, generate a human-readable insight.
        You MUST return your response as a valid JSON object containing an array of insights under the key "insights".
        Do not include any markdown formatting like ```json. Just raw JSON.
        
        Structure:
        {{
            "insights": [
                {{
                    "unit_id": "string",
                    "title": "Short title describing the issue",
                    "severity": "low | medium | high | critical",
                    "description": "Clear explanation of what happened based on the z-score and values.",
                    "recommended_action": "What the management should do to investigate or resolve this."
                }}
            ]
        }}
        """

        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        try:
            result = json.loads(response.text)
            return result.get("insights", [])
        except json.JSONDecodeError:
            print("Failed to decode LLM response as JSON")
            return []
            
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return []

def generate_forecast_insights(forecast_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes statistical forecast output and uses Gemini to interpret it.
    """
    if not forecast_data or "error" in forecast_data:
        return forecast_data
        
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are an expert Financial Analyst AI for HoldCo AI.
        I have run a statistical linear regression forecast.
        
        Metric Forecasted: {forecast_data.get('metric')}
        Overall Trend: {forecast_data.get('trend')}
        
        Historical Data (last few points):
        {json.dumps(forecast_data.get('historical_data', [])[-5:], indent=2)}
        
        Forecasted Future Data:
        {json.dumps(forecast_data.get('forecast'), indent=2)}
        
        Please provide a concise financial interpretation.
        You MUST return your response as a valid JSON object.
        Do not include any markdown formatting like ```json. Just raw JSON.
        
        Structure:
        {{
            "summary": "A 1-2 sentence summary of the trend and what it means for the business.",
            "risk_level": "low | medium | high | critical",
            "recommendation": "One clear strategic recommendation to alter the trajectory if negative, or capitalize on it if positive."
        }}
        """

        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        try:
            insight = json.loads(response.text)
            result = forecast_data.copy()
            result["llm_interpretation"] = insight
            return result
        except json.JSONDecodeError:
            print("Failed to decode LLM response as JSON")
            result = forecast_data.copy()
            result["llm_interpretation"] = {"error": "Failed to decode interpretation"}
            return result
            
    except Exception as e:
        print(f"Error calling Gemini for forecast: {e}")
        result = forecast_data.copy()
        result["llm_interpretation"] = {"error": str(e)}
        return result

def generate_variance_insights(variance_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes exact calculated budget vs actual variance and uses Gemini to interpret it.
    """
    if not variance_data or "error" in variance_data:
        return variance_data
        
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are an expert Financial Analyst AI for HoldCo AI.
        I have run a Budget vs. Actual Variance Analysis.
        
        Metric Analyzed: {variance_data.get('metric')}
        
        Overall Summary:
        {json.dumps(variance_data.get('overall_summary'), indent=2)}
        
        Period Breakdown (Month by Month):
        {json.dumps(variance_data.get('period_breakdown'), indent=2)}
        
        Please provide a concise financial interpretation.
        You MUST return your response as a valid JSON object.
        Do not include any markdown formatting like ```json. Just raw JSON.
        
        Structure:
        {{
            "root_cause_hypothesis": "A 1-2 sentence hypothesis on why the variance occurred based on the month-by-month breakdown.",
            "is_structural_issue": boolean, // True if the variance seems like a persistent structural issue, False if it looks like a one-off timing issue
            "recommendation": "One clear strategic recommendation."
        }}
        """

        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        try:
            insight = json.loads(response.text)
            result = variance_data.copy()
            result["llm_interpretation"] = insight
            return result
        except json.JSONDecodeError:
            print("Failed to decode LLM response as JSON")
            result = variance_data.copy()
            result["llm_interpretation"] = {"error": "Failed to decode interpretation"}
            return result
            
    except Exception as e:
        print(f"Error calling Gemini for variance: {e}")
        result = variance_data.copy()
        result["llm_interpretation"] = {"error": str(e)}
        return result

def generate_scenario_insights(scenario_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes exact calculated scenario modeling impact and uses Gemini to interpret it.
    """
    if not scenario_data or "error" in scenario_data:
        return scenario_data
        
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are an expert Financial Analyst AI for HoldCo AI.
        I have run a Scenario Modeling (What-If) Analysis.
        
        Baseline State:
        {json.dumps(scenario_data.get('baseline_state'), indent=2)}
        
        Simulated State (After changes applied):
        {json.dumps(scenario_data.get('simulated_state'), indent=2)}
        
        Impact Analysis:
        {json.dumps(scenario_data.get('impact'), indent=2)}
        
        Please provide a concise financial interpretation of this scenario.
        You MUST return your response as a valid JSON object.
        Do not include any markdown formatting like ```json. Just raw JSON.
        
        Structure:
        {{
            "summary": "A 1-2 sentence summary of the scenario's overall impact on the bottom line.",
            "risk_or_opportunity": "Identify the primary risk if this scenario plays out, or the primary opportunity.",
            "mitigation_strategy": "One clear strategic recommendation to either mitigate the risk or capitalize on the opportunity."
        }}
        """

        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        try:
            insight = json.loads(response.text)
            result = scenario_data.copy()
            result["llm_interpretation"] = insight
            return result
        except json.JSONDecodeError:
            print("Failed to decode LLM response as JSON")
            result = scenario_data.copy()
            result["llm_interpretation"] = {"error": "Failed to decode interpretation"}
            return result
            
    except Exception as e:
        print(f"Error calling Gemini for scenario: {e}")
        result = scenario_data.copy()
        result["llm_interpretation"] = {"error": str(e)}
        return result

def generate_capital_insights(allocation_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes algorithmic capital allocation and uses Gemini to generate an executive-level summary and justification.
    """
    if not allocation_data or "error" in allocation_data:
        return allocation_data
        
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are an expert Chief Financial Officer (CFO) AI for HoldCo AI.
        I have run a mathematical optimization for capital allocation across subsidiaries based on their ROI and Risk profiles.
        
        Allocation Results:
        {json.dumps(allocation_data, indent=2)}
        
        Please provide a definitive executive recommendation. 
        You MUST return your response as a valid JSON object.
        Do not include any markdown formatting like ```json. Just raw JSON.
        
        Structure:
        {{
            "executive_summary": "A 2-3 sentence executive summary explaining WHERE the capital was deployed and WHY it is the optimal move.",
            "risk_assessment": "A brief assessment of the risk profile of this allocation.",
            "next_steps": "One clear directive for the board or subsidiaries regarding this capital deployment."
        }}
        """

        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        try:
            insight = json.loads(response.text)
            result = allocation_data.copy()
            result["llm_interpretation"] = insight
            return result
        except json.JSONDecodeError:
            print("Failed to decode LLM response as JSON")
            result = allocation_data.copy()
            result["llm_interpretation"] = {"error": "Failed to decode interpretation"}
            return result
            
    except Exception as e:
        print(f"Error calling Gemini for capital allocation: {e}")
        result = allocation_data.copy()
        result["llm_interpretation"] = {"error": str(e)}
        return result
