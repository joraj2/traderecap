window.Tabs = window.Tabs || {};
window.Tabs.calendar = (function () {
  const today = new Date();
  let view = 'month';
  let year = today.getFullYear();
  let month = today.getMonth() + 1; // 1..12

  function render(host) {
    const trades = Store.get('trades') || [];
    const todayISO = Compute.todayISO();

    let body = '';
    if (view === 'year') body = renderYear(trades);
    else if (view === 'week') body = renderWeek(trades, todayISO);
    else body = renderMonth(trades, todayISO);

    host.innerHTML = `
      <div class="cal-controls">
        <div class="toggle">
          <button data-view="year" class="${view === 'year' ? 'active' : ''}">YEAR</button>
          <button data-view="month" class="${view === 'month' ? 'active' : ''}">MONTH</button>
          <button data-view="week" class="${view === 'week' ? 'active' : ''}">WEEK</button>
        </div>
        <button class="btn btn-icon" id="cal-prev"><i data-lucide="chevron-left"></i></button>
        <h2 style="margin: 0 6px; font-size: 18px;">${labelFor()}</h2>
        <button class="btn btn-icon" id="cal-next"><i data-lucide="chevron-right"></i></button>
        <button class="btn btn-ghost btn-sm" id="cal-today" style="margin-left: 8px;">Today</button>
        <div style="margin-left:auto;"></div>
      </div>
      ${body}
    `;

    if (window.lucide) lucide.createIcons();

    host.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { view = b.dataset.view; render(host); }));
    host.querySelector('#cal-prev').addEventListener('click', () => { step(-1); render(host); });
    host.querySelector('#cal-next').addEventListener('click', () => { step(1); render(host); });
    host.querySelector('#cal-today').addEventListener('click', () => {
      year = today.getFullYear(); month = today.getMonth() + 1; render(host);
    });

    // Day click → trades for date
    host.querySelectorAll('[data-cal-day]').forEach(d => d.addEventListener('click', () => {
      const iso = d.dataset.calDay;
      const day = (Store.get('trades') || []).filter(t => t.date === iso);
      const body = document.createElement('div');
      if (!day.length) {
        body.innerHTML = `<div class="empty"><div class="emoji">📅</div><h3>No trades on ${iso}</h3></div>`;
      } else {
        const t = Compute.totals(day);
        body.innerHTML = `
          <div class="stat-grid stat-grid-3" style="margin-bottom: 12px;">
            ${StatCard.render({ label: 'Net P&L', value: Compute.fmtMoney(t.total), tone: StatCard.tone(t.total) })}
            ${StatCard.render({ label: 'Trades', value: t.count, sub: `${t.wins}W / ${t.losses}L` })}
            ${StatCard.render({ label: 'Win Rate', value: Compute.fmtPct(t.winRate) })}
          </div>
          <div class="table-wrap">
            <table class="table">${TradeRow.header()}<tbody>${day.map(x => TradeRow.row(x)).join('')}</tbody></table>
          </div>
        `;
      }
      Modal.open({ title: Compute.dateLong(iso), body, width: 920 });
    }));
  }

  function step(delta) {
    if (view === 'month') {
      month += delta;
      if (month < 1) { month = 12; year--; }
      else if (month > 12) { month = 1; year++; }
    } else if (view === 'year') {
      year += delta;
    } else if (view === 'week') {
      const d = new Date(year, month - 1, 15);
      d.setDate(d.getDate() + delta * 7);
      year = d.getFullYear(); month = d.getMonth() + 1;
    }
  }

  function labelFor() {
    if (view === 'year') return year;
    if (view === 'month') return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (view === 'week') return `Week of ${new Date(year, month - 1, 15).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
  }

  function renderMonth(trades, todayISO) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const inMonth = Compute.tradesInRange(trades, monthStart, monthEnd);
    const totals = Compute.totals(inMonth);
    const dayMap = CalendarGrid.dayMap(inMonth);

    return `
      <div class="cal-stats">
        ${miniStat('NET P&L', Compute.fmtMoney(totals.total), StatCard.tone(totals.total))}
        ${miniStat('GROSS P&L', Compute.fmtMoney(totals.grossWins - totals.grossLosses), 'neutral')}
        ${miniStat('FEES', Compute.fmtMoney(-totals.fees, false), 'neg')}
        ${miniStat('POINTS', Compute.fmtNum(sumR(inMonth)), 'neutral')}
        ${miniStat('TRADES', totals.count + '', 'neutral')}
        ${miniStat('WIN RATE', Compute.fmtPct(totals.winRate), 'neutral')}
      </div>
      ${CalendarGrid.renderMonth({ year, month, dayPnLMap: dayMap, todayISO })}
    `;
  }

  function renderYear(trades) {
    let html = '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">';
    for (let m = 1; m <= 12; m++) {
      const monthStart = `${year}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(year, m, 0).getDate();
      const monthEnd = `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const slice = Compute.tradesInRange(trades, monthStart, monthEnd);
      const totals = Compute.totals(slice);
      const cls = totals.total > 0 ? 'is-positive' : totals.total < 0 ? 'is-negative' : '';
      html += `
        <div class="stat-card ${cls}" style="cursor:pointer" data-go-month="${m}">
          <div class="stat-label">${new Date(year, m - 1, 1).toLocaleDateString(undefined, { month: 'long' })}</div>
          <div class="stat-value">${Compute.fmtMoney(totals.total)}</div>
          <div class="stat-sub">${totals.count} trades · ${Compute.fmtPct(totals.winRate)}</div>
        </div>
      `;
    }
    html += '</div>';
    setTimeout(() => {
      document.querySelectorAll('[data-go-month]').forEach(el => el.addEventListener('click', () => {
        month = +el.dataset.goMonth; view = 'month';
        render(document.getElementById('content'));
      }));
    }, 0);
    return html;
  }

  function renderWeek(trades, todayISO) {
    const weekStart = Compute.startOfWeek(todayISO);
    const ws = new Date(weekStart + 'T00:00:00');
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws); d.setDate(ws.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
    const slice = Compute.tradesInRange(trades, days[0], days[6]);
    const totals = Compute.totals(slice);
    const dayMap = CalendarGrid.dayMap(slice);

    let cells = '';
    for (const iso of days) {
      const data = dayMap[iso];
      const tone = data ? (data.pnl > 0 ? 'win' : data.pnl < 0 ? 'loss' : '') : '';
      cells += `<div class="cal-day ${tone}${iso === todayISO ? ' today' : ''}" data-cal-day="${iso}" style="min-height: 140px;">
        <div class="cal-date">${new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        ${data ? `<div class="cal-pnl ${data.pnl >= 0 ? 'pos' : 'neg'}">${Compute.fmtMoneyShort(data.pnl)}</div><div class="cal-trades">${data.count} trades</div>` : '<div class="text-dim" style="margin:auto; font-size: 11px;">No trades</div>'}
      </div>`;
    }
    return `
      <div class="cal-stats">
        ${miniStat('NET P&L', Compute.fmtMoney(totals.total), StatCard.tone(totals.total))}
        ${miniStat('TRADES', totals.count + '', 'neutral')}
        ${miniStat('WIN RATE', Compute.fmtPct(totals.winRate), 'neutral')}
        ${miniStat('AVG R', Compute.fmtNum(totals.avgR), 'neutral')}
        ${miniStat('BEST', Compute.fmtMoney(totals.bestTrade), 'pos')}
        ${miniStat('WORST', Compute.fmtMoney(totals.worstTrade), 'neg')}
      </div>
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;">${cells}</div>
    `;
  }

  function sumR(trades) {
    return trades.reduce((a, t) => a + (Compute.rMultiple(t) || 0), 0);
  }

  function miniStat(label, value, tone) {
    const cls = tone === 'pos' ? 'is-positive' : tone === 'neg' ? 'is-negative' : '';
    return `<div class="stat-card ${cls}"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`;
  }

  return { render };
})();
