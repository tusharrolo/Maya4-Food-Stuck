#!/usr/bin/env python3
"""
Process Maya 4 Alert JSON files and extract BasketNotEmpty alerts
Output: alerts-data.json with all alerts in Singapore timezone
"""

import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

ALERTS_DIR = Path.home() / 'Desktop' / 'alerts-kiosk'
OUTPUT_FILE = Path(__file__).parent / 'data' / 'alerts-data.json'

# Singapore timezone (UTC+8)
SGT = timezone(timedelta(hours=8))

def parse_slack_timestamp(ts):
    """Convert Slack timestamp to datetime object"""
    seconds = float(ts.split('.')[0])
    return datetime.fromtimestamp(seconds, tz=timezone.utc)

def extract_basket_name(text):
    """Extract and format basket name from alert text"""
    import re

    # Try old format first: (meat_fryer_1|veg_fryer_3)_content
    match = re.search(r'(meat_fryer_[12]|veg_fryer_[34])_content', text)

    # Try new format: (veg_fryer_3|meat_fryer_1) is BASKET_NOT_EMPTY
    if not match:
        match = re.search(r'(meat_fryer_[12]|veg_fryer_[34])\s+is\s+BASKET_NOT_EMPTY', text)

    if not match:
        return None

    basket = match.group(1)
    mapping = {
        'meat_fryer_1': 'Meat Fryer 1',
        'meat_fryer_2': 'Meat Fryer 2',
        'veg_fryer_3': 'Veg Fryer 3',
        'veg_fryer_4': 'Veg Fryer 4'
    }
    return mapping.get(basket, basket)

def extract_status(text):
    """Extract alert status from text"""
    if '[Alert:Firing]' in text:
        return 'firing'
    elif '[Alert:Resolved]' in text:
        return 'resolved'
    elif ':bell: Notification' in text:
        return 'notification'
    return 'unknown'

def process_alerts():
    """Main processing function"""
    alerts = []

    # Ensure data directory exists
    OUTPUT_FILE.parent.mkdir(exist_ok=True)

    # Get all JSON files
    files = sorted([f for f in ALERTS_DIR.glob('*.json')
                   if f.name.replace('.json', '').replace('-', '').isdigit()])

    print(f'Processing {len(files)} files...')

    for file_path in files:
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            print(f'Skipping {file_path.name}: JSON decode error - {e}')
            continue

        for message in data:
            if not isinstance(message, dict):
                continue

            text = message.get('text', '')
            ts = message.get('ts')

            if not text or not ts:
                continue

            # Only process BasketNotEmpty alerts (both formats)
            if 'BasketNotEmpty' not in text and 'BASKET_NOT_EMPTY' not in text:
                continue

            basket = extract_basket_name(text)
            status = extract_status(text)

            if not basket:
                continue

            # Skip resolved alerts - they're not actual occurrences
            if status == 'resolved':
                continue

            # Parse timestamp and convert to SGT
            dt_utc = parse_slack_timestamp(ts)
            dt_sgt = dt_utc.astimezone(SGT)

            alerts.append({
                'timestamp': dt_utc.isoformat(),
                'date': dt_sgt.strftime('%Y-%m-%d'),
                'time': dt_sgt.strftime('%H:%M:%S'),
                'hour': dt_sgt.hour,
                'basket': basket,
                'status': status,
                'text': text
            })

    # Sort by timestamp
    alerts.sort(key=lambda x: x['timestamp'])

    print(f'Extracted {len(alerts)} BasketNotEmpty alerts')
    if alerts:
        print(f'Date range: {alerts[0]["date"]} to {alerts[-1]["date"]}')

        # Stats by basket
        basket_counts = {}
        for alert in alerts:
            basket_counts[alert['basket']] = basket_counts.get(alert['basket'], 0) + 1

        print('\nAlerts by basket:')
        for basket, count in sorted(basket_counts.items(), key=lambda x: -x[1]):
            print(f'  {basket}: {count}')

    # Save to file
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(alerts, f, indent=2)

    print(f'\nData saved to: {OUTPUT_FILE}')
    return alerts

if __name__ == '__main__':
    try:
        process_alerts()
    except Exception as e:
        print(f'Error processing alerts: {e}')
        import traceback
        traceback.print_exc()
        exit(1)
