window.StatCard = (function () {
  // tone: 'pos' | 'neg' | 'neutral'
  function render({ label, value, sub, tone = 'neutral', info }) {
    const cls = tone === 'pos' ? ' is-positive' : tone === 'neg' ? ' is-negative' : '';
    return `
      <div class="stat-card${cls}">
        <div class="stat-label">${esc(label)}${info ? '<span class="info" title="' + esc(info) + '">i</span>' : ''}</div>
        <div class="stat-value">${value}</div>
        ${sub ? `<div class="stat-sub">${sub}</div>` : ''}
      </div>
    `;
  }
  function tone(value) {
    const n = Number(value);
    if (!isFinite(n) || n === 0) return 'neutral';
    return n > 0 ? 'pos' : 'neg';
  }
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  return { render, tone };
})();
