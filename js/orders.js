/* ═══════════════════════════════════════════════════════════
   Orders Overlay — Fries Order Data on Alert Charts
   Loads maya4_orders.json and overlays on existing charts
   ═══════════════════════════════════════════════════════════ */

let ordersData = null;

async function loadOrdersData() {
  try {
    const resp = await fetch('data/maya4_orders.json');
    ordersData = await resp.json();

    // Listen for data filter changes to re-add overlays
    window.addEventListener('dataFiltered', () => {
      // Wait a bit for charts to be recreated
      setTimeout(() => {
        if (typeof addFriesOverlayToDailyChart === 'function') {
          addFriesOverlayToDailyChart();
        }
        if (typeof addFriesOverlayToHourlyChart === 'function') {
          addFriesOverlayToHourlyChart();
        }
      }, 100);
    });

    return ordersData;
  } catch (e) {
    console.warn('Could not load orders data:', e);
    return null;
  }
}

function initOrdersTab() {
  if (!ordersData) return;

  const hours = Array.from({length: 24}, (_, i) => i);
  const labels = getHourLabels();

  // Build hourly arrays from the data
  const hourlyFries = hours.map(h => ordersData.hourly_fries[h] || 0);
  const hourlyAll   = hours.map(h => ordersData.hourly_all_orders[h] || 0);
  const hourlyNoFries = hours.map(h => (ordersData.hourly_all_orders[h] || 0) - (ordersData.hourly_fries[h] || 0));

  // Build daily arrays (sorted by date)
  const dailyDates = Object.keys(ordersData.daily_all_orders).sort();
  const dailyLabels = dailyDates.map(d => {
    const parts = d.split('-');
    return parts[1] + '/' + parts[2]; // MM/DD format
  });
  const dailyFries = dailyDates.map(d => ordersData.daily_fries[d] || 0);
  const dailyAll   = dailyDates.map(d => ordersData.daily_all_orders[d] || 0);
  const dailyNoFries = dailyDates.map((d, i) => dailyAll[i] - dailyFries[i]);

  // Populate stat cards
  document.getElementById('orderTotal').textContent = ordersData.meta.total_orders.toLocaleString();
  document.getElementById('orderFries').textContent = ordersData.meta.orders_with_fries.toLocaleString();
  document.getElementById('orderFriesPct').textContent = ordersData.meta.fries_percentage + '%';
  document.getElementById('orderWaffle').textContent = ordersData.fries_types['Waffle Fries'].toLocaleString();
  document.getElementById('orderRegular').textContent = ordersData.fries_types['Fries'].toLocaleString();

  // ── Chart 1: Hourly Orders (Fries vs No-Fries, stacked bar) ──
  new Chart(document.getElementById('ordersHourly'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Orders with Fries',
          data: hourlyFries,
          backgroundColor: 'rgba(230, 126, 34, 0.8)',
          borderRadius: 3,
        },
        {
          label: 'Orders without Fries',
          data: hourlyNoFries,
          backgroundColor: 'rgba(189, 195, 199, 0.6)',
          borderRadius: 3,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 16, font: { size: 12 } } },
        tooltip: {
          callbacks: {
            afterBody: (items) => {
              const idx = items[0].dataIndex;
              return 'Total orders: ' + hourlyAll[idx] + '\nFries %: ' + (hourlyAll[idx] ? Math.round(hourlyFries[idx] / hourlyAll[idx] * 100) : 0) + '%';
            }
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
        y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Number of Orders (SGT)' } }
      }
    }
  });

  // ── Chart 2: Daily Trend (line chart, fries vs total) ──
  new Chart(document.getElementById('ordersDaily'), {
    type: 'line',
    data: {
      labels: dailyLabels,
      datasets: [
        {
          label: 'Total Orders',
          data: dailyAll,
          borderColor: 'rgba(52, 152, 219, 0.9)',
          backgroundColor: 'rgba(52, 152, 219, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'Orders with Fries',
          data: dailyFries,
          borderColor: 'rgba(230, 126, 34, 0.9)',
          backgroundColor: 'rgba(230, 126, 34, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 16 } },
        tooltip: {
          callbacks: {
            afterBody: (items) => {
              const idx = items[0].dataIndex;
              return 'Fries %: ' + (dailyAll[idx] ? Math.round(dailyFries[idx] / dailyAll[idx] * 100) : 0) + '%';
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 60, autoSkip: true, maxTicksLimit: 20 } },
        y: { beginAtZero: true, title: { display: true, text: 'Orders per Day' } }
      }
    }
  });

  // ── Chart 3: Fries Type Doughnut ──
  new Chart(document.getElementById('ordersFriesType'), {
    type: 'doughnut',
    data: {
      labels: ['Regular Fries', 'Waffle Fries'],
      datasets: [{
        data: [ordersData.fries_types['Fries'], ordersData.fries_types['Waffle Fries']],
        backgroundColor: ['rgba(230, 126, 34, 0.85)', 'rgba(241, 196, 15, 0.85)'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } }
      }
    }
  });
}

/* ═══ Overlay: Add fries-order line onto the daily alerts chart ═══ */
function addFriesOverlayToDailyChart() {
  if (!ordersData) return;

  const chart = Chart.getChart('dailyAlerts');
  if (!chart) {
    console.warn('Daily alerts chart not found');
    return;
  }

  // Get the dates from the chart data
  const chartDates = chart.data.dates || [];

  // Build fries orders array matching the chart dates
  const friesOrders = chartDates.map(date => ordersData.daily_fries[date] || 0);

  // Add secondary Y-axis
  chart.options.scales.y2 = {
    position: 'right',
    beginAtZero: true,
    title: { display: true, text: 'Fries Orders', font: { size: 11 }, color: '#e67e22' },
    grid: { drawOnChartArea: false },
    ticks: { color: '#e67e22', stepSize: 50 }
  };

  // Add fries overlay dataset
  chart.data.datasets.push({
    label: 'Fries Orders',
    data: friesOrders,
    type: 'line',
    borderColor: 'rgba(230, 126, 34, 1)',
    backgroundColor: 'rgba(230, 126, 34, 0.1)',
    borderWidth: 2.5,
    pointRadius: 3,
    pointHoverRadius: 6,
    pointBackgroundColor: '#e67e22',
    tension: 0.3,
    yAxisID: 'y2',
    order: 0, // draw on top
    fill: false
  });

  chart.update();
}

/* ═══ Overlay: Add fries-order line onto the hourly alerts chart ═══ */
function addFriesOverlayToHourlyChart() {
  if (!ordersData) return;

  const hours = Array.from({length: 24}, (_, i) => i);
  const hourlyFries = hours.map(h => ordersData.hourly_fries[h] || 0);

  const chart = Chart.getChart('overviewHourly');
  if (!chart) return;

  // Add secondary Y-axis
  chart.options.scales.y2 = {
    position: 'right',
    beginAtZero: true,
    title: { display: true, text: 'Fries Orders', font: { size: 11 }, color: '#e67e22' },
    grid: { drawOnChartArea: false },
    ticks: { color: '#e67e22' }
  };

  // Add fries overlay dataset
  chart.data.datasets.push({
    label: 'Fries Orders',
    data: hourlyFries,
    type: 'line',
    borderColor: 'rgba(230, 126, 34, 1)',
    backgroundColor: 'rgba(230, 126, 34, 0.1)',
    borderWidth: 2.5,
    pointRadius: 3,
    pointHoverRadius: 6,
    pointBackgroundColor: '#e67e22',
    tension: 0.3,
    yAxisID: 'y2',
    order: 0 // draw on top
  });

  chart.update();
}
