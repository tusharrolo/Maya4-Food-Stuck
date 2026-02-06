/* ═══════════════════════════════════════════════════════════
   Data Loader & Filter — Load and filter alerts data
   ═══════════════════════════════════════════════════════════ */

let allAlerts = [];
let filteredAlerts = [];
let dateRange = { start: null, end: null };

// Load alerts data from JSON
async function loadAlertsData() {
  try {
    const response = await fetch('data/alerts-data.json');
    allAlerts = await response.json();

    // Set initial date range to full dataset
    if (allAlerts.length > 0) {
      const dates = allAlerts.map(a => a.date).sort();
      dateRange.start = dates[0];
      dateRange.end = dates[dates.length - 1];
    }

    // Initialize filtered data
    filteredAlerts = allAlerts;

    console.log(`Loaded ${allAlerts.length} alerts from ${dateRange.start} to ${dateRange.end}`);
    return allAlerts;
  } catch (error) {
    console.error('Error loading alerts data:', error);
    return [];
  }
}

// Filter alerts by date range
function filterByDateRange(startDate, endDate) {
  console.log('filterByDateRange called with:', { startDate, endDate });
  console.log('Total alerts before filter:', allAlerts.length);

  if (!startDate || !endDate) {
    filteredAlerts = allAlerts;
  } else {
    filteredAlerts = allAlerts.filter(alert => {
      return alert.date >= startDate && alert.date <= endDate;
    });
  }

  dateRange.start = startDate || allAlerts[0]?.date;
  dateRange.end = endDate || allAlerts[allAlerts.length - 1]?.date;

  console.log(`Filtered to ${filteredAlerts.length} alerts (${dateRange.start} to ${dateRange.end})`);
  console.log('Dispatching dataFiltered event...');

  // Trigger update event
  window.dispatchEvent(new CustomEvent('dataFiltered', {
    detail: { alerts: filteredAlerts, dateRange }
  }));

  return filteredAlerts;
}

// Get aggregated data by basket and hour
function aggregateByBasketAndHour(alerts = filteredAlerts) {
  const result = {
    'Meat Fryer 1': {},
    'Meat Fryer 2': {},
    'Veg Fryer 3': {},
    'Veg Fryer 4': {}
  };

  alerts.forEach(alert => {
    const basket = alert.basket;
    const hour = alert.hour;

    if (!result[basket]) return;
    result[basket][hour] = (result[basket][hour] || 0) + 1;
  });

  return result;
}

// Get aggregated data by basket and status
function aggregateByBasketAndStatus(alerts = filteredAlerts) {
  const result = {
    'Meat Fryer 1': { firing: 0, resolved: 0, notification: 0 },
    'Meat Fryer 2': { firing: 0, resolved: 0, notification: 0 },
    'Veg Fryer 3': { firing: 0, resolved: 0, notification: 0 },
    'Veg Fryer 4': { firing: 0, resolved: 0, notification: 0 }
  };

  alerts.forEach(alert => {
    const basket = alert.basket;
    const status = alert.status;

    if (!result[basket]) return;
    if (!result[basket][status]) result[basket][status] = 0;
    result[basket][status]++;
  });

  return result;
}

// Get firing vs resolved by basket and hour
function aggregateFiringResolvedByHour(basket, alerts = filteredAlerts) {
  const firing = {};
  const resolved = {};

  alerts
    .filter(a => a.basket === basket)
    .forEach(alert => {
      const hour = alert.hour;
      if (alert.status === 'firing') {
        firing[hour] = (firing[hour] || 0) + 1;
      } else if (alert.status === 'resolved') {
        resolved[hour] = (resolved[hour] || 0) + 1;
      }
    });

  return { firing, resolved };
}

// Get summary statistics
function getSummaryStats(alerts = filteredAlerts) {
  const basketCounts = {};
  const hourCounts = {};
  let peakHour = 0;
  let maxCount = 0;

  alerts.forEach(alert => {
    // Count by basket
    basketCounts[alert.basket] = (basketCounts[alert.basket] || 0) + 1;

    // Count by hour
    hourCounts[alert.hour] = (hourCounts[alert.hour] || 0) + 1;

    // Track peak hour
    if (hourCounts[alert.hour] > maxCount) {
      maxCount = hourCounts[alert.hour];
      peakHour = alert.hour;
    }
  });

  return {
    total: alerts.length,
    basketCounts,
    hourCounts,
    peakHour,
    peakHourCount: maxCount
  };
}

// Get aggregated data by day
function aggregateAlertsByDay(alerts = filteredAlerts) {
  const basketDateCounts = {
    'Meat Fryer 1': {},
    'Meat Fryer 2': {},
    'Veg Fryer 3': {},
    'Veg Fryer 4': {}
  };

  alerts.forEach(alert => {
    const date = alert.date;
    const basket = alert.basket;

    if (basketDateCounts[basket]) {
      basketDateCounts[basket][date] = (basketDateCounts[basket][date] || 0) + 1;
    }
  });

  // Get all unique dates and sort them
  const allDates = new Set();
  Object.values(basketDateCounts).forEach(dateCounts => {
    Object.keys(dateCounts).forEach(date => allDates.add(date));
  });
  const dates = Array.from(allDates).sort();

  // Format labels (e.g., "Nov 10" or "11/10" for short)
  const labels = dates.map(date => {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  // Get counts for each basket
  const basketCounts = {
    'Meat Fryer 1': dates.map(date => basketDateCounts['Meat Fryer 1'][date] || 0),
    'Meat Fryer 2': dates.map(date => basketDateCounts['Meat Fryer 2'][date] || 0),
    'Veg Fryer 3': dates.map(date => basketDateCounts['Veg Fryer 3'][date] || 0),
    'Veg Fryer 4': dates.map(date => basketDateCounts['Veg Fryer 4'][date] || 0)
  };

  // Total counts per day
  const counts = dates.map((date, i) =>
    basketCounts['Meat Fryer 1'][i] +
    basketCounts['Meat Fryer 2'][i] +
    basketCounts['Veg Fryer 3'][i] +
    basketCounts['Veg Fryer 4'][i]
  );

  return { dates, labels, counts, basketCounts };
}

// Helper: format hour number to label
function hourLabel(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return h + ' AM';
  if (h === 12) return '12 PM';
  return (h - 12) + ' PM';
}
