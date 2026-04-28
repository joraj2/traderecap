window.ChartUtil = (function () {
  const baseColors = {
    text: '#e6edf0',
    text2: '#8b969c',
    grid: 'rgba(255,255,255,0.04)',
    border: '#1f272a',
    green: '#22c55e',
    greenSoft: 'rgba(34,197,94,0.18)',
    red: '#ef4444',
    redSoft: 'rgba(239,68,68,0.18)'
  };

  function applyDefaults() {
    if (!window.Chart) return;
    Chart.defaults.color = baseColors.text2;
    Chart.defaults.borderColor = baseColors.border;
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.font.size = 11;
  }

  function equity(canvas, points) {
    applyDefaults();
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(34,197,94,0.25)');
    grad.addColorStop(1, 'rgba(34,197,94,0)');
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: points.map(p => p.date),
        datasets: [{
          label: 'Equity',
          data: points.map(p => p.balance),
          borderColor: baseColors.green,
          backgroundColor: grad,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          x: { grid: { color: baseColors.grid }, ticks: { maxTicksLimit: 8 } },
          y: { grid: { color: baseColors.grid }, ticks: { callback: v => '$' + Number(v).toLocaleString() } }
        }
      }
    });
  }

  function bar(canvas, labels, values, opts = {}) {
    applyDefaults();
    return new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: opts.label || '',
          data: values,
          backgroundColor: values.map(v => v >= 0 ? baseColors.greenSoft : baseColors.redSoft),
          borderColor: values.map(v => v >= 0 ? baseColors.green : baseColors.red),
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: baseColors.grid }, ticks: { callback: v => opts.percent ? v + '%' : '$' + Number(v).toLocaleString() } }
        }
      }
    });
  }

  function donut(canvas, labels, values, colors) {
    applyDefaults();
    return new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors || [baseColors.green, baseColors.red, baseColors.text2] }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        cutout: '70%'
      }
    });
  }

  return { equity, bar, donut, colors: baseColors };
})();
