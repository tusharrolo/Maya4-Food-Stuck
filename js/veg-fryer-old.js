/* ═══════════════════════════════════════════════════════════
   Veg Fryer Tab — Fryer 3 & 4 Analysis (SGT)
   ═══════════════════════════════════════════════════════════ */

function initVegFryer() {
  const hours = Array.from({length: 24}, (_, i) => i);
  const labels = getHourLabels();

  // SGT-corrected hourly totals
  const veg3 = {0:3,1:1,8:3,10:3,11:2,12:11,13:3,14:4,15:4,16:3,17:10,18:11,19:8,20:11,21:9,22:9,23:17};
  const veg4 = {0:1,1:1,11:2,12:10,13:3,14:5,15:2,16:2,17:4,18:5,19:8,20:1,21:2,22:6,23:11};
  const v3data = hours.map(h => veg3[h] || 0);
  const v4data = hours.map(h => veg4[h] || 0);

  // SGT-corrected firing/resolved by hour
  const v3firing =  [0,0,0,0,0,0,0,0,1,0,0,0,4,0,0,1,1,4,4,3,3,3,2,9];
  const v3resolved =[1,0,0,0,0,0,0,0,1,0,0,0,0,2,2,1,1,3,4,2,4,3,3,5];
  const v4firing =  [0,0,0,0,0,0,0,0,0,0,0,0,1,0,2,1,1,1,0,2,0,0,2,2];
  const v4resolved =[0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,2,0,0,1,2];

  const combined = hours.map(h => (veg3[h]||0) + (veg4[h]||0));
  const maxCombined = Math.max(...combined);

  // Main bar chart
  new Chart(document.getElementById('vegBarChart'), {
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
  new Chart(document.getElementById('vegHeatChart'), {
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
  const activeHours = [0,1,8,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
  const activeLabels = activeHours.map(h => labels[h]);

  new Chart(document.getElementById('vegStatus3'), {
    type: 'bar',
    data: {
      labels: activeLabels,
      datasets: [
        { label: 'Firing', data: activeHours.map(h => v3firing[h]), backgroundColor: 'rgba(231,76,60,0.8)', borderRadius: 3 },
        { label: 'Resolved', data: activeHours.map(h => v3resolved[h]), backgroundColor: 'rgba(46,204,113,0.8)', borderRadius: 3 },
        { label: 'Notification', data: activeHours.map(h => v3data[h] - v3firing[h] - v3resolved[h]), backgroundColor: 'rgba(52,152,219,0.5)', borderRadius: 3 }
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

  new Chart(document.getElementById('vegStatus4'), {
    type: 'bar',
    data: {
      labels: activeLabels,
      datasets: [
        { label: 'Firing', data: activeHours.map(h => v4firing[h]), backgroundColor: 'rgba(231,76,60,0.8)', borderRadius: 3 },
        { label: 'Resolved', data: activeHours.map(h => v4resolved[h]), backgroundColor: 'rgba(46,204,113,0.8)', borderRadius: 3 },
        { label: 'Notification', data: activeHours.map(h => v4data[h] - v4firing[h] - v4resolved[h]), backgroundColor: 'rgba(52,152,219,0.5)', borderRadius: 3 }
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
