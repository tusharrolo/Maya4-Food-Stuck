/* ═══════════════════════════════════════════════════════════
   App Core — Shared Utilities
   ═══════════════════════════════════════════════════════════ */

// Shared chart defaults
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#666';

// Helper: format hour number to label
function hourLabel(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return h + ' AM';
  if (h === 12) return '12 PM';
  return (h - 12) + ' PM';
}

// Helper: generate hour labels array
function getHourLabels() {
  return Array.from({length: 24}, (_, i) => hourLabel(i));
}

// Date filter controls
function initDateFilter() {
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const applyBtn = document.getElementById('applyFilter');
  const resetBtn = document.getElementById('resetFilter');

  // Set initial dates from loaded data
  if (dateRange.start && dateRange.end) {
    startDateInput.value = dateRange.start;
    endDateInput.value = dateRange.end;
  }

  // Apply filter
  applyBtn.addEventListener('click', () => {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    console.log('Apply filter clicked:', { startDate, endDate });

    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (startDate > endDate) {
      alert('Start date must be before end date');
      return;
    }

    console.log('Applying filter...');
    filterByDateRange(startDate, endDate);
  });

  // Reset filter
  resetBtn.addEventListener('click', () => {
    if (allAlerts.length > 0) {
      const dates = allAlerts.map(a => a.date).sort();
      startDateInput.value = dates[0];
      endDateInput.value = dates[dates.length - 1];
      filterByDateRange(dates[0], dates[dates.length - 1]);
    }
  });
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  // Load alerts data first
  await loadAlertsData();

  // Initialize date filter
  initDateFilter();

  // Init overview dashboard with loaded data
  if (typeof initOverview === 'function') initOverview();
});
