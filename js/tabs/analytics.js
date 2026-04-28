window.Tabs = window.Tabs || {};
window.Tabs.analytics = (function () {
  let charts = [];

  function destroyCharts() { charts.forEach(c => { try { c.destroy(); } catch (e) {} }); charts = []; }

  function render(host) {
    destroyCharts();
    const trades = Store.get('trades') || [];
    const startBalance = Store.get('settings').starting_balance || 0;
    const t = Compute.totals(trades);
    const curve = Compute.equityCurve(trades, startBalance);
    const mdd = Compute.maxDrawdown(curve);
    const streaks = Compute.streaks(trades);

    host.innerHTML = `
      <div class="stat-grid">
        ${StatCard.render({ label: 'Total P&L', value: Compute.fmtMoney(t.total), tone: StatCard.tone(t.total) })}
        ${StatCard.render({ label: 'Total Trades', value: t.count, sub: `${t.wins}W / ${t.losses}L` })}
        ${StatCard.render({ label: 'Win Rate', value: Compute.fmtPct(t.winRate) })}
        ${StatCard.render({ label: 'Profit Factor', value: t.profitFactor === Infinity ? '∞' : Compute.fmtNum(t.profitFactor) })}
        ${StatCard.render({ label: 'Avg R', value: Compute.fmtNum(t.avgR) })}
      </div>
      <div class="stat-grid stat-grid-4">
        ${StatCard.render({ label: 'Max Drawdown', value: Compute.fmtMoney(mdd), tone: 'neg' })}
        ${StatCard.render({ label: 'Sharpe', value: Compute.fmtNum(Compute.sharpeRatio(trades)) })}
        ${StatCard.render({ label: 'Expectancy', value: Compute.fmtMoney(t.expectancy), tone: StatCard.tone(t.expectancy) })}
        ${StatCard.render({ label: 'Streak', value: `${streaks.current.n}${streaks.current.type}`, sub: `Best ${streaks.bestW}W / Worst ${streaks.bestL}L` })}
      </div>

      <div class="card" style="margin-top:12px;">
        <div class="card-title-row"><span class="dot"></span><h3 class="card-title">Equity Curve</h3></div>
        <div style="height: 280px;"><canvas id="equity-c"></canvas></div>
      </div>

      <div class="row-2" style="margin-top:12px;">
        <div class="card">
          <div class="card-title-row"><span class="dot"></span><h3 class="card-title">P&L by Day-of-Week</h3></div>
          <div style="height: 220px;"><canvas id="dow-c"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title-row"><span class="dot"></span><h3 class="card-title">P&L by Asset Class</h3></div>
          <div style="height: 220px;"><canvas id="asset-c"></canvas></div>
        </div>
      </div>

      <div class="row-2" style="margin-top:12px;">
        <div class="card">
          <div class="card-title-row"><span class="dot"></span><h3 class="card-title">P&L by Setup</h3></div>
          <div style="height: 240px;"><canvas id="setup-c"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title-row"><span class="dot"></span><h3 class="card-title">R-Multiple Distribution</h3></div>
          <div style="height: 240px;"><canvas id="r-c"></canvas></div>
        </div>
      </div>

      <div class="card" style="margin-top:12px;">
        <div class="card-title-row"><span class="dot"></span><h3 class="card-title">Top Mistakes (by $ impact)</h3></div>
        <div id="mistakes-table"></div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    if (!trades.length) { return; }

    // Equity
    charts.push(ChartUtil.equity(host.querySelector('#equity-c'), curve));

    // DOW: Mon..Fri
    const dowMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dowTotals = Array(7).fill(0);
    const dowCounts = Array(7).fill(0);
    for (const tr of trades) {
      const d = new Date(tr.date + 'T00:00:00').getDay();
      dowTotals[d] += Compute.pnl(tr);
      dowCounts[d]++;
    }
    const visibleDow = [1, 2, 3, 4, 5, 6, 0].filter(i => dowCounts[i] > 0);
    charts.push(ChartUtil.bar(host.querySelector('#dow-c'),
      visibleDow.map(i => dowMap[i]),
      visibleDow.map(i => dowTotals[i])
    ));

    // Asset class
    const byAsset = Compute.groupBy(trades, 'asset_class');
    const assetLabels = Object.keys(byAsset);
    const assetVals = assetLabels.map(k => Compute.totals(byAsset[k]).total);
    charts.push(ChartUtil.bar(host.querySelector('#asset-c'), assetLabels, assetVals));

    // Setup
    const bySetup = Compute.groupBy(trades, t => t.setup || '(unset)');
    const setupEntries = Object.entries(bySetup).map(([k, v]) => [k, Compute.totals(v).total]).sort((a, b) => b[1] - a[1]).slice(0, 10);
    charts.push(ChartUtil.bar(host.querySelector('#setup-c'),
      setupEntries.map(e => e[0]),
      setupEntries.map(e => e[1])
    ));

    // R distribution: bucket
    const buckets = { '< -2R': 0, '-2 to -1R': 0, '-1 to 0R': 0, '0 to 1R': 0, '1 to 2R': 0, '> 2R': 0 };
    for (const tr of trades) {
      const r = Compute.rMultiple(tr);
      if (r == null) continue;
      if (r < -2) buckets['< -2R']++;
      else if (r < -1) buckets['-2 to -1R']++;
      else if (r < 0) buckets['-1 to 0R']++;
      else if (r < 1) buckets['0 to 1R']++;
      else if (r < 2) buckets['1 to 2R']++;
      else buckets['> 2R']++;
    }
    charts.push(ChartUtil.bar(host.querySelector('#r-c'), Object.keys(buckets), Object.values(buckets)));

    // Mistakes table
    const mistakeDefs = Store.get('mistakes') || [];
    const agg = {};
    for (const tr of trades) {
      for (const m of (tr.mistakes || [])) {
        const a = agg[m] || (agg[m] = { count: 0, impact: 0 });
        a.count++;
        a.impact += Compute.pnl(tr);
      }
    }
    const sorted = Object.entries(agg).sort((a, b) => a[1].impact - b[1].impact);
    const tableHTML = sorted.length ? `
      <div class="table-wrap" style="border:0;">
        <table class="table">
          <thead><tr><th>Mistake</th><th class="num">Count</th><th class="num">Total $ Impact</th><th class="num">Avg $</th></tr></thead>
          <tbody>
            ${sorted.map(([id, d]) => {
              const def = mistakeDefs.find(x => x.id === id);
              return `<tr>
                <td>${esc(def ? def.label : id)}</td>
                <td class="num">${d.count}</td>
                <td class="num ${d.impact < 0 ? 'text-neg' : 'text-pos'}">${Compute.fmtMoney(d.impact)}</td>
                <td class="num">${Compute.fmtMoney(d.impact / d.count)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : `<div class="text-dim" style="font-size: 12px;">No mistakes tagged yet. Tag mistakes on individual trades to surface patterns here.</div>`;
    host.querySelector('#mistakes-table').innerHTML = tableHTML;
  }

  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { render };
})();
