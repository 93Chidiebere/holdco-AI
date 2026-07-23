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

def generate_forecast(data: List[Dict[str, Any]], metric: str, periods: int) -> Dict[str, Any]:
    """
    Takes historical time-series data and projects a specified metric forward
    using linear regression (numpy polyfit).
    """
    if not data or len(data) < 2:
        return {"error": "Not enough data points for forecasting. Need at least 2."}

    df = pd.DataFrame(data)
    
    if 'date' not in df.columns or metric not in df.columns:
        return {"error": f"Data must contain 'date' and '{metric}' columns."}
        
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by='date')
    
    # Convert dates to ordinal for linear regression
    x = df['date'].map(pd.Timestamp.toordinal).values
    y = df[metric].values
    
    # Fit line: y = mx + c
    m, c = np.polyfit(x, y, 1)
    
    # Generate future dates
    last_date = df['date'].iloc[-1]
    # Estimate the frequency. Default to monthly if we can't tell
    freq = pd.infer_freq(df['date']) or 'M'
    
    future_dates = pd.date_range(start=last_date, periods=periods + 1, freq=freq)[1:]
    
    future_x = future_dates.map(pd.Timestamp.toordinal).values
    future_y = (m * future_x) + c
    
    historical = df[['date', metric]].copy()
    historical['date'] = historical['date'].dt.strftime('%Y-%m-%d')
    
    forecasts = []
    for i, date in enumerate(future_dates):
        forecasts.append({
            "date": date.strftime('%Y-%m-%d'),
            "predicted_value": float(future_y[i])
        })
        
    trend = "increasing" if m > 0 else "decreasing" if m < 0 else "flat"
    
    return {
        "metric": metric,
        "trend": trend,
        "historical_data": historical.to_dict('records'),
        "forecast": forecasts
    }

def calculate_variance(actuals: List[Dict[str, Any]], budgets: List[Dict[str, Any]], metric: str) -> Dict[str, Any]:
    """
    Takes actual and budget data arrays and calculates exact percentage deviations.
    """
    if not actuals or not budgets:
        return {"error": "Missing actuals or budgets data."}
        
    df_act = pd.DataFrame(actuals)
    df_bud = pd.DataFrame(budgets)
    
    if 'date' not in df_act.columns or 'date' not in df_bud.columns:
        return {"error": "Both datasets must contain a 'date' column."}
        
    # Standardize dates and merge
    df_act['date'] = pd.to_datetime(df_act['date']).dt.strftime('%Y-%m')
    df_bud['date'] = pd.to_datetime(df_bud['date']).dt.strftime('%Y-%m')
    
    # Aggregate in case there are multiple entries per month
    df_act = df_act.groupby('date')[metric].sum().reset_index().rename(columns={metric: 'actual'})
    df_bud = df_bud.groupby('date')[metric].sum().reset_index().rename(columns={metric: 'budget'})
    
    merged = pd.merge(df_bud, df_act, on='date', how='outer').fillna(0)
    
    # Calculate Variance: Actual - Budget
    merged['variance_value'] = merged['actual'] - merged['budget']
    
    # Calculate Variance Percentage (handle division by zero)
    merged['variance_pct'] = np.where(merged['budget'] != 0, 
                                      (merged['variance_value'] / merged['budget']) * 100, 
                                      0)
    
    total_budget = float(merged['budget'].sum())
    total_actual = float(merged['actual'].sum())
    total_variance = total_actual - total_budget
    total_variance_pct = (total_variance / total_budget * 100) if total_budget != 0 else 0
    
    return {
        "metric": metric,
        "overall_summary": {
            "total_budget": total_budget,
            "total_actual": total_actual,
            "total_variance_value": total_variance,
            "total_variance_pct": total_variance_pct
        },
        "period_breakdown": merged.to_dict('records')
    }
