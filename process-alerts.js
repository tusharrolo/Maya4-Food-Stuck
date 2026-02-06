#!/usr/bin/env node
/**
 * Process Maya 4 Alert JSON files and extract BasketNotEmpty alerts
 * Output: alerts-data.json with all alerts in Singapore timezone
 */

const fs = require('fs');
const path = require('path');

const ALERTS_DIR = path.join(process.env.HOME, 'Desktop', 'alerts-kiosk');
const OUTPUT_FILE = path.join(__dirname, 'data', 'alerts-data.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper: Convert Slack timestamp to Date (already in UTC)
function parseSlackTimestamp(ts) {
  const [seconds, microseconds] = ts.split('.');
  return new Date(parseInt(seconds) * 1000);
}

// Helper: Convert Date to Singapore time string
function toSingaporeTime(date) {
  // Singapore is UTC+8
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// Helper: Extract basket name from text
function extractBasketName(text) {
  const match = text.match(/(meat_fryer_[12]|veg_fryer_[34])_content/);
  if (!match) return null;

  const basket = match[1];
  const mapping = {
    'meat_fryer_1': 'Meat Fryer 1',
    'meat_fryer_2': 'Meat Fryer 2',
    'veg_fryer_3': 'Veg Fryer 3',
    'veg_fryer_4': 'Veg Fryer 4'
  };
  return mapping[basket] || basket;
}

// Helper: Extract alert status
function extractStatus(text) {
  if (text.includes('[Alert:Firing]')) return 'firing';
  if (text.includes('[Alert:Resolved]')) return 'resolved';
  if (text.includes(':bell: Notification')) return 'notification';
  return 'unknown';
}

// Main processing
function processAlerts() {
  const alerts = [];

  // Get all JSON files
  const files = fs.readdirSync(ALERTS_DIR)
    .filter(f => f.endsWith('.json') && f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
    .sort();

  console.log(`Processing ${files.length} files...`);

  for (const file of files) {
    const filePath = path.join(ALERTS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const message of data) {
      if (!message.text || !message.ts) continue;

      const text = message.text;

      // Only process BasketNotEmpty alerts
      if (!text.includes('BasketNotEmpty')) continue;

      const basket = extractBasketName(text);
      const status = extractStatus(text);

      if (!basket) continue;

      const date = parseSlackTimestamp(message.ts);

      // Get Singapore time components
      const sgtDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
      const hour = parseInt(date.toLocaleString('en-US', {
        timeZone: 'Asia/Singapore',
        hour: '2-digit',
        hour12: false
      }));

      alerts.push({
        timestamp: date.toISOString(),
        date: date.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' }), // YYYY-MM-DD
        time: date.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Singapore',
          hour12: false
        }),
        hour: hour,
        basket: basket,
        status: status,
        text: text
      });
    }
  }

  // Sort by timestamp
  alerts.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  console.log(`Extracted ${alerts.length} BasketNotEmpty alerts`);
  console.log(`Date range: ${alerts[0]?.date} to ${alerts[alerts.length - 1]?.date}`);

  // Stats by basket
  const basketCounts = alerts.reduce((acc, alert) => {
    acc[alert.basket] = (acc[alert.basket] || 0) + 1;
    return acc;
  }, {});
  console.log('\nAlerts by basket:');
  Object.entries(basketCounts).sort((a, b) => b[1] - a[1]).forEach(([basket, count]) => {
    console.log(`  ${basket}: ${count}`);
  });

  // Save to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(alerts, null, 2));
  console.log(`\nData saved to: ${OUTPUT_FILE}`);

  return alerts;
}

// Run
try {
  processAlerts();
} catch (error) {
  console.error('Error processing alerts:', error);
  process.exit(1);
}
