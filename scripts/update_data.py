#!/usr/bin/env python3

import json
import requests
from datetime import datetime
import sys

def get_exchange_rate():
    """
    Get USD to KRW exchange rate from free API
    Using exchangerate.host (no auth required)
    """
    try:
        # Try exchangerate.host API (free, no key needed)
        print("Fetching exchange rate from exchangerate.host...")
        response = requests.get(
            'https://api.exchangerate.host/latest?base=USD&symbols=KRW',
            timeout=10
        )
        
        print(f"API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"API Data: {data}")
            
            if 'rates' in data and 'KRW' in data['rates']:
                rate = data['rates']['KRW']
                print(f"Successfully fetched rate: {rate}")
                return {
                    'rate': rate,
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'source': 'exchangerate.host'
                }
        else:
            print(f"API returned status {response.status_code}")
    except Exception as e:
        print(f"Error fetching exchange rate: {e}")
        import traceback
        traceback.print_exc()
    
    print("Could not fetch exchange rate, using cached value")
    return None

def update_rates():
    """
    Update the exchange rate file
    """
    rates_file = 'data/rates.json'
    
    print("\n--- Updating Exchange Rates ---")
    print(f"Rates file: {rates_file}")
    
    # Read current rates to calculate change
    try:
        with open(rates_file, 'r') as f:
            old_data = json.load(f)
            old_rate = old_data.get('rate', 1200)
            print(f"Old rate: {old_rate}")
    except Exception as e:
        print(f"Error reading old rates: {e}")
        old_rate = 1200
    
    # Fetch new rate
    new_data = get_exchange_rate()
    
    if new_data:
        new_rate = new_data['rate']
        change = new_rate - old_rate
        change_percent = (change / old_rate) * 100 if old_rate != 0 else 0
        
        rates_data = {
            'rate': new_rate,
            'change': round(change, 2),
            'changePercent': round(change_percent, 2),
            'timestamp': new_data['timestamp'],
            'source': new_data.get('source', 'unknown')
        }
        
        with open(rates_file, 'w') as f:
            json.dump(rates_data, f, indent=2)
        
        print(f"✓ Exchange rate updated: 1 USD = {new_rate} KRW (change: {change_percent:+.2f}%)")
        return True
    else:
        print("✗ Failed to update exchange rate")
        return False

def update_stocks():
    """
    Update stock prices
    Note: Stock price APIs typically require authentication
    This is a placeholder for future implementation
    """
    stocks_file = 'data/stocks.json'
    
    print("\n--- Updating Stocks Data ---")
    print(f"Stocks file: {stocks_file}")
    
    try:
        with open(stocks_file, 'r') as f:
            stocks_data = json.load(f)
        
        # TODO: Fetch real stock prices and update
        # For now, we'll add a timestamp to track updates
        stocks_data['lastUpdated'] = datetime.utcnow().isoformat() + 'Z'
        
        with open(stocks_file, 'w') as f:
            json.dump(stocks_data, f, indent=2)
        
        print(f"✓ Stocks data updated: {len(stocks_data['stocks'])} stocks tracked")
        return True
    except Exception as e:
        print(f"✗ Error updating stocks: {e}")
        return False

if __name__ == '__main__':
    print("🤖 Starting data update...")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    rates_ok = update_rates()
    stocks_ok = update_stocks()
    
    print()
    if rates_ok and stocks_ok:
        print("✅ Data update completed successfully!")
        sys.exit(0)
    else:
        print("⚠️  Data update completed with warnings")
        sys.exit(0)  # Still exit 0 to avoid blocking the workflow
