window.Tabs = window.Tabs || {};
window.Tabs.trades = (function () {
  let filters = { dateFrom: '', dateTo: '', asset: '', side: '', search: '', mistake: '' };
  let sortKey = 'date', sortDir = 'desc';
  let expandedId = null;

  function render(host) {
    const all = Store.get('trades') || [];
    const filtered = applyFilters(all);
    sortTrades(filtered);
    const t = Compute.totals(filtered);

    host.innerHTML = `
      <div class="stat-grid stat-grid-4">
        ${StatCard.render({ label: 'Filtered P&L', value: Compute.fmtMoney(t.total), tone: StatCard.tone(t.total) })}
        ${StatCard.render({ label: 'Trades', value: t.count, sub: `${t.wins}W / ${t.losses}L` })}
        ${StatCard.render({ label: 'Win Rate', value: Compute.fmtPct(t.winRate) })}
        ${StatCard.render({ label: 'Avg R', value: Compute.fmtNum(t.avgR) })}
      </div>

      <div class="card" style="padding: 12px;">
        <div style="display:flex; flex-wrap: wrap; gap: 8px; align-items: end;">
          <div class="field" style="min-width: 130px;"><label>From</label><input type="date" id="f-from" value="${filters.dateFrom}" /></div>
          <div class="field" style="min-width: 130px;"><label>To</label><input type="date" id="f-to" value="${filters.dateTo}" /></div>
          <div class="field" style="min-width: 130px;"><label>Asset</label>
            <select id="f-asset">
              <option value="">All</option>
              <option value="stock" ${filters.asset === 'stock' ? 'selected' : ''}>Stock</option>
              <option value="option" ${filters.asset === 'option' ? 'selected' : ''}>Option</option>
              <option value="future" ${filters.asset === 'future' ? 'selected' : ''}>Future</option>
              <option value="crypto" ${filters.asset === 'crypto' ? 'selected' : ''}>Crypto</option>
            </select>
          </div>
          <div class="field" style="min-width: 110px;"><label>Side</label>
            <select id="f-side">
              <option value="">All</option>
              <option value="long" ${filters.side === 'long' ? 'selected' : ''}>Long</option>
              <option value="short" ${filters.side === 'short' ? 'selected' : ''}>Short</option>
            </select>
          </div>
          <div class="field" style="min-width: 200px; flex:1;"><label>Search symbol / setup / thesis</label>
            <input type="search" id="f-search" placeholder="AAPL, vwap_reclaim..." value="${filters.search}" />
          </div>
          <button class="btn btn-ghost" id="f-clear">Clear</button>
        </div>
      </div>

      <div class="table-wrap" style="margin-top:12px;">
        <table class="table">
          ${TradeRow.header()}
          <tbody id="trades-body">
            ${filtered.length ? filtered.map(t => TradeRow.row(t) + (t.id === expandedId ? TradeRow.detail(t) : '')).join('') :
              '<tr><td colspan="9"><div class="empty"><div class="emoji">📒</div><h3>No trades yet</h3><div>Click <strong>+ Add Trade</strong> to log your first one.</div></div></td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Filters
    host.querySelector('#f-from').addEventListener('change', e => { filters.dateFrom = e.target.value; render(host); });
    host.querySelector('#f-to').addEventListener('change', e => { filters.dateTo = e.target.value; render(host); });
    host.querySelector('#f-asset').addEventListener('change', e => { filters.asset = e.target.value; render(host); });
    host.querySelector('#f-side').addEventListener('change', e => { filters.side = e.target.value; render(host); });
    host.querySelector('#f-search').addEventListener('input', e => { filters.search = e.target.value; render(host); });
    host.querySelector('#f-clear').addEventListener('click', () => {
      filters = { dateFrom: '', dateTo: '', asset: '', side: '', search: '', mistake: '' };
      render(host);
    });

    // Row expand
    host.querySelectorAll('.trade-row').forEach(tr => {
      tr.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        const id = tr.dataset.tradeId;
        expandedId = expandedId === id ? null : id;
        render(host);
      });
    });

    // Detail-row buttons
    host.querySelectorAll('[data-action="edit-trade"]').forEach(b => b.addEventListener('click', () => {
      const t = (Store.get('trades') || []).find(x => x.id === b.dataset.id);
      if (t) TradeForm.open(t);
    }));
    host.querySelectorAll('[data-action="delete-trade"]').forEach(b => b.addEventListener('click', async () => {
      if (await Modal.confirm({ title: 'Delete trade', message: 'This cannot be undone.', okText: 'Delete', danger: true })) {
        Store.update('trades', list => list.filter(x => x.id !== b.dataset.id));
        Toast.success('Trade deleted');
      }
    }));
  }

  function applyFilters(arr) {
    return arr.filter(t => {
      if (filters.dateFrom && t.date < filters.dateFrom) return false;
      if (filters.dateTo && t.date > filters.dateTo) return false;
      if (filters.asset && t.asset_class !== filters.asset) return false;
      if (filters.side && t.side !== filters.side) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const blob = ((t.symbol || '') + ' ' + (t.setup || '') + ' ' + (t.thesis || '')).toLowerCase();
        if (!blob.includes(s)) return false;
      }
      if (filters.mistake && !(t.mistakes || []).includes(filters.mistake)) return false;
      return true;
    });
  }

  function sortTrades(arr) {
    arr.sort((a, b) => {
      if (sortKey === 'date') {
        const av = (a.date || '') + ' ' + (a.entry_time || '');
        const bv = (b.date || '') + ' ' + (b.entry_time || '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return 0;
    });
  }

  return { render, setFilter: f => { Object.assign(filters, f); } };
})();
