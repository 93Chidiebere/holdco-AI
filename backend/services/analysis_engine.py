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

def simulate_scenario(baseline: Dict[str, float], parameters: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Takes a baseline financial state and applies 'what-if' percentage changes to see the net impact.
    Assumes standard simplified P&L metrics: revenue, cogs, opex.
    Net Surplus = revenue - cogs - opex.
    """
    simulated = baseline.copy()
    
    # Apply changes
    for param in parameters:
        metric = param.get("metric")
        change_pct = param.get("change_pct", 0.0)
        
        if metric in simulated:
            simulated[metric] = simulated[metric] * (1 + (change_pct / 100.0))
            
    # Calculate baseline bottom line
    baseline_revenue = baseline.get("revenue", 0)
    baseline_cogs = baseline.get("cogs", 0)
    baseline_opex = baseline.get("opex", 0)
    baseline_net = baseline_revenue - baseline_cogs - baseline_opex
    
    # Calculate simulated bottom line
    simulated_revenue = simulated.get("revenue", 0)
    simulated_cogs = simulated.get("cogs", 0)
    simulated_opex = simulated.get("opex", 0)
    simulated_net = simulated_revenue - simulated_cogs - simulated_opex
    
    net_impact = simulated_net - baseline_net
    net_impact_pct = (net_impact / abs(baseline_net) * 100) if baseline_net != 0 else 0
    
    return {
        "baseline_state": {
            "metrics": baseline,
            "net_surplus": baseline_net
        },
        "simulated_state": {
            "metrics": simulated,
            "net_surplus": simulated_net
        },
        "impact": {
            "net_impact_value": net_impact,
            "net_impact_pct": net_impact_pct
        }
    }

def optimize_capital_allocation(total_available: float, units: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Takes total available capital and an array of units with ROI and Risk scores.
    Uses a greedy knapsack-like heuristic ranking by (ROI / Risk) to allocate capital.
    """
    if not units:
        return {"error": "No units provided for allocation."}
        
    # Calculate a score for each unit: (ROI / Risk). Higher is better.
    # If risk is 0, add a small epsilon to avoid division by zero.
    for u in units:
        risk = max(float(u.get('risk_score', 1)), 0.1)
        roi = float(u.get('roi_pct', 0))
        u['score'] = roi / risk
        u['allocated'] = 0.0
        
    # Sort units by score descending
    sorted_units = sorted(units, key=lambda x: x['score'], reverse=True)
    
    remaining_capital = total_available
    allocations = []
    
    for u in sorted_units:
        requested = float(u.get('requested_capital', 0))
        if requested <= 0:
            continue
            
        if remaining_capital <= 0:
            break
            
        # Allocate up to the requested amount or whatever is remaining
        amount_to_allocate = min(requested, remaining_capital)
        u['allocated'] = amount_to_allocate
        remaining_capital -= amount_to_allocate
        
        allocations.append({
            "unit_id": u.get("unit_id"),
            "unit_name": u.get("unit_name"),
            "requested": requested,
            "allocated": amount_to_allocate,
            "roi_pct": u.get("roi_pct"),
            "risk_score": u.get("risk_score")
        })
        
    return {
        "total_available": total_available,
        "total_allocated": total_available - remaining_capital,
        "remaining_unallocated": remaining_capital,
        "allocations": allocations
    }

def calculate_churn_risk(customers: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Heuristic algorithm to predict churn risk for an array of customers.
    High inactivity, low usage, and low tenure increase the risk profile.
    """
    if not customers:
        return {"error": "No customers provided"}
        
    analyzed_customers = []
    high_risk_count = 0
    medium_risk_count = 0
    low_risk_count = 0
    
    for c in customers:
        tenure = float(c.get("tenure_months", 1))
        inactivity = float(c.get("last_active_days_ago", 0))
        usage = float(c.get("usage_score", 5)) # 1-10
        
        # Simple heuristic formula for a risk score out of 100
        # More inactivity -> higher risk
        # Lower usage -> higher risk 
        # Lower tenure -> slightly higher risk (less established)
        
        inactivity_factor = min(inactivity / 30.0, 1.0) * 40 # Up to 40 points
        usage_factor = (10 - usage) / 10.0 * 40              # Up to 40 points
        tenure_factor = max(1.0 - (tenure / 24.0), 0) * 20   # Up to 20 points
        
        risk_score = min(inactivity_factor + usage_factor + tenure_factor, 100.0)
        
        if risk_score > 70:
            tier = "High"
            high_risk_count += 1
        elif risk_score > 40:
            tier = "Medium"
            medium_risk_count += 1
        else:
            tier = "Low"
            low_risk_count += 1
            
        c_out = c.copy()
        c_out["churn_risk_score"] = round(risk_score, 2)
        c_out["churn_risk_tier"] = tier
        analyzed_customers.append(c_out)
        
    return {
        "summary": {
            "total_analyzed": len(customers),
            "high_risk": high_risk_count,
            "medium_risk": medium_risk_count,
            "low_risk": low_risk_count
        },
        "customer_profiles": analyzed_customers
    }

def perform_clustering(data_points: List[Dict[str, Any]], target_clusters: int) -> Dict[str, Any]:
    """
    A lightweight, deterministic heuristic to group data points into clusters based on magnitude.
    For production, this would use a robust K-Means from scikit-learn.
    """
    if not data_points:
        return {"error": "No data points provided"}
        
    # Calculate a magnitude score for each point
    for dp in data_points:
        features = dp.get("features", [])
        # Magnitude is just sum of features for simplistic clustering
        magnitude = sum(features) if features else 0
        dp["_magnitude"] = magnitude
        
    # Sort by magnitude to group them
    sorted_points = sorted(data_points, key=lambda x: x["_magnitude"])
    
    # Divide into roughly equal sized buckets
    clusters = {}
    for i in range(target_clusters):
        clusters[f"cluster_{i+1}"] = []
        
    chunk_size = max(1, len(sorted_points) // target_clusters)
    
    for idx, point in enumerate(sorted_points):
        # Determine which cluster index this belongs to
        cluster_idx = min(idx // chunk_size, target_clusters - 1)
        cluster_name = f"cluster_{cluster_idx+1}"
        
        # Clean up internal metadata before output
        out_point = point.copy()
        del out_point["_magnitude"]
        
        clusters[cluster_name].append(out_point)
        
    # Calculate cluster summaries
    summary = {}
    for c_name, c_data in clusters.items():
        summary[c_name] = {
            "size": len(c_data)
        }
        
    return {
        "summary": summary,
        "clusters": clusters
    }

def normalize_data(raw_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Cleans, standardizes, and normalizes a messy array of dictionaries.
    Lowercases keys, converts string numbers to floats, trims whitespace.
    """
    if not raw_data:
        return {"error": "No raw data provided"}
        
    normalized_records = []
    keys_standardized = set()
    type_conversions = 0
    
    for row in raw_data:
        clean_row = {}
        for k, v in row.items():
            # Standardize key: lowercase, strip whitespace, replace spaces with underscores
            clean_k = str(k).lower().strip().replace(" ", "_")
            if clean_k != k:
                keys_standardized.add(k)
                
            clean_v = v
            # Standardize value: trim strings, attempt float conversion for numeric strings
            if isinstance(v, str):
                clean_v = v.strip()
                # Attempt to parse numbers
                if clean_v.replace('.', '', 1).isdigit() or (clean_v.startswith('-') and clean_v[1:].replace('.', '', 1).isdigit()):
                    try:
                        clean_v = float(clean_v)
                        type_conversions += 1
                    except ValueError:
                        pass
                        
            clean_row[clean_k] = clean_v
            
        normalized_records.append(clean_row)
        
    return {
        "summary": {
            "total_records_processed": len(raw_data),
            "keys_standardized_count": len(keys_standardized),
            "type_conversions_made": type_conversions
        },
        "normalized_data": normalized_records
    }
