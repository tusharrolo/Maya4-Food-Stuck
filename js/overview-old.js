/* ═══════════════════════════════════════════════════════════
   Overview Tab — Summary across all baskets
   ═══════════════════════════════════════════════════════════ */

function initOverview() {
  const hours = Array.from({length: 24}, (_, i) => i);
  const labels = getHourLabels();

  // All Maya 4 basket alerts by type (SGT)
  const meatFryer1 = {4:2,5:1,8:1,10:2,12:5,13:2,14:3,15:2,16:1,17:4,18:6,19:3,20:5,21:4,22:3,23:8};
  const meatFryer2 = {0:1,4:1,8:2,11:1,12:4,13:1,14:2,15:3,16:2,17:5,18:4,19:5,20:4,21:3,22:4,23:6};
  const vegFryer3 =  {0:3,1:1,8:3,10:3,11:2,12:11,13:3,14:4,15:4,16:3,17:10,18:11,19:8,20:11,21:9,22:9,23:17};
  const vegFryer4 =  {0:1,1:1,11:2,12:10,13:3,14:5,15:2,16:2,17:4,18:5,19:8,20:1,21:2,22:6,23:11};

  const getData = (obj) => hours.map(h => obj[h] || 0);
  const total = (obj) => Object.values(obj).reduce((a,b) => a+b, 0);

  // Stacked bar: all 4 baskets by hour
  new Chart(document.getElementById('overviewHourly'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Meat Fryer 1', data: getData(meatFryer1), backgroundColor: 'rgba(155,89,182,0.7)', borderRadius: 2 },
        { label: 'Meat Fryer 2', data: getData(meatFryer2), backgroundColor: 'rgba(52,73,94,0.7)', borderRadius: 2 },
        { label: 'Veg Fryer 3', data: getData(vegFryer3), backgroundColor: 'rgba(231,76,60,0.7)', borderRadius: 2 },
        { label: 'Veg Fryer 4', data: getData(vegFryer4), backgroundColor: 'rgba(243,156,18,0.7)', borderRadius: 2 },
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
  new Chart(document.getElementById('overviewDoughnut'), {
    type: 'doughnut',
    data: {
      labels: ['Meat Fryer 1', 'Meat Fryer 2', 'Veg Fryer 3', 'Veg Fryer 4'],
      datasets: [{
        data: [total(meatFryer1), total(meatFryer2), total(vegFryer3), total(vegFryer4)],
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
