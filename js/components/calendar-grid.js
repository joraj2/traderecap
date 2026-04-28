window.CalendarGrid = (function () {
  // Build a month grid for the given year/month (1-12)
  // dayPnLMap: { 'YYYY-MM-DD': { pnl, count } }
  // Returns HTML string
  function renderMonth({ year, month, dayPnLMap, todayISO, onClickAttr = 'data-cal-day' }) {
    const first = new Date(year, month - 1, 1);
    const startDay = first.getDay(); // 0 Sun
    // We render a Sunday-start grid like the reference image
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];

    // leading blanks
    for (let i = 0; i < startDay; i++) cells.push({ empty: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const data = dayPnLMap[iso];
      cells.push({ d, iso, pnl: data ? data.pnl : null, count: data ? data.count : 0, isToday: iso === todayISO });
    }
    // Trailing blanks to complete final row
    while (cells.length % 7 !== 0) cells.push({ empty: true });

    const head = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => `<div>${d}</div>`).join('');

    const allPnls = Object.values(dayPnLMap).map(d => Math.abs(d.pnl)).filter(v => v > 0);
    const maxAbs = allPnls.length ? Math.max(...allPnls) : 1;

    const cellsHTML = cells.map(c => {
      if (c.empty) return `<div class="cal-day empty"></div>`;
      const hasData = c.pnl !== null;
      let cls = 'cal-day';
      if (c.isToday) cls += ' today';
      if (hasData) {
        if (c.pnl > 0) cls += ' win' + (Math.abs(c.pnl) / maxAbs > 0.5 ? ' strong' : '');
        else if (c.pnl < 0) cls += ' loss' + (Math.abs(c.pnl) / maxAbs > 0.5 ? ' strong' : '');
      }
      const pnlHTML = hasData
        ? `<div class="cal-pnl ${c.pnl >= 0 ? 'pos' : 'neg'}">${Compute.fmtMoneyShort(c.pnl)}</div>
           <div class="cal-trades">${c.count} trade${c.count === 1 ? '' : 's'}</div>`
        : '';
      return `<div class="${cls}" ${onClickAttr}="${c.iso}">
        <div class="cal-date">${c.d}</div>
        ${pnlHTML}
      </div>`;
    }).join('');

    return `
      <div class="cal-grid">
        <div class="cal-head">${head}</div>
        ${cellsHTML}
      </div>
    `;
  }

  // Get { 'YYYY-MM-DD': { pnl, count } } map from trades
  function dayMap(trades) {
    const map = {};
    for (const t of trades) {
      const m = map[t.date] || (map[t.date] = { pnl: 0, count: 0 });
      m.pnl += Compute.pnl(t);
      m.count++;
    }
    return map;
  }

  return { renderMonth, dayMap };
})();
