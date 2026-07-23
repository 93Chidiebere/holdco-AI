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
