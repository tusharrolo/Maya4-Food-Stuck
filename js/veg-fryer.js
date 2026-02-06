/* ═══════════════════════════════════════════════════════════
   Veg Fryer Tab — Fryer 3 & 4 Analysis (SGT) - Dynamic Data
   ═══════════════════════════════════════════════════════════ */

let vegCharts = {};

function initVegFryer() {
  renderVegFryerCharts();

  // Listen for data filter changes
  window.addEventListener('dataFiltered', () => {
    updateVegFryerCharts();
  });
}

function renderVegFryerCharts() {
  const hours = Array.from({length: 24}, (_, i) => i);
  const labels = hours.map(h => hourLabel(h));

  // Get veg fryer specific data
  const vegAlerts = filteredAlerts.filter(a => a.basket === 'Veg Fryer 3' || a.basket === 'Veg Fryer 4');
  const veg3Alerts = vegAlerts.filter(a => a.basket === 'Veg Fryer 3');
  const veg4Alerts = vegAlerts.filter(a => a.basket === 'Veg Fryer 4');

  // Aggregate by hour
  const veg3ByHour = {};
  const veg4ByHour = {};
  veg3Alerts.forEach(a => { veg3ByHour[a.hour] = (veg3ByHour[a.hour] || 0) + 1; });
  veg4Alerts.forEach(a => { veg4ByHour[a.hour] = (veg4ByHour[a.hour] || 0) + 1; });

  const v3data = hours.map(h => veg3ByHour[h] || 0);
  const v4data = hours.map(h => veg4ByHour[h] || 0);
  const combined = hours.map(h => (veg3ByHour[h]||0) + (veg4ByHour[h]||0));

  // Get firing/resolved data
  const veg3Status = aggregateFiringResolvedByHour('Veg Fryer 3');
  const veg4Status = aggregateFiringResolvedByHour('Veg Fryer 4');

  const v3firing = hours.map(h => veg3Status.firing[h] || 0);
  const v3resolved = hours.map(h => veg3Status.resolved[h] || 0);
  const v4firing = hours.map(h => veg4Status.firing[h] || 0);
  const v4resolved = hours.map(h => veg4Status.resolved[h] || 0);

  // Update stats
  updateVegFryerStats(veg3Alerts, veg4Alerts);

  // Destroy existing charts
  Object.values(vegCharts).forEach(chart => chart && chart.destroy());
  vegCharts = {};

  // Main bar chart
  vegCharts.bar = new Chart(document.getElementById('vegBarChart'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Veg Fryer 3',
          data: v3data,
          backgroundColor: 'rgba(231,76,60,0.75)',
          borderColor: 'rgba(231,76,60,1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Veg Fryer 4',
          data: v4data,
          backgroundColor: 'rgba(243,156,18,0.75)',
          borderColor: 'rgba(243,156,18,1)',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
        tooltip: {
          callbacks: {
            afterBody: function(items) {
              const h = items[0].dataIndex;
              return 'Combined: ' + (v3data[h] + v4data[h]);
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 45 } },
        y: { beginAtZero: true, title: { display: true, text: 'Number of Alerts (SGT)', font: { size: 12 } }, ticks: { stepSize: 2 } }
      }
    }
  });

  // Heatmap
  const maxCombined = Math.max(...combined);
  vegCharts.heat = new Chart(document.getElementById('vegHeatChart'), {
    type: 'bar',
    data: {
      labels: ['Alerts'],
      datasets: hours.map((h, i) => ({
        label: labels[i],
        data: [combined[i]],
        backgroundColor: combined[i] === 0 ? '#eee' :
          `rgba(47,84,150,${0.15 + (combined[i]/maxCombined)*0.85})`,
        borderWidth: 0,
        barPercentage: 1,
        categoryPercentage: 1,
      }))
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => labels[items[0].datasetIndex] + ' SGT',
            label: (item) => item.raw + ' alerts'
          }
        }
      },
      scales: {
        x: { stacked: true, display: false },
        y: { stacked: true, display: false }
      }
    }
  });

  // Status charts — only active hours
  const activeHours = combined.map((count, h) => count > 0 ? h : null).filter(h => h !== null);
  const activeLabels = activeHours.map(h => labels[h]);

  vegCharts.status3 = new Chart(document.getElementById('vegStatus3'), {
    type: 'bar',
    data: {
      labels: activeLabels,
      datasets: [
        { label: 'Firing', data: activeHours.map(h => v3firing[h]), backgroundColor: 'rgba(231,76,60,0.8)', borderRadius: 3 },
        { label: 'Resolved', data: activeHours.map(h => v3resolved[h]), backgroundColor: 'rgba(46,204,113,0.8)', borderRadius: 3 },
        { label: 'Notification', data: activeHours.map(h => Math.max(0, v3data[h] - v3firing[h] - v3resolved[h])), backgroundColor: 'rgba(52,152,219,0.5)', borderRadius: 3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { size: 11 } } } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 2 } }
      }
    }
  });

  vegCharts.status4 = new Chart(document.getElementById('vegStatus4'), {
    type: 'bar',
    data: {
      labels: activeLabels,
      datasets: [
        { label: 'Firing', data: activeHours.map(h => v4firing[h]), backgroundColor: 'rgba(231,76,60,0.8)', borderRadius: 3 },
        { label: 'Resolved', data: activeHours.map(h => v4resolved[h]), backgroundColor: 'rgba(46,204,113,0.8)', borderRadius: 3 },
        { label: 'Notification', data: activeHours.map(h => Math.max(0, v4data[h] - v4firing[h] - v4resolved[h])), backgroundColor: 'rgba(52,152,219,0.5)', borderRadius: 3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { size: 11 } } } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 2 } }
      }
    }
  });
}

function updateVegFryerCharts() {
  renderVegFryerCharts();
}

function updateVegFryerStats(veg3Alerts, veg4Alerts) {
  const veg3Count = veg3Alerts.length;
  const veg4Count = veg4Alerts.length;

  // Count by status
  const veg3Firing = veg3Alerts.filter(a => a.status === 'firing').length;
  const veg3Resolved = veg3Alerts.filter(a => a.status === 'resolved').length;
  const veg3Notif = veg3Alerts.filter(a => a.status === 'notification').length;

  const veg4Firing = veg4Alerts.filter(a => a.status === 'firing').length;
  const veg4Resolved = veg4Alerts.filter(a => a.status === 'resolved').length;
  const veg4Notif = veg4Alerts.filter(a => a.status === 'notification').length;

  // Find peak hour
  const hourCounts = {};
  [...veg3Alerts, ...veg4Alerts].forEach(a => {
    hourCounts[a.hour] = (hourCounts[a.hour] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

  // Count active window (12pm-11pm)
  const activeWindow = [...veg3Alerts, ...veg4Alerts].filter(a => a.hour >= 12 && a.hour <= 23).length;
  const activePercent = Math.round((activeWindow / (veg3Count + veg4Count)) * 100);

  // Update subtitle
  const subtitle = document.querySelector('#veg-fryer .subtitle');
  if (subtitle) {
    subtitle.textContent = `Time-of-day distribution (Singapore Time) — ${dateRange.start} to ${dateRange.end} (${veg3Count + veg4Count} alerts)`;
  }

  // Update stat cards
  const statCards = document.querySelectorAll('#veg-fryer .stat-card');
  if (statCards.length >= 4) {
    // Veg Fryer 3
    statCards[0].querySelector('.value').textContent = veg3Count;
    statCards[0].querySelector('.detail').textContent = `${veg3Firing} firing · ${veg3Resolved} resolved · ${veg3Notif} notif`;

    // Veg Fryer 4
    statCards[1].querySelector('.value').textContent = veg4Count;
    statCards[1].querySelector('.detail').textContent = `${veg4Firing} firing · ${veg4Resolved} resolved · ${veg4Notif} notif`;

    // Peak hour
    statCards[2].querySelector('.value').textContent = peakHour ? hourLabel(parseInt(peakHour[0])) : 'N/A';
    statCards[2].querySelector('.detail').textContent = peakHour ? `${peakHour[1]} combined alerts` : '';

    // Active window
    statCards[3].querySelector('.value').textContent = '12p–11p';
    statCards[3].querySelector('.detail').textContent = `${activePercent}% of all alerts`;
  }

  // Update insights
  updateVegFryerInsights(veg3Alerts, veg4Alerts, peakHour);
}

function updateVegFryerInsights(veg3Alerts, veg4Alerts, peakHour) {
  const insightsList = document.querySelector('#veg-fryer .insight-box ul');
  if (!insightsList) return;

  const total = veg3Alerts.length + veg4Alerts.length;
  const veg3Count = veg3Alerts.length;
  const veg4Count = veg4Alerts.length;

  // Evening alerts (5pm-11pm)
  const evening = [...veg3Alerts, ...veg4Alerts].filter(a => a.hour >= 17 && a.hour <= 23).length;
  const eveningPercent = Math.round((evening / total) * 100);

  // Noon spike
  const noon = [...veg3Alerts, ...veg4Alerts].filter(a => a.hour === 12).length;

  // Early morning (2am-10am)
  const morning = [...veg3Alerts, ...veg4Alerts].filter(a => a.hour >= 2 && a.hour <= 10).length;

  // Ratio
  const ratio = veg4Count > 0 ? (veg3Count / veg4Count).toFixed(1) : 'N/A';

  insightsList.innerHTML = `
    <li><strong>${peakHour ? hourLabel(parseInt(peakHour[0])) : 'N/A'} is the #1 problem hour</strong> — ${peakHour ? peakHour[1] : 0} combined alerts, accounting for ${peakHour && total > 0 ? Math.round((peakHour[1]/total)*100) : 0}% of all veg fryer alerts.</li>
    <li><strong>Late afternoon/evening surge (5 PM – 11 PM)</strong> — This window accounts for ${evening} alerts (${eveningPercent}% of total), with sustained high activity across both fryers.</li>
    <li><strong>Noon spike at 12 PM</strong> — ${noon} combined alerts, likely tied to the lunch rush.</li>
    <li><strong>Quiet early hours (2 AM – 10 AM)</strong> — Only ${morning} alerts across this 9-hour window, confirming this is operationally driven during peak kiosk hours.</li>
    <li><strong>Veg Fryer 3 is ${ratio}x more problematic</strong> — ${veg3Count} vs ${veg4Count} alerts.</li>
  `;
}
