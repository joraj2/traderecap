window.Tabs = window.Tabs || {};
window.Tabs.today = (function () {
  function render(host) {
    const settings = Store.get('settings');
    const trades = Store.get('trades') || [];
    const watchlist = Store.get('watchlist') || [];
    const macro = Store.get('macro') || {};
    const today = Compute.todayISO();

    const todayTrades = Compute.tradesForDate(trades, today);
    const t = Compute.totals(trades);
    const todayPnL = Compute.totals(todayTrades).total;

    const streaks = Compute.streaks(trades);
    const greeting = greetingFor(new Date());

    // Goal progress
    const wkStart = Compute.startOfWeek(today);
    const moStart = Compute.startOfMonth(today);
    const yrStart = Compute.startOfYear(today);
    const wkPnl = Compute.totals(Compute.tradesInRange(trades, wkStart, today)).total;
    const moPnl = Compute.totals(Compute.tradesInRange(trades, moStart, today)).total;
    const yrPnl = Compute.totals(Compute.tradesInRange(trades, yrStart, today)).total;

    const goals = settings.goals || {};
    const upcomingWatch = (watchlist || []).filter(w => w.status === 'watching' || w.status === 'triggered').slice(0, 6);
    const todayMacro = macro[today] || null;

    host.innerHTML = `
      <div class="hero">
        <div class="hero-text">
          <div class="hero-title">
            <h2>${greeting}, ${esc(settings.trader_name)}</h2>
            ${streaks.current.n > 1 ? `<span class="streak-badge"><i data-lucide="flame"></i> ${streaks.current.n} ${streaks.current.type === 'W' ? 'green days' : 'red days'}</span>` : ''}
          </div>
          <div class="hero-meta">
            <span><i data-lucide="calendar" class="lucide-inline"></i> ${Compute.dateLong(today)}</span>
            <span class="sep">•</span>
            <span>Total trades logged: <strong class="num">${t.count}</strong></span>
          </div>
        </div>
        <div class="hero-pnl">
          <div class="hero-pnl-label">Today's P&amp;L</div>
          <div class="hero-pnl-value ${todayPnL > 0 ? 'text-pos' : todayPnL < 0 ? 'text-neg' : ''}">
            ${todayTrades.length ? Compute.fmtMoney(todayPnL) : '—'}
          </div>
          <div class="text-dim" style="font-size: 11px; margin-top: 4px;">
            ${todayTrades.length} trade${todayTrades.length === 1 ? '' : 's'} today
          </div>
        </div>
      </div>

      <div class="stat-grid">
        ${StatCard.render({ label: 'Total P&L', value: Compute.fmtMoney(t.total), tone: StatCard.tone(t.total), info: 'All-time net P&L (including fees)' })}
        ${StatCard.render({ label: 'Total Trades', value: t.count, sub: `${t.wins}W / ${t.losses}L`, info: 'All trades ever logged' })}
        ${StatCard.render({ label: 'Win Rate', value: Compute.fmtPct(t.winRate), info: 'Wins ÷ total trades' })}
        ${StatCard.render({ label: 'Profit Factor', value: t.profitFactor === Infinity ? '∞' : Compute.fmtNum(t.profitFactor), info: 'Gross wins ÷ gross losses' })}
        ${StatCard.render({ label: 'Avg R', value: Compute.fmtNum(t.avgR), info: 'Average R-multiple per trade' })}
      </div>

      ${(() => {
        const ins = Compute.insights(trades);
        if (!ins.length) return '';
        return `
          <div class="card" style="margin-top:12px;">
            <div class="card-title-row">
              <span class="dot"></span>
              <h3 class="card-title">Insights</h3>
              <span class="text-dim" style="margin-left:auto; font-size: 11px;">Auto-generated from your trade data</span>
            </div>
            <div class="insights-list">
              ${ins.map(i => `
                <div class="insight ${i.tone || ''}">
                  <div class="insight-label">${esc(i.label)}</div>
                  <div class="insight-value text-2">${esc(i.value)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      })()}

      <details class="t-extra-stats" id="t-extra-stats">
        <summary><span class="text-2" style="font-size:12px;">Show Extended Stats</span></summary>
        <div class="stat-grid stat-grid-4" style="margin-top:8px;">
          ${(() => {
            const curve = Compute.equityCurve(trades);
            const mdd = Compute.maxDrawdown(curve);
            return StatCard.render({ label: 'Max Drawdown', value: Compute.fmtMoney(mdd), tone: 'neg', info: 'Largest peak-to-trough drop' });
          })()}
          ${StatCard.render({ label: 'Sharpe Ratio', value: Compute.fmtNum(Compute.sharpeRatio(trades)), info: 'Annualised, daily P&L' })}
          ${StatCard.render({ label: 'Expectancy', value: Compute.fmtMoney(t.expectancy), tone: StatCard.tone(t.expectancy), info: 'Average $ per trade' })}
          ${StatCard.render({ label: 'Best Trade', value: Compute.fmtMoney(t.bestTrade), tone: 'pos' })}
        </div>

        <div class="stat-grid stat-grid-4">
          ${StatCard.render({ label: 'Worst Trade', value: Compute.fmtMoney(t.worstTrade), tone: 'neg' })}
          ${StatCard.render({ label: 'Streak', value: `${streaks.current.n}${streaks.current.type}`, sub: `Best ${streaks.bestW}W / Worst ${streaks.bestL}L` })}
          ${StatCard.render({ label: 'Avg Win', value: Compute.fmtMoney(t.avgWin), tone: 'pos' })}
          ${StatCard.render({ label: 'Avg Loss', value: Compute.fmtMoney(t.avgLoss), tone: 'neg' })}
        </div>
      </details>

      <div class="card" style="margin-top:12px;">
        <div class="card-title-row">
          <span class="dot"></span>
          <h3 class="card-title">Goal Progress</h3>
        </div>
        <div class="goal-grid">
          ${goalCard('Daily', todayPnL, goals.daily)}
          ${goalCard('Weekly', wkPnl, goals.weekly)}
          ${goalCard('Monthly', moPnl, goals.monthly)}
          ${goalCard('Yearly', yrPnl, goals.yearly)}
        </div>
      </div>

      <div class="row-2" style="margin-top:12px;">
        <div class="card">
          <div class="card-title-row">
            <span class="dot"></span>
            <h3 class="card-title">Today's Trades</h3>
            <button class="btn btn-sm btn-ghost" id="add-trade-quick" style="margin-left:auto;"><i data-lucide="plus"></i> Add</button>
          </div>
          ${todayTrades.length ? `
            <div class="table-wrap" style="border:0;">
              <table class="table">
                ${TradeRow.header()}
                <tbody>
                  ${todayTrades.map(t => TradeRow.row(t)).join('')}
                </tbody>
              </table>
            </div>
          ` : `<div class="empty"><div class="emoji">🎯</div><h3>No Trades Logged Today</h3><div>Click <strong>+ Add Trade</strong> to log one.</div></div>`}
        </div>

        <div class="t-side-cards">
          <div class="card">
            <div class="card-title-row">
              <span class="dot"></span>
              <h3 class="card-title">Watchlist</h3>
              <a href="#watchlist" class="text-dim" style="margin-left:auto; font-size:11px;">View All →</a>
            </div>
            ${upcomingWatch.length ? upcomingWatch.map(w => `
              <div style="padding:8px 0; border-bottom: 1px solid var(--border); display:flex; align-items:center; gap:8px;">
                <strong>${esc(w.symbol || '')}</strong>
                <span class="watch-status ${w.status}">${w.status}</span>
                <span class="text-dim" style="margin-left:auto; font-size:11px;">${esc(w.setup || '')}</span>
              </div>
            `).join('') : `<div class="text-dim" style="padding: 6px 0; font-size: 12px;">No active watch items.</div>`}
          </div>

          <div class="card" style="margin-top:12px;">
            <div class="card-title-row">
              <span class="dot"></span>
              <h3 class="card-title">Market Note</h3>
              <a href="#macro" class="text-dim" style="margin-left:auto; font-size:11px;">Edit →</a>
            </div>
            ${todayMacro ? `
              <div class="text-2" style="font-size: 13px; line-height: 1.5;">
                ${todayMacro.regime ? `<div><span class="text-dim">Regime:</span> ${esc(todayMacro.regime)}</div>` : ''}
                ${todayMacro.bias ? `<div><span class="text-dim">Bias:</span> ${esc(todayMacro.bias)}</div>` : ''}
                ${todayMacro.notes ? `<p style="margin: 8px 0 0;">${esc(todayMacro.notes)}</p>` : ''}
              </div>
            ` : `<div class="text-dim" style="font-size: 12px;">No macro note for today.</div>`}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    const quick = host.querySelector('#add-trade-quick');
    if (quick) quick.addEventListener('click', () => TradeForm.open());

    // Wire trade row clicks
    host.querySelectorAll('.trade-row').forEach(tr => {
      tr.addEventListener('click', () => {
        const id = tr.dataset.tradeId;
        const trade = (Store.get('trades') || []).find(x => x.id === id);
        if (trade) TradeForm.open(trade);
      });
    });
  }

  function goalCard(label, value, target) {
    const pct = target > 0 ? Math.max(0, Math.min(1, value / target)) : 0;
    const neg = value < 0;
    return `
      <div class="goal-card">
        <div class="goal-head">
          <div class="goal-period">${label}</div>
          <div class="goal-pct">${target > 0 ? Math.round(pct * 100) + '%' : '—'}</div>
        </div>
        <div class="goal-value ${value > 0 ? 'text-pos' : value < 0 ? 'text-neg' : ''}">${Compute.fmtMoney(value)}</div>
        <div class="goal-target">/ ${target ? Compute.fmtMoney(target) : '—'}</div>
        <div class="goal-bar"><div class="goal-bar-fill ${neg ? 'neg' : ''}" style="width: ${pct * 100}%"></div></div>
      </div>
    `;
  }

  function greetingFor(d) {
    const h = d.getHours();
    if (h < 5) return 'Late night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { render };
})();
