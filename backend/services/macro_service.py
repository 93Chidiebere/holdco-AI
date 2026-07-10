import urllib.request
import json
import logging

logger = logging.getLogger(__name__)

def fetch_macro_data():
    """
    Fetches real-time macroeconomic indicators using open APIs.
    Returns a dictionary of relevant macro data for the AI engine.
    """
    macro_data = {
        "inflation_rate_ng": 33.2, # Fallback baseline (Nigeria)
        "interest_rate_mpr_ng": 24.75, # Fallback baseline
        "exchange_rates": {
            "USD_NGN": 1500.0,
            "EUR_NGN": 1600.0,
            "GBP_NGN": 1900.0
        }
    }
    
    try:
        # Use ExchangeRate-API (open, no key required for basic latest rates based on USD)
        req = urllib.request.Request("https://open.er-api.com/v6/latest/USD", headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                rates = data.get("rates", {})
                
                # We want the value of 1 USD in NGN
                usd_ngn = rates.get("NGN")
                eur_usd = rates.get("EUR")
                gbp_usd = rates.get("GBP")
                
                if usd_ngn:
                    macro_data["exchange_rates"]["USD_NGN"] = round(usd_ngn, 2)
                    
                    if eur_usd and eur_usd > 0:
                        # 1 EUR = (1 / eur_usd) USD => (1 / eur_usd) * usd_ngn NGN
                        macro_data["exchange_rates"]["EUR_NGN"] = round((1 / eur_usd) * usd_ngn, 2)
                        
                    if gbp_usd and gbp_usd > 0:
                        macro_data["exchange_rates"]["GBP_NGN"] = round((1 / gbp_usd) * usd_ngn, 2)
                        
                logger.info(f"Successfully fetched live macro FX data: {macro_data['exchange_rates']}")
    except Exception as e:
        logger.error(f"Failed to fetch live macro data: {str(e)}. Using fallback baseline.")
        
    return macro_data
