import pandas as pd
import numpy as np
from typing import List, Dict, Any

def detect_anomalies(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Takes a list of dictionaries representing unit financial data over time.
    Calculates moving averages, z-scores, and identifies statistically significant anomalies.
    Returns a list of isolated anomalies to be passed to the LLM.
    """
    if not data:
        return []

    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    # Ensure date is datetime and sort
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by=['unit_id', 'date'])
    
    anomalies = []
    
    # Process each unit separately
    for unit_id, group in df.groupby('unit_id'):
        if len(group) < 3:
            # Not enough data for statistical analysis
            continue
            
        group = group.copy()
        
        # Calculate for Total Inflow
        group['inflow_mean'] = group['total_inflow'].rolling(window=3, min_periods=1).mean()
        group['inflow_std'] = group['total_inflow'].rolling(window=3, min_periods=1).std().fillna(0)
        # Avoid division by zero
        group['inflow_z'] = np.where(group['inflow_std'] > 0, 
                                     (group['total_inflow'] - group['inflow_mean']) / group['inflow_std'], 
                                     0)
                                     
        # Calculate for Total Outflow
        group['outflow_mean'] = group['total_outflow'].rolling(window=3, min_periods=1).mean()
        group['outflow_std'] = group['total_outflow'].rolling(window=3, min_periods=1).std().fillna(0)
        group['outflow_z'] = np.where(group['outflow_std'] > 0, 
                                      (group['total_outflow'] - group['outflow_mean']) / group['outflow_std'], 
                                      0)

        # Get the latest row for anomaly detection (or we could detect historical ones too)
        latest = group.iloc[-1]
        
        # Detect Inflow Anomaly (Z-score > 1.5 for sensitivity)
        if abs(latest['inflow_z']) > 1.5:
            direction = "spike" if latest['inflow_z'] > 0 else "drop"
            anomalies.append({
                "unit_id": unit_id,
                "unit_name": latest['unit_name'],
                "metric": "total_inflow",
                "type": direction,
                "value": float(latest['total_inflow']),
                "mean": float(latest['inflow_mean']),
                "z_score": float(latest['inflow_z']),
                "date": latest['date'].strftime('%Y-%m-%d')
            })
            
        # Detect Outflow Anomaly
        if abs(latest['outflow_z']) > 1.5:
            direction = "spike" if latest['outflow_z'] > 0 else "drop"
            anomalies.append({
                "unit_id": unit_id,
                "unit_name": latest['unit_name'],
                "metric": "total_outflow",
                "type": direction,
                "value": float(latest['total_outflow']),
                "mean": float(latest['outflow_mean']),
                "z_score": float(latest['outflow_z']),
                "date": latest['date'].strftime('%Y-%m-%d')
            })

    return anomalies
