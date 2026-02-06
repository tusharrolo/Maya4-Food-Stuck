/* ═══════════════════════════════════════════════════════════
   Overview Tab — Summary across all baskets (with dynamic data)
   ═══════════════════════════════════════════════════════════ */

let overviewCharts = {};

function initOverview() {
  console.log('initOverview called');
  renderOverviewCharts();

  // Listen for data filter changes
  window.addEventListener('dataFiltered', (event) => {
    console.log('dataFiltered event received!', event.detail);
    updateOverviewCharts();
  });
  console.log('dataFiltered event listener added');
}

function renderOverviewCharts() {
  const hours = Array.from({length: 24}, (_, i) => i);
  const labels = hours.map(h => hourLabel(h));

  // Get aggregated data
  const basketHourData = aggregateByBasketAndHour();
  const stats = getSummaryStats();

  // Update statistics cards
  updateOverviewStats(stats);

  // Helper to get data array for a basket
  const getData = (basketName) => hours.map(h => basketHourData[basketName][h] || 0);

  // Destroy existing charts if any
  if (overviewCharts.daily) overviewCharts.daily.destroy();
  if (overviewCharts.hourly) overviewCharts.hourly.destroy();
  if (overviewCharts.doughnut) overviewCharts.doughnut.destroy();

  // Daily alerts chart (stacked by basket)
  const dailyData = aggregateAlertsByDay();
  overviewCharts.daily = new Chart(document.getElementById('dailyAlerts'), {
    type: 'bar',
    data: {
      labels: dailyData.labels,
      dates: dailyData.dates, // Store dates for fries overlay
      datasets: [
        { label: 'Meat Fryer 1', data: dailyData.basketCounts['Meat Fryer 1'], backgroundColor: 'rgba(155,89,182,0.7)', borderRadius: 2 },
        { label: 'Meat Fryer 2', data: dailyData.basketCounts['Meat Fryer 2'], backgroundColor: 'rgba(52,73,94,0.7)', borderRadius: 2 },
        { label: 'Veg Fryer 3', data: dailyData.basketCounts['Veg Fryer 3'], backgroundColor: 'rgba(231,76,60,0.7)', borderRadius: 2 },
        { label: 'Veg Fryer 4', data: dailyData.basketCounts['Veg Fryer 4'], backgroundColor: 'rgba(243,156,18,0.7)', borderRadius: 2 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 16, font: { size: 12 } } },
        tooltip: {
          callbacks: {
            title: (items) => {
              const date = dailyData.dates[items[0].dataIndex];
              return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            },
            afterBody: (items) => {
              const idx = items[0].dataIndex;
              const total = items.reduce((sum, item) => sum + item.raw, 0);
              return 'Total: ' + total;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 20
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: { display: true, text: 'Number of Alerts', font: { size: 12 } },
          ticks: { stepSize: 1 }
        }
      }
    }
  });

  // Stacked bar: all 4 baskets by hour
  overviewCharts.hourly = new Chart(document.getElementById('overviewHourly'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Meat Fryer 1', data: getData('Meat Fryer 1'), backgroundColor: 'rgba(155,89,182,0.7)', borderRadius: 2 },
        { label: 'Meat Fryer 2', data: getData('Meat Fryer 2'), backgroundColor: 'rgba(52,73,94,0.7)', borderRadius: 2 },
        { label: 'Veg Fryer 3', data: getData('Veg Fryer 3'), backgroundColor: 'rgba(231,76,60,0.7)', borderRadius: 2 },
        { label: 'Veg Fryer 4', data: getData('Veg Fryer 4'), backgroundColor: 'rgba(243,156,18,0.7)', borderRadius: 2 },
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
              const total = items.reduce((sum, item) => sum + item.raw, 0);
              return 'Total: ' + total;
            }
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
        y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Alerts (SGT)' } }
      }
    }
  });

  // Doughnut: distribution by basket
  overviewCharts.doughnut = new Chart(document.getElementById('overviewDoughnut'), {
    type: 'doughnut',
    data: {
      labels: ['Meat Fryer 1', 'Meat Fryer 2', 'Veg Fryer 3', 'Veg Fryer 4'],
      datasets: [{
        data: [
          stats.basketCounts['Meat Fryer 1'] || 0,
          stats.basketCounts['Meat Fryer 2'] || 0,
          stats.basketCounts['Veg Fryer 3'] || 0,
          stats.basketCounts['Veg Fryer 4'] || 0
        ],
        backgroundColor: ['rgba(155,89,182,0.8)', 'rgba(52,73,94,0.8)', 'rgba(231,76,60,0.8)', 'rgba(243,156,18,0.8)'],
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

function updateOverviewCharts() {
  console.log('updateOverviewCharts called - recreating all charts');
  console.log('Filtered alerts count:', filteredAlerts.length);

  // Instead of updating, just re-render everything
  renderOverviewCharts();
}

function updateOverviewStats(stats) {
  // Find highest volume basket
  const basketEntries = Object.entries(stats.basketCounts).sort((a, b) => b[1] - a[1]);
  const topBasket = basketEntries[0];
  const secondBasket = basketEntries[1];

  // Calculate veg fryer percentage
  const vegTotal = (stats.basketCounts['Veg Fryer 3'] || 0) + (stats.basketCounts['Veg Fryer 4'] || 0);
  const vegPercent = stats.total > 0 ? Math.round((vegTotal / stats.total) * 100) : 0;

  // Update the subtitle with date range
  const subtitle = document.querySelector('#overview .subtitle');
  if (subtitle) {
    subtitle.textContent = `All "Basket Not Empty" alerts across Maya 4 — ${dateRange.start} to ${dateRange.end}`;
  }

  // Update stat card values
  const statCards = document.querySelectorAll('#overview .stat-card');
  if (statCards.length >= 4) {
    // Total alerts
    statCards[0].querySelector('.value').textContent = stats.total;
    statCards[0].querySelector('.detail').textContent = 'across 4 baskets';

    // Highest volume basket
    statCards[1].querySelector('.label').textContent = topBasket ? topBasket[0] : 'N/A';
    statCards[1].querySelector('.value').textContent = topBasket ? topBasket[1] : 0;
    statCards[1].querySelector('.detail').textContent = 'highest volume';

    // Second highest
    statCards[2].querySelector('.label').textContent = secondBasket ? secondBasket[0] : 'N/A';
    statCards[2].querySelector('.value').textContent = secondBasket ? secondBasket[1] : 0;
    statCards[2].querySelector('.detail').textContent = '2nd highest';

    // Peak hour
    statCards[3].querySelector('.value').textContent = hourLabel(stats.peakHour);
  }

  // Update key findings
  updateOverviewInsights(stats, vegPercent);
}

function updateOverviewInsights(stats, vegPercent) {
  const insightsList = document.querySelector('#overview .insight-box ul');
  if (!insightsList) return;

  const vegTotal = (stats.basketCounts['Veg Fryer 3'] || 0) + (stats.basketCounts['Veg Fryer 4'] || 0);
  const basketEntries = Object.entries(stats.basketCounts).sort((a, b) => b[1] - a[1]);

  // Count evening alerts (5 PM to 11 PM)
  const eveningAlerts = filteredAlerts.filter(a => a.hour >= 17 && a.hour <= 23).length;

  // Count early morning alerts (2 AM to 10 AM)
  const morningAlerts = filteredAlerts.filter(a => a.hour >= 2 && a.hour <= 10).length;

  insightsList.innerHTML = `
    <li><strong>Veg fryers account for ${vegPercent}% of all alerts</strong> — ${vegTotal} out of ${stats.total} total, with ${basketEntries[0][0]} being the worst offender.</li>
    <li><strong>Evening hours dominate</strong> — The 5 PM to 11 PM window (SGT) drives ${eveningAlerts} alerts (${Math.round((eveningAlerts/stats.total)*100)}% of total).</li>
    <li><strong>${hourLabel(stats.peakHour)} is consistently the peak</strong> — This is the single busiest hour with ${stats.peakHourCount} alerts.</li>
    <li><strong>12 PM lunch rush</strong> — ${stats.hourCounts[12] || 0} alerts at noon, likely tied to high-volume order periods.</li>
    <li><strong>Early morning is quiet</strong> — 2 AM to 10 AM sees only ${morningAlerts} alerts, confirming operational patterns.</li>
  `;
}
