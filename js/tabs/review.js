window.Tabs = window.Tabs || {};
window.Tabs.review = (function () {
  let tab = 'weekly';
  let editingKey = null;

  function render(host) {
    const today = Compute.todayISO();
    const trades = Store.get('trades') || [];
    const review = Store.get('review') || { weekly: {}, monthly: {} };

    const key = editingKey || (tab === 'weekly' ? Compute.startOfWeek(today) : Compute.startOfMonth(today));
    const entry = (review[tab] || {})[key] || blank();

    let rangeStart, rangeEnd;
    if (tab === 'weekly') {
      rangeStart = key;
      const e = new Date(key + 'T00:00:00'); e.setDate(e.getDate() + 6);
      rangeEnd = e.toISOString().slice(0, 10);
    } else {
      rangeStart = key;
      const d = new Date(key + 'T00:00:00');
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      rangeEnd = last.toISOString().slice(0, 10);
    }
    const inRange = Compute.tradesInRange(trades, rangeStart, rangeEnd);
    const totals = Compute.totals(inRange);
    const winners = inRange.filter(t => Compute.isWin(t)).sort((a, b) => Compute.pnl(b) - Compute.pnl(a)).slice(0, 5);
    const losers = inRange.filter(t => Compute.isLoss(t)).sort((a, b) => Compute.pnl(a) - Compute.pnl(b)).slice(0, 5);

    host.innerHTML = `
      <div style="display:flex; align-items: center; margin-bottom: 12px; gap: 8px;">
        <div class="toggle">
          <button data-rv="weekly" class="${tab === 'weekly' ? 'active' : ''}">WEEKLY</button>
          <button data-rv="monthly" class="${tab === 'monthly' ? 'active' : ''}">MONTHLY</button>
        </div>
        <input type="${tab === 'weekly' ? 'date' : 'month'}" id="rv-key" value="${tab === 'weekly' ? key : key.slice(0, 7)}" style="height: 32px; padding: 0 10px;" />
        <span class="text-dim" style="font-size: 12px;">Range: ${rangeStart} → ${rangeEnd}</span>
      </div>

      <div class="stat-grid stat-grid-4">
        ${StatCard.render({ label: 'Net P&L', value: Compute.fmtMoney(totals.total), tone: StatCard.tone(totals.total) })}
        ${StatCard.render({ label: 'Trades', value: totals.count, sub: `${totals.wins}W / ${totals.losses}L` })}
        ${StatCard.render({ label: 'Win Rate', value: Compute.fmtPct(totals.winRate) })}
        ${StatCard.render({ label: 'Avg R', value: Compute.fmtNum(totals.avgR) })}
      </div>

      <div class="row-2" style="margin-top:12px;">
        <div class="card">
          <div class="card-title-row"><span class="dot"></span><h3 class="card-title">Reflection</h3></div>
          <div class="form-grid">
            <div class="field full"><label>Themes (what showed up)</label><textarea id="rv-themes" rows="3">${esc(entry.themes)}</textarea></div>
            <div class="field full"><label>What worked</label><textarea id="rv-worked" rows="3">${esc(entry.worked)}</textarea></div>
            <div class="field full"><label>What didn't</label><textarea id="rv-failed" rows="3">${esc(entry.failed)}</textarea></div>
            <div class="field full"><label>Repeat mistakes (named)</label><input id="rv-mistakes" value="${esc((entry.mistakes || []).join(', '))}" placeholder="chased_breakout, oversized" /></div>
            <div class="field full"><label>Adjustments for next ${tab === 'weekly' ? 'week' : 'month'}</label><textarea id="rv-adjust" rows="3">${esc(entry.adjustments)}</textarea></div>
          </div>
          <div style="margin-top: 12px;"><button class="btn btn-primary" id="rv-save"><i data-lucide="save"></i> Save Review</button></div>
        </div>
        <div>
          <div class="card">
            <div class="card-title-row"><span class="dot"></span><h3 class="card-title">Top Winners</h3></div>
            ${winners.length ? winners.map(w => row(w, 'pos')).join('') : '<div class="text-dim" style="font-size:12px;">No wins in range.</div>'}
          </div>
          <div class="card" style="margin-top:12px;">
            <div class="card-title-row"><span class="dot"></span><h3 class="card-title">Top Losers</h3></div>
            ${losers.length ? losers.map(w => row(w, 'neg')).join('') : '<div class="text-dim" style="font-size:12px;">No losses in range.</div>'}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    host.querySelectorAll('[data-rv]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.rv; editingKey = null; render(host); }));
    const keyInput = host.querySelector('#rv-key');
    keyInput.addEventListener('change', e => {
      const v = e.target.value;
      if (tab === 'monthly') editingKey = v + '-01';
      else editingKey = Compute.startOfWeek(v);
      render(host);
    });
    host.querySelector('#rv-save').addEventListener('click', () => {
      const out = {
        themes: host.querySelector('#rv-themes').value,
        worked: host.querySelector('#rv-worked').value,
        failed: host.querySelector('#rv-failed').value,
        mistakes: host.querySelector('#rv-mistakes').value.split(',').map(s => s.trim()).filter(Boolean),
        adjustments: host.querySelector('#rv-adjust').value,
        saved_at: new Date().toISOString(),
        range: { start: rangeStart, end: rangeEnd }
      };
      Store.update('review', obj => {
        obj[tab] = obj[tab] || {};
        obj[tab][key] = out;
      });
      Toast.success(`${tab[0].toUpperCase() + tab.slice(1)} review saved`);
    });
  }

  function row(t, tone) {
    const p = Compute.pnl(t);
    return `<div style="padding: 6px 0; border-bottom: 1px solid var(--border); display: flex; gap: 8px; align-items: center;">
      <strong>${esc(t.symbol || '')}</strong>
      <span class="text-dim" style="font-size:11px;">${t.date}</span>
      <span class="text-dim" style="font-size:11px;">${esc(t.setup || '')}</span>
      <span class="${tone === 'pos' ? 'text-pos' : 'text-neg'}" style="margin-left:auto; font-family: var(--font-mono); font-weight: 600;">${Compute.fmtMoney(p)}</span>
    </div>`;
  }

  function blank() { return { themes: '', worked: '', failed: '', mistakes: [], adjustments: '' }; }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { render };
})();
